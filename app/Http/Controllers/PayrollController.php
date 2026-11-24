<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class PayrollController extends Controller
{
    private const SETTINGS = 'PAYROLL_SETTINGS';

    private function authorizePayroll(Request $request): void
    {
        abort_unless(in_array($request->session()->get('auth_user.role'), ['ADMINISTRATOR', 'PIMPINAN'], true), 403);
    }

    private function settingsData(): array
    {
        $value = DB::table('app_settings')->where('settings_key', self::SETTINGS)->value('settings_value');
        $data = json_decode($value ?: '{}', true);
        return array_replace(['start_time' => '08:00', 'grace_minutes' => 0, 'rules' => []], is_array($data) ? $data : []);
    }

    public function index(Request $request)
    {
        $this->authorizePayroll($request);
        $data = $request->validate(['period' => 'nullable|date_format:Y-m', 'search' => 'nullable|string|max:100', 'status' => 'nullable|in:DRAFT,REVIEWED,APPROVED,PAID']);
        $period = $data['period'] ?? now()->format('Y-m');
        $run = DB::table('payroll_periods')->where('period', $period)->first();
        $query = DB::table('payroll_items')->where('payroll_period_id', $run?->id ?? 0);
        $totals = (clone $query)->selectRaw('COUNT(*) as employees, COALESCE(SUM(base_salary + allowance),0) as gross, COALESCE(SUM(late_deduction + other_deduction),0) as deductions, COALESCE(SUM(net_salary),0) as net')->first();
        $items = $query->when($data['search'] ?? null, fn ($q, $v) => $q->where('employee_name', 'like', '%'.$v.'%'))
            ->orderBy('employee_name')->paginate(15)->withQueryString();
        return Inertia::render('Payroll/Index', [
            'period' => $period, 'run' => $run, 'items' => $items, 'totals' => $totals,
            'search' => $data['search'] ?? '',
            'availablePeriods' => DB::table('payroll_periods')->orderByDesc('period')->pluck('period'),
        ]);
    }

    public function settings(Request $request)
    {
        $this->authorizePayroll($request);
        return Inertia::render('Payroll/Settings', ['settings' => $this->settingsData()]);
    }

    public function saveSettings(Request $request)
    {
        $this->authorizePayroll($request);
        $data = $request->validate([
            'start_time' => 'required|date_format:H:i', 'grace_minutes' => 'required|integer|min:0|max:1440',
            'rules' => 'present|array|max:100', 'rules.*.from' => 'required|integer|min:1|max:1440',
            'rules.*.to' => 'nullable|integer|min:1|max:1440', 'rules.*.amount' => 'required|integer|min:0|max:1000000000',
        ]);
        $rules = collect($data['rules'])->sortBy('from')->values();
        $previousEnd = 0;
        foreach ($rules as $rule) {
            $end = $rule['to'] ?? null;
            if ($rule['from'] <= $previousEnd || ($end !== null && $end < $rule['from'])) {
                throw ValidationException::withMessages(['rules' => 'Rentang keterlambatan tidak boleh bertumpang tindih atau berakhir sebelum dimulai.']);
            }
            $previousEnd = $end ?? PHP_INT_MAX;
        }
        DB::transaction(function () use ($data, $rules) {
            DB::table('app_settings')->updateOrInsert(['settings_key' => self::SETTINGS], [
                'id' => (string) (DB::table('app_settings')->where('settings_key', self::SETTINGS)->value('id') ?: Str::uuid()),
                'settings_value' => json_encode(['start_time' => $data['start_time'], 'grace_minutes' => (int) $data['grace_minutes'], 'rules' => $rules->all()]),
                'updated_at' => now(),
            ]);
        });
        return back()->with('success', 'Pengaturan payroll disimpan. Perubahan berlaku untuk payroll yang dibuat berikutnya.');
    }

    public function create(Request $request)
    {
        $this->authorizePayroll($request);
        $data = $request->validate(['period' => 'required|date_format:Y-m|unique:payroll_periods,period', 'payment_date' => 'nullable|date']);
        $start = Carbon::createFromFormat('!Y-m', $data['period'])->startOfMonth();
        $end = $start->copy()->endOfMonth();
        $employees = DB::table('user as u')->join('staff as s', 's.userId', '=', 'u.id')
            ->leftJoin('payroll_profiles as p', 'p.user_id', '=', 'u.id')->where('u.isActive', true)->where('s.payroll_enabled', true)
            ->select('u.id', 'u.fullName', 's.id as staff_id', 's.attendance_enabled', 'p.base_salary', 'p.allowance', 'p.other_allowances', 'p.bpjs_health', 'p.bpjs_employment')->get();
        if ($employees->isEmpty()) throw ValidationException::withMessages(['period' => 'Tidak ada pegawai aktif yang memiliki data pegawai.']);
        if ($employees->contains(fn ($employee) => $employee->base_salary === null)) {
            throw ValidationException::withMessages(['period' => 'Lengkapi gaji pokok seluruh pegawai aktif di Data Gaji Karyawan terlebih dahulu.']);
        }
        $settings = $this->settingsData();
        $attendance = DB::table('attendance')->whereIn('staffId', $employees->pluck('staff_id'))
            ->whereDate('date', '>=', $start->toDateString())->whereDate('date', '<=', $end->toDateString())->whereNotNull('checkIn')
            ->orderBy('checkIn')->get(['staffId', 'date', 'checkIn'])->groupBy('staffId');
        $items = [];
        foreach ($employees as $employee) {
            $details = [];
            foreach (($employee->attendance_enabled ? ($attendance->get($employee->staff_id) ?? collect()) : collect())->unique(fn ($row) => substr((string) $row->date, 0, 10)) as $record) {
                $actual = Carbon::parse($record->checkIn);
                $scheduled = $actual->copy()->startOfDay()->setTimeFromTimeString($settings['start_time']);
                $minutes = max(0, (int) floor($scheduled->diffInMinutes($actual, false)));
                if ($minutes <= (int) $settings['grace_minutes']) continue;
                foreach ($settings['rules'] as $rule) {
                    if ($minutes >= (int) $rule['from'] && (($rule['to'] ?? null) === null || $minutes <= (int) $rule['to'])) {
                        $details[] = ['date' => substr((string) $record->date, 0, 10), 'check_in' => $actual->format('H:i'), 'minutes' => $minutes, 'amount' => (int) $rule['amount']];
                        break;
                    }
                }
            }
            $deduction = array_sum(array_column($details, 'amount'));
            $otherAllowances = json_decode($employee->other_allowances ?: '[]', true) ?: [];
            $totalAllowance = (int) $employee->allowance + array_sum(array_column($otherAllowances, 'amount'));
            $bpjs = (int) $employee->bpjs_health + (int) $employee->bpjs_employment;
            $gross = (int) $employee->base_salary + $totalAllowance;
            if ($deduction + $bpjs > $gross) throw ValidationException::withMessages(['period' => 'Total potongan melebihi gaji kotor '.$employee->fullName.'. Periksa pengaturan payroll.']);
            $items[] = ['user_id' => $employee->id, 'employee_name' => $employee->fullName, 'base_salary' => $employee->base_salary,
                'allowance' => $totalAllowance, 'late_deduction' => $deduction, 'other_deduction' => $bpjs,
                'salary_details' => json_encode(['fixed_allowance' => (int) $employee->allowance, 'other_allowances' => $otherAllowances, 'bpjs_health' => (int) $employee->bpjs_health, 'bpjs_employment' => (int) $employee->bpjs_employment]),
                'net_salary' => $gross - $deduction - $bpjs, 'late_details' => json_encode($details), 'created_at' => now(), 'updated_at' => now()];
        }
        DB::transaction(function () use ($request, $data, $items) {
            $id = DB::table('payroll_periods')->insertGetId(['period' => $data['period'], 'payment_date' => $data['payment_date'] ?? null,
                'status' => 'DRAFT', 'created_by' => $request->session()->get('auth_user.id'), 'created_at' => now(), 'updated_at' => now()]);
            foreach ($items as $item) DB::table('payroll_items')->insert(['payroll_period_id' => $id, ...$item]);
        });
        return redirect()->route('payroll.index', ['period' => $data['period']])->with('success', 'Draf payroll berhasil dibuat.');
    }

    public function deleteDraft(Request $request, int $id)
    {
        $this->authorizePayroll($request);
        $deleted = DB::table('payroll_periods')->where('id', $id)->where('status', 'DRAFT')->delete();
        if (! $deleted) throw ValidationException::withMessages(['status' => 'Hanya payroll berstatus draf yang dapat dihapus.']);
        return redirect()->route('payroll.index')->with('success', 'Draf dihapus. Anda dapat membuat ulang payroll setelah memperbaiki data.');
    }

    public function transition(Request $request, int $id)
    {
        $this->authorizePayroll($request);
        $data = $request->validate(['status' => 'required|in:REVIEWED,APPROVED,PAID']);
        $previous = ['REVIEWED' => 'DRAFT', 'APPROVED' => 'REVIEWED', 'PAID' => 'APPROVED'][$data['status']];
        $changed = DB::table('payroll_periods')->where('id', $id)->where('status', $previous)->update(['status' => $data['status'], 'updated_at' => now()]);
        if (! $changed) throw ValidationException::withMessages(['status' => 'Status payroll berubah atau tahapan tidak sesuai. Muat ulang halaman.']);
        return back()->with('success', 'Status payroll diperbarui. Status dibayar hanya mencatat pembayaran yang telah dilakukan.');
    }
}
