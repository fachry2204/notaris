<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class KpiOvertimeTest extends TestCase
{
    use DatabaseTransactions;

    public function test_requests_require_ownership_review_and_approved_minutes_appear_in_report(): void
    {
        config(['app.url' => 'http://localhost']); url()->forceRootUrl('http://localhost');
        DB::table('app_settings')->where('settings_key','ATTENDANCE_SETTINGS')->delete();
        DB::table('user')->insert(['id'=>'overtime-test-user','username'=>'overtime-test-user','email'=>'overtime-test@example.invalid','fullName'=>'Overtime Test','passwordHash'=>'unused','role'=>'STAFFADMIN','isActive'=>true,'createdAt'=>now(),'updatedAt'=>now()]);
        DB::table('staff')->insert(['id'=>'overtime-test-staff','userId'=>'overtime-test-user','attendance_enabled'=>true,'createdAt'=>'2020-01-01','updatedAt'=>now()]);
        DB::table('attendance')->insert(['id'=>'overtime-test-att','staffId'=>'overtime-test-staff','date'=>'2020-01-02','checkIn'=>'2020-01-02 08:15:00','checkOut'=>'2020-01-02 19:00:00','status'=>'Hadir','createdAt'=>now(),'updatedAt'=>now()]);
        DB::table('app_settings')->updateOrInsert(['settings_key'=>'PAYROLL_SETTINGS'],['id'=>'overtime-test-setting','settings_value'=>json_encode(['start_time'=>'08:00']),'updated_at'=>now()]);
        $owner=['auth_user'=>['id'=>'overtime-test-user','role'=>'STAFFADMIN','source'=>'user']];
        $manager=['auth_user'=>['id'=>'other-manager','role'=>'PIMPINAN','source'=>'user']];
        $path='/dashboard/productivity/overtime-test-user/overtime';
        $payload=['date'=>'2020-01-02','start_time'=>'17:30','end_time'=>'19:00','reason'=>'Menyelesaikan dokumen klien'];
        $this->withSession($manager)->post($path,$payload)->assertForbidden();
        $this->withSession($owner)->post($path,[...$payload,'end_time'=>'17:00'])->assertSessionHasErrors('end_time');
        $this->withSession($owner)->post($path,[...$payload,'date'=>'2020-01-01'])->assertSessionHasErrors('date');
        $this->withSession($owner)->post($path,$payload)->assertSessionHasNoErrors();
        $id=DB::table('overtime_requests')->where('user_id','overtime-test-user')->value('id');
        $this->withSession($owner)->post($path,$payload)->assertSessionHasErrors('start_time');
        $report='/dashboard/productivity/overtime-test-user?report=1&start_date=2020-01-02&end_date=2020-01-02';
        $this->withSession($owner)->get($report)->assertOk()->assertJsonPath('attendance.0.workMinutes',645)->assertJsonPath('attendance.0.lateMinutes',15)->assertJsonPath('attendance.0.overtimeMinutes',0);
        $this->withSession($owner)->patch($path.'/'.$id,['status'=>'APPROVED'])->assertForbidden();
        $this->withSession(['auth_user'=>['id'=>'overtime-test-user','role'=>'ADMINISTRATOR']])->patch($path.'/'.$id,['status'=>'APPROVED'])->assertForbidden();
        $this->withSession($manager)->patch($path.'/'.$id,['status'=>'APPROVED'])->assertSessionHasNoErrors();
        $this->withSession($owner)->get($report)->assertOk()->assertJsonPath('attendance.0.overtimeMinutes',90);
        DB::table('app_settings')->where('settings_key','PAYROLL_SETTINGS')->update(['settings_value'=>json_encode(['start_time'=>'09:00'])]);
        $this->withSession($owner)->get($report)->assertOk()->assertJsonPath('attendanceStartTime','09:00')->assertJsonPath('attendance.0.lateMinutes',0)->assertJsonPath('employee.lateDays',0);
        $this->withSession($manager)->patch($path.'/'.$id,['status'=>'REJECTED','review_notes'=>'Diperiksa ulang'])->assertSessionHasErrors('status');
        $this->withSession($owner)->post($path,[...$payload,'start_time'=>'19:00','end_time'=>'19:30'])->assertSessionHasNoErrors();
        $next=DB::table('overtime_requests')->where('user_id','overtime-test-user')->max('id');
        $this->withSession($manager)->patch($path.'/'.$next,['status'=>'REJECTED'])->assertSessionHasErrors('review_notes');
        $this->withSession($manager)->patch($path.'/'.$next,['status'=>'REJECTED','review_notes'=>'Tidak diperlukan'])->assertSessionHasNoErrors();
        $this->withSession($owner)->get($report)->assertOk()->assertJsonPath('attendance.0.overtimeMinutes',90);
    }
}
