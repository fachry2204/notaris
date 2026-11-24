<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class EmployeeSalaryController extends Controller
{
    private function authorizeSalary(Request $request): void
    {
        abort_unless(in_array($request->session()->get('auth_user.role'), ['ADMINISTRATOR', 'PIMPINAN'], true), 403);
    }

    public function index(Request $request)
    {
        $this->authorizeSalary($request);
        $data = $request->validate(['search' => 'nullable|string|max:100']);
        $rows = DB::table('staff as s')->join('user as u', 'u.id', '=', 's.userId')
            ->leftJoin('payroll_profiles as p', 'p.user_id', '=', 'u.id')
            ->select('u.id', 'u.fullName', 'u.role', 'u.isActive', 'p.base_salary', 'p.allowance', 'p.bpjs_health', 'p.bpjs_employment')
            ->when($data['search'] ?? null, fn ($q, $term) => $q->where('u.fullName', 'like', '%'.$term.'%'))
            ->orderBy('u.fullName')->paginate(20)->withQueryString();
        return Inertia::render('Payroll/Salaries', ['rows' => $rows, 'search' => $data['search'] ?? '']);
    }

    public function show(Request $request, string $id)
    {
        $this->authorizeSalary($request);
        $employee = DB::table('user as u')->join('staff as s', 's.userId', '=', 'u.id')
            ->where('u.id', $id)->select('u.id', 'u.fullName', 'u.role', 'u.isActive')->first();
        abort_unless($employee, 404);
        $profile = DB::table('payroll_profiles')->where('user_id', $id)->first();
        if ($profile) $profile->other_allowances = json_decode($profile->other_allowances ?: '[]', true) ?: [];
        $history = DB::table('payroll_profile_history')->where('user_id', $id)->orderByDesc('id')->get()
            ->map(function ($row) { $row->changes = json_decode($row->changes, true) ?: []; return $row; });
        return Inertia::render('Payroll/SalaryDetail', compact('employee', 'profile', 'history'));
    }

    public function update(Request $request, string $id)
    {
        $this->authorizeSalary($request);
        $data = $request->validate([
            'base_salary' => 'required|integer|min:0|max:100000000000',
            'allowance' => 'required|integer|min:0|max:100000000000',
            'other_allowances' => 'present|array|max:50',
            'other_allowances.*.name' => 'required|string|max:100',
            'other_allowances.*.amount' => 'required|integer|min:0|max:100000000000',
            'bpjs_health' => 'required|integer|min:0|max:100000000000',
            'bpjs_employment' => 'required|integer|min:0|max:100000000000',
            'reason' => 'required|string|min:3|max:1000',
        ]);
        DB::transaction(function () use ($request, $id, $data) {
            $employee = DB::table('user as u')->join('staff as s', 's.userId', '=', 'u.id')->where('u.id', $id)->select('u.id')->lockForUpdate()->first();
            abort_unless($employee, 404);
            $old = DB::table('payroll_profiles')->where('user_id', $id)->first();
            $before = $old ? ['base_salary' => (int) $old->base_salary, 'allowance' => (int) $old->allowance,
                'other_allowances' => json_decode($old->other_allowances ?: '[]', true) ?: [], 'bpjs_health' => (int) $old->bpjs_health,
                'bpjs_employment' => (int) $old->bpjs_employment] : null;
            $after = ['base_salary' => (int) $data['base_salary'], 'allowance' => (int) $data['allowance'],
                'other_allowances' => array_map(fn ($a) => ['name' => trim($a['name']), 'amount' => (int) $a['amount']], $data['other_allowances']),
                'bpjs_health' => (int) $data['bpjs_health'], 'bpjs_employment' => (int) $data['bpjs_employment']];
            $changes = [];
            foreach ($after as $field => $value) if ($before === null || $before[$field] !== $value) $changes[] = ['field' => $field, 'before' => $before[$field] ?? null, 'after' => $value];
            if (! $changes) return;
            DB::table('payroll_profiles')->updateOrInsert(['user_id' => $id], [...$after, 'other_allowances' => json_encode($after['other_allowances']), 'updated_at' => now()]);
            DB::table('payroll_profile_history')->insert(['user_id' => $id, 'actor_id' => $request->session()->get('auth_user.id'),
                'actor_name' => $request->session()->get('auth_user.fullName') ?: $request->session()->get('auth_user.username', 'Pengguna'),
                'reason' => trim($data['reason']), 'changes' => json_encode($changes), 'created_at' => now()]);
        });
        return redirect()->route('payroll.salaries.show', $id)->with('success', 'Data gaji disimpan. Payroll yang sudah dibuat tidak berubah.');
    }
}
