<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PayrollTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
        config(['app.url' => 'http://localhost']);
        url()->forceRootUrl('http://localhost');
    }

    private function sessionFor(string $role = 'ADMINISTRATOR'): array
    {
        return ['auth_user' => ['id' => 'local-test-admin', 'role' => $role, 'fullName' => 'Admin Test']];
    }

    public function test_payroll_permissions_and_overlapping_ranges_are_rejected(): void
    {
        $this->withSession($this->sessionFor('STAFFADMIN'))->get('/dashboard/payroll')->assertForbidden();
        $this->withSession($this->sessionFor('STAFFADMIN'))->get('/dashboard/payroll/settings')->assertForbidden();
        $this->withSession($this->sessionFor())->put('/dashboard/payroll/settings', [
            'start_time' => '08:00', 'grace_minutes' => 5,
            'rules' => [['from' => 6, 'to' => 20, 'amount' => 10000], ['from' => 20, 'to' => null, 'amount' => 20000]],
            'profiles' => [],
        ])->assertSessionHasErrors('rules');
    }

    public function test_payroll_snapshots_salary_and_real_attendance_and_requires_ordered_status(): void
    {
        DB::table('user')->update(['isActive' => false]);
        DB::table('user')->insert(['id' => 'payroll-test-user', 'username' => 'payroll-test-user', 'email' => 'payroll-test@example.invalid', 'fullName' => 'Payroll Test', 'passwordHash' => 'unused', 'role' => 'STAFFADMIN', 'isActive' => true, 'updatedAt' => now()]);
        DB::table('staff')->insert(['id' => 'payroll-test-staff', 'userId' => 'payroll-test-user', 'createdAt' => now(), 'updatedAt' => now()]);
        foreach (['2020-03-31 08:20:00', '2020-03-03 08:04:00'] as $i => $time) {
            DB::table('attendance')->insert(['id' => 'payroll-att-'.$i, 'staffId' => 'payroll-test-staff', 'date' => substr($time, 0, 10), 'checkIn' => $time, 'status' => 'Hadir', 'createdAt' => now(), 'updatedAt' => now()]);
        }
        $settings = ['start_time' => '08:00', 'grace_minutes' => 5, 'rules' => [['from' => 6, 'to' => 15, 'amount' => 10000], ['from' => 16, 'to' => null, 'amount' => 25000]], 'profiles' => []];
        $this->withSession($this->sessionFor())->put('/dashboard/pegawai/absensi/settings', ['start_time'=>'08:00','end_time'=>'17:00','grace_minutes'=>5,'annual_leave_days'=>12,'office_latitude'=>null,'office_longitude'=>null,'office_radius_meters'=>10])->assertSessionHasNoErrors();
        $this->withSession($this->sessionFor())->put('/dashboard/payroll/settings', $settings)->assertSessionHasNoErrors();
        $salary = ['base_salary' => 5000000, 'allowance' => 1000000, 'other_allowances' => [['name' => 'Transport', 'amount' => 200000], ['name' => 'Makan', 'amount' => 100000]], 'bpjs_health' => 50000, 'bpjs_employment' => 25000, 'reason' => 'Data gaji awal'];
        $this->withSession($this->sessionFor('STAFFADMIN'))->get('/dashboard/payroll/salaries/payroll-test-user')->assertForbidden();
        $this->withSession($this->sessionFor())->put('/dashboard/payroll/salaries/payroll-test-user', [...$salary, 'reason' => ''])->assertSessionHasErrors('reason');
        $this->withSession($this->sessionFor())->put('/dashboard/payroll/salaries/payroll-test-user', $salary)->assertSessionHasNoErrors();
        $this->withSession($this->sessionFor())->get('/dashboard/payroll/salaries')->assertOk();
        $this->withSession($this->sessionFor())->get('/dashboard/payroll/salaries/payroll-test-user')->assertOk();
        $this->withSession($this->sessionFor())->get('/dashboard/payroll/settings')->assertOk();
        foreach (['APPROVED'=>90, 'REJECTED'=>60, 'PENDING'=>45, 'ACTIVE'=>0] as $status=>$minutes) {
            DB::table('overtime_requests')->insert(['user_id'=>'payroll-test-user','date'=>'2020-03-31','start_at'=>'2020-03-31 17:00:00','end_at'=>$status==='ACTIVE' ? null : '2020-03-31 18:30:00','minutes'=>$minutes,'reason'=>'Pengujian lembur '.$status,'status'=>$status,'created_at'=>now(),'updated_at'=>now()]);
        }
        $this->withSession($this->sessionFor())->post('/dashboard/payroll', ['period' => '2020-03'])->assertSessionHasNoErrors();
        $this->withSession($this->sessionFor())->get('/dashboard/payroll?period=2020-03')->assertOk();
        $run = DB::table('payroll_periods')->where('period', '2020-03')->first();
        $item = DB::table('payroll_items')->where('payroll_period_id', $run->id)->first();
        $this->assertSame(25000, (int) $item->late_deduction);
        $this->assertSame(75000, (int) $item->other_deduction);
        $this->assertSame(6200000, (int) $item->net_salary);
        $salaryDetails = json_decode($item->salary_details, true);
        $this->assertCount(2, $salaryDetails['other_allowances']);
        $this->assertSame(50000, $salaryDetails['bpjs_health']);
        $this->assertSame(90, $salaryDetails['accepted_overtime_minutes']);
        $this->assertCount(1, $salaryDetails['accepted_overtime_details']);
        $this->withSession($this->sessionFor())->put('/dashboard/payroll/salaries/payroll-test-user', [...$salary, 'base_salary' => 5500000, 'reason' => 'Penyesuaian tahunan'])->assertSessionHasNoErrors();
        $history = DB::table('payroll_profile_history')->where('user_id', 'payroll-test-user')->orderByDesc('id')->first();
        $change = json_decode($history->changes, true);
        $this->assertSame('Penyesuaian tahunan', $history->reason);
        $this->assertCount(1, $change);
        $this->assertSame(['field' => 'base_salary', 'before' => 5000000, 'after' => 5500000], $change[0]);
        $this->assertSame(6200000, (int) DB::table('payroll_items')->where('id', $item->id)->value('net_salary'));
        $this->assertCount(1, json_decode($item->late_details, true));
        $this->withSession($this->sessionFor())->patch('/dashboard/payroll/'.$run->id.'/status', ['status' => 'PAID'])->assertSessionHasErrors('status');
        foreach (['REVIEWED', 'APPROVED', 'PAID'] as $status) $this->withSession($this->sessionFor())->patch('/dashboard/payroll/'.$run->id.'/status', ['status' => $status])->assertSessionHasNoErrors();
        $this->assertSame('PAID', DB::table('payroll_periods')->where('id', $run->id)->value('status'));
        $this->withSession($this->sessionFor())->post('/dashboard/payroll', ['period' => '2020-03'])->assertSessionHasErrors('period');
    }
}
