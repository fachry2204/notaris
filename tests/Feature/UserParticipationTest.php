<?php
namespace Tests\Feature;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;
class UserParticipationTest extends TestCase
{
    use DatabaseTransactions;
    protected function setUp(): void { parent::setUp(); config(['app.url' => 'http://localhost']); url()->forceRootUrl('http://localhost'); }
    public function test_account_participation_controls_attendance_and_payroll_independently(): void
    {
        $admin = ['auth_user' => ['id' => 'local-test-admin', 'role' => 'ADMINISTRATOR', 'source' => 'admin', 'fullName' => 'Admin']];
        DB::table('user')->update(['isActive' => false]);
        $base = ['phone' => '', 'password' => 'password123', 'role' => 'STAFFADMIN', 'isActive' => true];
        foreach ([['gaji', false, true], ['absen', true, false]] as [$key, $attendance, $payroll]) {
            $this->withSession($admin)->post('/dashboard/system/users', [...$base, 'username' => 'participation-'.$key, 'email' => 'participation-'.$key.'@example.invalid', 'fullName' => 'Participation '.$key, 'attendance_enabled' => $attendance, 'payroll_enabled' => $payroll])->assertSessionHasNoErrors();
        }
        $gaji = DB::table('user')->where('username', 'participation-gaji')->first();
        $absen = DB::table('user')->where('username', 'participation-absen')->first();
        $gajiStaff = DB::table('staff')->where('userId', $gaji->id)->first();
        $absenStaff = DB::table('staff')->where('userId', $absen->id)->first();
        $this->assertSame(0, (int) $gajiStaff->attendance_enabled);
        $this->assertSame(0, (int) $absenStaff->payroll_enabled);
        foreach ([$gajiStaff, $absenStaff] as $i => $staff) DB::table('attendance')->insert(['id' => 'participation-att-'.$i, 'staffId' => $staff->id, 'date' => now(), 'checkIn' => now(), 'status' => 'Hadir', 'createdAt' => now(), 'updatedAt' => now()]);
        $response = $this->withSession($admin)->get('/dashboard/pegawai/absensi')->assertOk();
        $ids = collect($response->viewData('page')['props']['records']['data'])->pluck('id');
        $this->assertFalse($ids->contains('participation-att-0'));
        $this->assertTrue($ids->contains('participation-att-1'));
        $this->withSession(['auth_user' => ['id' => $gaji->id, 'role' => 'STAFFADMIN', 'source' => 'user']])->post('/dashboard/pegawai/absensi', [])->assertStatus(422);
        DB::table('payroll_profiles')->insert(['user_id' => $gaji->id, 'base_salary' => 5000000, 'allowance' => 0]);
        $this->withSession($admin)->post('/dashboard/payroll', ['period' => now()->format('Y-m')])->assertSessionHasNoErrors();
        $periodId = DB::table('payroll_periods')->where('period', now()->format('Y-m'))->value('id');
        $this->assertDatabaseHas('payroll_items', ['payroll_period_id' => $periodId, 'user_id' => $gaji->id, 'late_deduction' => 0]);
        $this->assertDatabaseMissing('payroll_items', ['payroll_period_id' => $periodId, 'user_id' => $absen->id]);
        $this->withSession($admin)->put('/dashboard/system/users/user/'.$gaji->id, ['fullName' => $gaji->fullName, 'username' => $gaji->username, 'email' => $gaji->email, 'phone' => '', 'role' => 'STAFFADMIN', 'isActive' => true, 'attendance_enabled' => true, 'payroll_enabled' => false])->assertSessionHasNoErrors();
        $this->assertDatabaseHas('staff', ['id' => $gajiStaff->id, 'attendance_enabled' => 1, 'payroll_enabled' => 0]);
        $this->assertDatabaseHas('attendance', ['id' => 'participation-att-0']);
        $this->assertDatabaseHas('payroll_items', ['payroll_period_id' => $periodId, 'user_id' => $gaji->id]);
    }
}
