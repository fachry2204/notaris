<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $tables = ['badan_hukum', 'non_badan_hukum', 'ppat'];
        $stats = ['total' => 0, 'pending' => 0, 'processing' => 0, 'completed' => 0];
        $months = collect(range(5, 0))->map(function ($offset) {
            $date = now()->subMonths($offset);

            return ['key' => $date->format('Y-m'), 'label' => $date->translatedFormat('M'), 'incoming' => 0, 'completed' => 0];
        })->keyBy('key');

        foreach ($tables as $table) {
            $counts = DB::table($table)->selectRaw("COUNT(*) total, SUM(status='PENDING') pending, SUM(status='PROSES') processing, SUM(status='SELESAI') completed")->first();
            foreach ($stats as $key => $value) $stats[$key] += (int) ($counts->{$key} ?? 0);

            foreach (DB::table($table)->where('createdAt', '>=', now()->subMonths(5)->startOfMonth())->select('createdAt', 'updatedAt', 'status')->get() as $job) {
                $createdKey = substr((string) $job->createdAt, 0, 7);
                if ($months->has($createdKey)) {
                    $row = $months->get($createdKey);
                    $row['incoming']++;
                    $months->put($createdKey, $row);
                }
                $completedKey = substr((string) $job->updatedAt, 0, 7);
                if ($job->status === 'SELESAI' && $months->has($completedKey)) {
                    $row = $months->get($completedKey);
                    $row['completed']++;
                    $months->put($completedKey, $row);
                }
            }
        }

        $deadlineParts = collect($tables)->map(fn ($table) => DB::table($table)
            ->select(['id', 'trackingCode', 'title', 'priority', 'deadline', 'status'])
            ->whereNotNull('deadline')->whereNotIn('status', ['SELESAI', 'CANCELLED'])
            ->whereBetween('deadline', [now(), now()->addDays(7)]));
        $deadlines = $deadlineParts->shift();
        foreach ($deadlineParts as $part) $deadlines->unionAll($part);

        $user = $request->session()->get('auth_user', []);
        $staffLanding = in_array($user['role'] ?? '', ['STAFFADMIN', 'OB'], true)
            && $request->query('view') !== 'overview';
        $todayAttendance = null;
        if ($staffLanding) {
            $staffId = DB::table('staff')->where('userId', $user['id'] ?? '')->value('id');
            if ($staffId) $todayAttendance = DB::table('attendance')->where('staffId', $staffId)->whereDate('date', today())->first();
        }

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'deadlines' => $deadlines->orderBy('deadline')->limit(8)->get(),
            'clientCount' => DB::table('client')->count(),
            'staffCount' => DB::table('user')->where('isActive', true)->count(),
            'months' => $months->values(),
            'staffLanding' => $staffLanding,
            'todayAttendance' => $todayAttendance,
            'user' => $user,
        ]);
    }
}
