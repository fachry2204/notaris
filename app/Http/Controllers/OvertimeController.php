<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OvertimeController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->session()->get('auth_user');
        $isManager = in_array($user['role'], ['ADMINISTRATOR', 'PIMPINAN'], true);
        $query = DB::table('overtime_requests as o')->leftJoin('user as u', 'u.id', '=', 'o.user_id')->select('o.*', 'u.fullName as staffName');
        if (!$isManager) $query->where('o.user_id', $user['id']);
        return \Inertia\Inertia::render('Attendance/Overtime', ['records'=>$query->orderByDesc('o.id')->paginate(30), 'isManager'=>$isManager]);
    }

    public function store(Request $request, string $id)
    {
        abort_unless($request->session()->get('auth_user.id') === $id && $request->session()->get('auth_user.source') === 'user', 403);
        $data = $request->validate([
            'date' => 'required|date_format:Y-m-d|before_or_equal:today',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'reason' => 'required|string|min:5|max:2000',
        ]);
        DB::transaction(function () use ($data, $id) {
            DB::table('user')->where('id', $id)->lockForUpdate()->firstOrFail();
            $staff = DB::table('staff')->where('userId', $id)->where('attendance_enabled', true)->first();
            abort_unless($staff, 422, 'Pegawai tidak terdaftar dalam absensi.');
            if (! DB::table('attendance')->where('staffId', $staff->id)->whereDate('date', $data['date'])->whereNotNull('checkIn')->exists()) {
                throw ValidationException::withMessages(['date' => 'Belum ada absen masuk pada tanggal tersebut.']);
            }
            $start = Carbon::parse($data['date'].' '.$data['start_time']);
            $end = Carbon::parse($data['date'].' '.$data['end_time']);
            if (DB::table('overtime_requests')->where('user_id', $id)->where('status', 'ACTIVE')->exists()) throw ValidationException::withMessages(['start_time'=>'Selesaikan absensi lembur yang sedang berlangsung terlebih dahulu.']);
            if (DB::table('overtime_requests')->where('user_id', $id)->whereIn('status', ['PENDING', 'APPROVED'])
                ->where('start_at', '<', $end)->where('end_at', '>', $start)->exists()) {
                throw ValidationException::withMessages(['start_time' => 'Waktu bertumpang tindih dengan pengajuan yang masih menunggu atau sudah disetujui.']);
            }
            DB::table('overtime_requests')->insert(['user_id' => $id, 'date' => $data['date'], 'start_at' => $start, 'end_at' => $end,
                'minutes' => (int) $start->diffInMinutes($end), 'reason' => $data['reason'], 'status' => 'PENDING', 'created_at' => now(), 'updated_at' => now()]);
        });
        return back()->with('success', 'Pengajuan lembur dikirim. Durasi dihitung setelah disetujui.');
    }

    public function review(Request $request, string $id, int $overtime)
    {
        abort_unless(in_array($request->session()->get('auth_user.role'), ['ADMINISTRATOR', 'PIMPINAN'], true), 403);
        abort_if($request->session()->get('auth_user.id') === $id, 403, 'Pengajuan sendiri harus diperiksa oleh pimpinan/admin lain.');
        $data = $request->validate(['status' => 'required|in:APPROVED,REJECTED', 'review_notes' => 'nullable|required_if:status,REJECTED|string|max:2000']);
        $changed = DB::table('overtime_requests')->where('id', $overtime)->where('user_id', $id)->where('status', 'PENDING')
            ->update([...$data, 'reviewed_by' => $request->session()->get('auth_user.id'), 'reviewed_at' => now(), 'updated_at' => now()]);
        if (! $changed) throw ValidationException::withMessages(['status' => 'Pengajuan tidak ditemukan atau sudah diperiksa. Muat ulang halaman.']);
        return back()->with('success', $data['status'] === 'APPROVED' ? 'Lembur diterima. Durasi masuk rekap absensi dan tersedia untuk draf payroll berikutnya.' : 'Lembur ditolak. Durasi tidak dihitung dalam rekap absensi atau payroll.');
    }
}
