<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Inertia\Inertia;

class AttendanceController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->session()->get('auth_user');
        $staff = DB::table('staff')->where('userId', $user['id'])->first();

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
            ->select('a.*', 'u.fullName as staffName')
            ->orderByDesc('a.date');

        if (!in_array($user['role'], ['ADMINISTRATOR', 'PIMPINAN']) && $staff) {
            $query->where('a.staffId', $staff->id);
        }

        $today = $staff
            ? DB::table('attendance')->where('staffId', $staff->id)->whereDate('date', today())->first()
            : null;

        return Inertia::render('Attendance/Index', [
            'records' => $query->paginate(30),
            'today' => $today,
            'hasStaff' => (bool) $staff,
            'isManager' => in_array($user['role'], ['ADMINISTRATOR', 'PIMPINAN']),
            'stats' => [
                'present' => DB::table('attendance')->whereDate('date', today())->where('status', 'Hadir')->count(),
                'late' => DB::table('attendance')->whereDate('date', today())->whereTime('checkIn', '>', '08:00:00')->count(),
                'notCheckedOut' => DB::table('attendance')->whereDate('date', today())->whereNull('checkOut')->count(),
                'totalStaff' => DB::table('staff')->count(),
            ],
        ]);
    }

    public function checkIn(Request $request)
    {
        $user = $request->session()->get('auth_user');
        $staff = DB::table('staff')->where('userId', $user['id'])->first();
        $today = $staff ? DB::table('attendance')->where('staffId', $staff->id)->whereDate('date', today())->first() : null;
        return Inertia::render('Attendance/CheckIn', ['today' => $today, 'hasStaff' => (bool) $staff]);
    }

    public function report(Request $request)
    {
        $month = $request->query('month', now()->format('Y-m'));
        $rows = DB::table('staff as s')->join('user as u','u.id','=','s.userId')->leftJoin('attendance as a', function ($join) use ($month) {
            $join->on(DB::raw('a.staffId COLLATE utf8mb4_unicode_ci'),'=',DB::raw('s.id COLLATE utf8mb4_unicode_ci'))->whereRaw("DATE_FORMAT(a.date, '%Y-%m') = ?", [$month]);
        })->select('u.id','u.fullName','u.role')->selectRaw('COUNT(a.id) as presentDays, SUM(CASE WHEN TIME(a.checkIn) > "08:00:00" THEN 1 ELSE 0 END) as lateDays, SUM(CASE WHEN a.checkOut IS NULL AND a.id IS NOT NULL THEN 1 ELSE 0 END) as incompleteDays')->groupBy('u.id','u.fullName','u.role')->orderBy('u.fullName')->get();
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

        try {
            $address = Cache::store('file')->remember($cacheKey, now()->addDays(7), function () use ($latitude, $longitude) {
                $client = Http::withHeaders([
                    'User-Agent' => (string) config('services.geocoding.user_agent'),
                    'Accept-Language' => 'id',
                ])->acceptJson()->timeout(8);
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

                return Str::limit(trim((string) $response->json('display_name')), 255, '');
            });
        } catch (\Throwable) {
            return response()->json([
                'message' => 'Alamat saat ini belum dapat ditemukan. Silakan coba kembali.',
            ], 502);
        }

        if (! $address) {
            return response()->json([
                'message' => 'Alamat tidak ditemukan untuk titik GPS ini.',
            ], 404);
        }

        return response()->json(['address' => $address]);
    }

    public function submit(Request $request)
    {
        $user = $request->session()->get('auth_user');
        $staff = DB::table('staff')->where('userId', $user['id'])->first();
        abort_unless($staff, 422, 'Profil staff tidak ditemukan.');

        $data = $request->validate([
            'workLocationType' => 'required|in:Office,Dinas Luar,WFC,WFH',
            'locationLabel' => 'required|string|max:255',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'photo' => 'required|image|max:5120',
        ]);
        $existing = DB::table('attendance')->where('staffId', $staff->id)->whereDate('date', today())->first();
        $payload = ['workLocationType' => $data['workLocationType'], 'locationLabel' => $data['locationLabel'], 'latitude' => $data['latitude'], 'longitude' => $data['longitude'], 'submittedAt' => now()->toIso8601String()];
        if ($request->hasFile('photo')) $payload['photoPath'] = '/'.$request->file('photo')->store('uploads/attendance', 'public_root');

        if ($existing) {
            $notes = json_decode($existing->notes ?: '{}', true) ?: [];
            $notes['checkOut'] = $payload;
            DB::table('attendance')->where('id', $existing->id)->update(['checkOut' => $existing->checkOut ?: now(), 'notes' => json_encode($notes), 'updatedAt' => now()]);
        } else {
            DB::table('attendance')->insert(['id' => 'attendance-'.Str::random(12), 'staffId' => $staff->id, 'date' => now(), 'checkIn' => now(), 'status' => 'Hadir', 'notes' => json_encode(['checkIn' => $payload]), 'createdAt' => now(), 'updatedAt' => now()]);
        }
        return back()->with('success', $existing ? 'Check-out berhasil.' : 'Check-in berhasil.');
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
