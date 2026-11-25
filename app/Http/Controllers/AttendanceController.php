<?php

namespace App\Http\Controllers;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AttendanceController extends Controller
{
    public function index(Request $request)
    {
        $lateThreshold = app(\App\Services\AttendanceSettingsService::class)->lateThresholdSeconds();
        $user = $request->session()->get('auth_user');
        $attendanceFilter = in_array($request->query('filter'), ['present', 'late', 'not_checked_out'], true) ? $request->query('filter') : '';
        $staff = DB::table('staff')->where('userId', $user['id'])->where('attendance_enabled', true)->first();

        // attendance was created later with utf8mb4_general_ci, while the
        // legacy staff tables use utf8mb4_unicode_ci. Collate both operands so
        // MySQL can perform the join (including the pagination count query).
        $query = DB::table('attendance as a')
            ->leftJoin('staff as s', function ($join) {
                $join->on(
                    DB::raw('s.id COLLATE utf8mb4_unicode_ci'),
                    '=',
                    DB::raw('a.staffId COLLATE utf8mb4_unicode_ci')
                );
            })
            ->leftJoin('user as u', 'u.id', '=', 's.userId')
            ->leftJoinSub(DB::table('overtime_requests')->where('status', 'APPROVED')->whereNotNull('end_at')->select('user_id', 'date')->selectRaw('SUM(minutes) as accepted_minutes')->groupBy('user_id', 'date'), 'ot', function ($join) {
                $join->on(DB::raw('ot.user_id COLLATE utf8mb4_unicode_ci'), '=', DB::raw('s.userId COLLATE utf8mb4_unicode_ci'))->whereRaw('ot.date = DATE(a.date)');
            })
            ->where('s.attendance_enabled', true)
            ->select('a.*', 'u.fullName as staffName')
            ->selectRaw('COALESCE(ot.accepted_minutes, 0) as overtimeMinutes')
            ->orderByDesc('a.date')
            ->orderByDesc('a.checkIn')
            ->orderByDesc('a.createdAt');

        if (! in_array($user['role'], ['ADMINISTRATOR', 'PIMPINAN'], true)) {
            if ($staff) {
                $query->where('a.staffId', $staff->id);
            } else {
                $query->whereRaw('1 = 0');
            }
        }

        if (in_array($user['role'], ['ADMINISTRATOR', 'PIMPINAN'], true) && $attendanceFilter) {
            $query->whereDate('a.date', today());
            if ($attendanceFilter === 'present') $query->where('a.status', 'Hadir');
            if ($attendanceFilter === 'late') $query->whereRaw('TIME_TO_SEC(TIME(a.checkIn)) > ?', [$lateThreshold]);
            if ($attendanceFilter === 'not_checked_out') $query->whereNull('a.checkOut');
        }

        $today = $staff
            ? DB::table('attendance')->where('staffId', $staff->id)->whereDate('date', today())->first()
            : null;

        $isManager = in_array($user['role'], ['ADMINISTRATOR', 'PIMPINAN'], true);
        $personalStats = null;
        if (! $isManager && $staff) {
            $start = now()->startOfMonth()->startOfDay();
            if (! empty($staff->createdAt)) {
                $created = \Illuminate\Support\Carbon::parse($staff->createdAt)->startOfDay();
                if ($created->gt($start)) $start = $created;
            }
            $records = DB::table('attendance')->where('staffId', $staff->id)->whereDate('date', '>=', $start->toDateString())->whereDate('date', '<=', today()->toDateString())->get(['date', 'status', 'checkIn']);
            $present = $records->filter(fn ($row) => $row->checkIn)->map(fn ($row) => substr((string) $row->date, 0, 10))->unique();
            $leave = $records->filter(fn ($row) => in_array(mb_strtolower(trim((string) $row->status)), ['izin', 'sakit'], true))->map(fn ($row) => substr((string) $row->date, 0, 10))->unique();
            $known = $present->merge($leave)->unique()->all();
            $missing = 0;
            for ($day = $start->copy(); $day->lt(today()); $day->addDay()) {
                if ($day->isWeekday() && ! in_array($day->toDateString(), $known, true)) $missing++;
            }
            $personalStats = ['present' => $present->count(), 'missing' => $missing, 'leave' => $leave->count(), 'period' => now()->locale('id')->translatedFormat('F Y')];
        }

        $eligibleStaffIds = DB::table('staff')->where('attendance_enabled', true)->pluck('id');

        return Inertia::render('Attendance/Index', [
            'activeOvertime' => DB::table('overtime_requests')->where('user_id', $user['id'])->where('status', 'ACTIVE')->first(),
            'records' => $query->paginate(30)->withQueryString()->through(function ($row) { $row->overtimeMinutes = (int)$row->overtimeMinutes; return $row; }),
            'attendanceFilter' => $attendanceFilter,
            'today' => $today,
            'hasStaff' => (bool) $staff,
            'isManager' => $isManager,
            'personalStats' => $personalStats,
            'stats' => [
                'present' => DB::table('attendance')->whereIn('staffId', $eligibleStaffIds)->whereDate('date', today())->where('status', 'Hadir')->count(),
                'late' => DB::table('attendance')->whereIn('staffId', $eligibleStaffIds)->whereDate('date', today())->whereRaw('TIME_TO_SEC(TIME(checkIn)) > ?', [$lateThreshold])->count(),
                'notCheckedOut' => DB::table('attendance')->whereIn('staffId', $eligibleStaffIds)->whereDate('date', today())->whereNull('checkOut')->count(),
                'totalStaff' => $eligibleStaffIds->count(),
            ],
        ]);
    }

    public function checkIn(Request $request)
    {
        $user = $request->session()->get('auth_user');
        $staff = DB::table('staff')->where('userId', $user['id'])->where('attendance_enabled', true)->first();
        $today = $staff ? DB::table('attendance')->where('staffId', $staff->id)->whereDate('date', today())->first() : null;
        $activeOvertime = DB::table('overtime_requests')->where('user_id', $user['id'])->where('status', 'ACTIVE')->first();
        $overtimeAction = in_array($request->query('action'), ['overtime-start', 'overtime-finish'], true) ? $request->query('action') : null;
        return Inertia::render('Attendance/CheckIn', ['activeOvertime'=>$activeOvertime, 'overtimeAction'=>$overtimeAction, 'attendanceSettings'=>app(\App\Services\AttendanceSettingsService::class)->read(), 'today' => $today, 'hasStaff' => (bool) $staff, 'checkoutRequested' => $request->query('action') === 'checkout' && (bool) ($today?->checkIn) && ! $today?->checkOut]);
    }

    public function report(Request $request)
    {
        $month = $request->query('month', now()->format('Y-m'));
        $rows = DB::table('staff as s')->where('s.attendance_enabled', true)->join('user as u','u.id','=','s.userId')->leftJoin('attendance as a', function ($join) use ($month) {
            $join->on(DB::raw('a.staffId COLLATE utf8mb4_unicode_ci'),'=',DB::raw('s.id COLLATE utf8mb4_unicode_ci'))->whereRaw("DATE_FORMAT(a.date, '%Y-%m') = ?", [$month]);
        })->select('u.id','u.fullName','u.role')->selectRaw('COUNT(a.id) as presentDays, SUM(CASE WHEN TIME_TO_SEC(TIME(a.checkIn)) > ? THEN 1 ELSE 0 END) as lateDays, SUM(CASE WHEN a.checkOut IS NULL AND a.id IS NOT NULL THEN 1 ELSE 0 END) as incompleteDays', [app(\App\Services\AttendanceSettingsService::class)->lateThresholdSeconds()])->groupBy('u.id','u.fullName','u.role')->orderBy('u.fullName')->get();
        return Inertia::render('Attendance/Report', compact('rows','month'));
    }

    public function reverseGeocode(Request $request)
    {
        $coordinates = $request->validate([
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
        ]);
        $latitude = round((float) $coordinates['latitude'], 5);
        $longitude = round((float) $coordinates['longitude'], 5);
        $cacheKey = "attendance-address:{$latitude}:{$longitude}";

        // A cache permission error must not prevent an address lookup.
        try {
            $address = Cache::store('file')->get($cacheKey);
            if (is_string($address) && trim($address) !== '') {
                return response()->json(['address' => $address]);
            }
        } catch (\Throwable $exception) {
            Log::notice('Attendance address cache unavailable.', ['exception' => get_class($exception)]);
        }

        try {
            $client = Http::withHeaders([
                'User-Agent' => (string) config('services.geocoding.user_agent'),
                'Accept-Language' => 'id',
            ])->acceptJson()->connectTimeout(5)->timeout(12);
            if (app()->isLocal()) {
                $client = $client->withoutVerifying();
            }
            $response = $client->get((string) config('services.geocoding.url'), [
                'format' => 'jsonv2',
                'lat' => $latitude,
                'lon' => $longitude,
                'zoom' => 18,
                'addressdetails' => 1,
            ])->throw();
            $address = Str::limit(trim((string) $response->json('display_name')), 255, '');
        } catch (ConnectionException $exception) {
            Log::warning('Attendance geocoding connection failed.', ['exception' => get_class($exception)]);
            return response()->json(['message' => 'Server tidak dapat menghubungi layanan alamat.', 'code' => 'connection_error'], 502);
        } catch (RequestException $exception) {
            Log::warning('Attendance geocoding provider returned an error.', ['status' => $exception->response->status()]);
            return response()->json(['message' => 'Layanan alamat sedang tidak tersedia.', 'code' => 'provider_error'], 502);
        } catch (\Throwable $exception) {
            Log::warning('Attendance geocoding failed.', ['exception' => get_class($exception)]);
            return response()->json(['message' => 'Pencarian alamat gagal.', 'code' => 'lookup_error'], 502);
        }

        if (! $address) {
            return response()->json(['message' => 'Alamat tidak ditemukan untuk titik GPS ini.', 'code' => 'address_not_found'], 404);
        }

        try {
            Cache::store('file')->put($cacheKey, $address, now()->addDays(7));
        } catch (\Throwable $exception) {
            Log::notice('Attendance address cache write failed.', ['exception' => get_class($exception)]);
        }

        return response()->json(['address' => $address]);
    }

    public function submit(Request $request)
    {
        $user = $request->session()->get('auth_user');
        $staff = DB::table('staff')->where('userId', $user['id'])->where('attendance_enabled', true)->first();
        abort_unless($staff, 422, 'Akun tidak terdaftar dalam absensi.');

        $data = $request->validate([
            'attendanceAction' => 'required|in:checkin,checkout,overtime-start,overtime-finish',
            'reason' => 'nullable|required_if:attendanceAction,overtime-start|string|min:5|max:2000',
            'workLocationType' => 'required|in:Office,Dinas Luar,WFC,WFH',
            'locationLabel' => 'required|string|max:255',
            'locationSource' => 'nullable|in:gps,manual',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'locationAccuracy' => 'nullable|numeric|min:0|max:1000000',
            'photo' => 'required|image|max:5120',
        ]);
        $settingsService = app(\App\Services\AttendanceSettingsService::class);
        $settings = $settingsService->read();
        $distance = null;
        if ($data['workLocationType'] === 'Office') {
            $distance = $settingsService->officeDistance($settings, (float)$data['latitude'], (float)$data['longitude']);
            if ($distance === null) throw ValidationException::withMessages(['workLocationType'=>'Lokasi kantor belum diatur. Hubungi pimpinan atau admin.']);
            if ($distance > $settings['office_radius_meters']) throw ValidationException::withMessages(['workLocationType'=>'Anda tidak berada di sekitar kantor. Jarak '.round($distance,1).' meter; radius kantor '.$settings['office_radius_meters'].' meter.']);
        }
        $notificationEvidence = DB::transaction(function () use ($staff, $request, $data, $distance, $settings) {
            if (str_starts_with($data['attendanceAction'], 'overtime-')) DB::table('user')->where('id', $staff->userId)->lockForUpdate()->firstOrFail();
            // Serialize submissions for one employee so a retry cannot turn check-in into check-out.
            $locked = DB::table('staff')->where('id', $staff->id)->lockForUpdate()->first();
            abort_unless($locked && $locked->attendance_enabled, 422, 'Akun tidak terdaftar dalam absensi.');
            if (str_starts_with($data['attendanceAction'], 'overtime-')) {
                abort_unless($request->session()->get('auth_user.source') === 'user', 403);
                $userId = $staff->userId;
                $active = DB::table('overtime_requests')->where('user_id', $userId)->where('status', 'ACTIVE')->lockForUpdate()->first();
                $finish = $data['attendanceAction'] === 'overtime-finish';
                if ((!$finish && $active) || ($finish && !$active)) throw ValidationException::withMessages(['attendanceAction'=>'Status lembur sudah berubah. Muat ulang halaman.']);
                if (!$finish && !DB::table('attendance')->where('staffId', $staff->id)->whereDate('date', today())->whereNotNull('checkIn')->exists()) throw ValidationException::withMessages(['attendanceAction'=>'Silakan absen masuk terlebih dahulu sebelum memulai lembur.']);
                $timestamp = now();
                if (!$finish && DB::table('overtime_requests')->where('user_id', $userId)->whereIn('status', ['PENDING','APPROVED'])->where('end_at', '>', $timestamp)->exists()) throw ValidationException::withMessages(['attendanceAction'=>'Waktu lembur bertumpang tindih dengan pengajuan sebelumnya.']);
                $evidence = ['workLocationType'=>$data['workLocationType'], 'locationLabel'=>$data['locationLabel'], 'latitude'=>$data['latitude'], 'longitude'=>$data['longitude'], 'locationAccuracy'=>$data['locationAccuracy'] ?? null, 'submittedAt'=>$timestamp->toIso8601String(), 'photoPath'=>'/'.$request->file('photo')->store('uploads/attendance', 'public_root')];
                if ($distance !== null) $evidence['officeVerification'] = ['distanceMeters'=>round($distance,2), 'radiusMeters'=>$settings['office_radius_meters']];
                if ($finish) {
                    $notes = json_decode($active->attendance_notes ?: '{}', true) ?: [];
                    $notes['finish'] = $evidence;
                    DB::table('overtime_requests')->where('id', $active->id)->update(['end_at'=>$timestamp, 'minutes'=>max(0, (int)floor(\Carbon\Carbon::parse($active->start_at)->diffInMinutes($timestamp))), 'status'=>'PENDING', 'attendance_notes'=>json_encode($notes), 'updated_at'=>$timestamp]);
                } else {
                    DB::table('overtime_requests')->insert(['user_id'=>$userId, 'date'=>$timestamp->toDateString(), 'start_at'=>$timestamp, 'end_at'=>null, 'minutes'=>0, 'reason'=>$data['reason'], 'status'=>'ACTIVE', 'attendance_notes'=>json_encode(['start'=>$evidence]), 'created_at'=>$timestamp, 'updated_at'=>$timestamp]);
                }
                return $evidence;
            }
            $existing = DB::table('attendance')->where('staffId', $staff->id)->whereDate('date', today())->lockForUpdate()->first();
            if ($data['attendanceAction'] === 'checkin' && $existing) {
                throw ValidationException::withMessages(['attendanceAction' => 'Absen masuk hari ini sudah tercatat.']);
            }
            if ($data['attendanceAction'] === 'checkout' && (! $existing || ! $existing->checkIn || $existing->checkOut)) {
                throw ValidationException::withMessages(['attendanceAction' => 'Absen pulang tidak tersedia atau sudah tercatat.']);
            }

            $payload = ['workLocationType' => $data['workLocationType'], 'locationLabel' => $data['locationLabel'], 'locationSource' => $data['locationSource'] ?? 'gps', 'latitude' => $data['latitude'], 'longitude' => $data['longitude'], 'locationAccuracy' => isset($data['locationAccuracy']) ? (float) $data['locationAccuracy'] : null, 'submittedAt' => now()->toIso8601String()];
            if ($distance !== null) $payload['officeVerification'] = ['distanceMeters'=>round($distance,2),'radiusMeters'=>$settings['office_radius_meters'],'latitude'=>$settings['office_latitude'],'longitude'=>$settings['office_longitude']];
            $payload['photoPath'] = '/'.$request->file('photo')->store('uploads/attendance', 'public_root');
            if ($data['attendanceAction'] === 'checkout') {
                $notes = json_decode($existing->notes ?: '{}', true) ?: [];
                $notes['checkOut'] = $payload;
                DB::table('attendance')->where('id', $existing->id)->update(['checkOut' => now(), 'notes' => json_encode($notes), 'updatedAt' => now()]);
            } else {
                DB::table('attendance')->insert(['id' => 'attendance-'.Str::random(12), 'staffId' => $staff->id, 'date' => now(), 'checkIn' => now(), 'status' => 'Hadir', 'notes' => json_encode(['checkIn' => $payload]), 'createdAt' => now(), 'updatedAt' => now()]);
            }
            return $payload;
        });

        $delivery = app(\App\Services\AttendanceNotificationService::class)->send($staff->userId, $data['attendanceAction'], $notificationEvidence);

        $message = match ($data['attendanceAction']) {
            'overtime-start' => 'Absen mulai lembur berhasil. Tekan Selesai Lembur saat pekerjaan selesai.',
            'overtime-finish' => 'Absen selesai lembur berhasil. Hasil lembur menunggu pemeriksaan pimpinan.',
            'checkout' => 'Absen pulang berhasil.',
            default => 'Absen masuk berhasil.',
        };
        if ($delivery === 'sent') $message .= ' Konfirmasi WhatsApp dikirim ke nomor Anda.';
        elseif ($delivery === 'missing') $message .= ' WhatsApp belum terkirim: lengkapi nomor HP Indonesia yang valid pada profil Anda.';
        elseif ($delivery === 'failed') $message .= ' WhatsApp belum terkirim karena gangguan pengiriman; absensi tetap tersimpan.';
        return redirect()->route('attendance.checkin')->with('success', $message);
    }

    public function destroy(Request $request, string $id)
    {
        abort_unless(in_array($request->session()->get('auth_user.role'), ['ADMINISTRATOR', 'PIMPINAN']), 403);
        DB::table('attendance')->where('id', $id)->delete();
        return back()->with('success', 'Absensi dihapus.');
    }

    public function update(Request $request, string $id)
    {
        abort_unless(in_array($request->session()->get('auth_user.role'), ['ADMINISTRATOR', 'PIMPINAN']), 403);
        $data=$request->validate(['checkIn'=>'nullable|date','checkOut'=>'nullable|date']);
        DB::table('attendance')->where('id',$id)->update([...$data,'updatedAt'=>now()]);
        return back()->with('success','Data absensi diperbarui.');
    }
}
