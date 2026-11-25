<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AttendanceSettingsTest extends TestCase
{
    use DatabaseTransactions;

    private function manager(): array { return ['auth_user'=>['id'=>'settings-manager','role'=>'PIMPINAN','source'=>'user']]; }
    private function policy(): array { return ['start_time'=>'09:00','end_time'=>'17:30','grace_minutes'=>15,'annual_leave_days'=>14,'office_latitude'=>0,'office_longitude'=>0,'office_radius_meters'=>10]; }
    protected function setUp(): void { parent::setUp(); config(['app.url'=>'http://localhost']); url()->forceRootUrl('http://localhost'); }

    public function test_settings_restrict_access_preserve_legacy_hours_and_are_shared_with_payroll(): void
    {
        DB::table('app_settings')->where('settings_key','ATTENDANCE_SETTINGS')->delete();
        DB::table('app_settings')->updateOrInsert(['settings_key'=>'PAYROLL_SETTINGS'],['id'=>'attendance-legacy-test','settings_value'=>json_encode(['start_time'=>'09:00','end_time'=>'17:00','grace_minutes'=>5,'rules'=>[]]),'updated_at'=>now()]);
        $path='/dashboard/pegawai/absensi/settings';
        $employee=['auth_user'=>['id'=>'employee','role'=>'STAFFADMIN','source'=>'user']];
        $this->withSession($employee)->get($path)->assertForbidden();
        $this->withSession($employee)->put($path,$this->policy())->assertForbidden();
        $this->withSession($this->manager())->get($path)->assertInertia(fn($page)=>$page->where('settings.start_time','09:00')->where('settings.end_time','17:00')->where('settings.grace_minutes',5)->where('settings.office_radius_meters',10));
        $this->withSession($this->manager())->put($path,$this->policy())->assertSessionHasNoErrors();
        $this->withSession($this->manager())->get($path)->assertInertia(fn($page)=>$page->where('settings.annual_leave_days',14)->where('settings.end_time','17:30')->where('settings.office_latitude',0));
        $this->withSession($this->manager())->put('/dashboard/payroll/settings',['rules'=>[],'start_time'=>'01:00','end_time'=>'02:00','grace_minutes'=>99])->assertSessionHasNoErrors();
        $this->withSession($this->manager())->get('/dashboard/payroll/settings')->assertInertia(fn($page)=>$page->where('settings.start_time','09:00')->where('settings.end_time','17:30')->where('settings.grace_minutes',15));
        foreach ([['end_time'=>'08:00'],['office_radius_meters'=>0],['office_latitude'=>91],['annual_leave_days'=>-1],['office_longitude'=>null]] as $invalid) {
            $this->withSession($this->manager())->put($path,[...$this->policy(),...$invalid])->assertSessionHasErrors(array_key_first($invalid));
        }
    }

    public function test_office_checkin_and_checkout_enforce_radius_on_server_and_other_locations_remain_available(): void
    {
        Storage::fake('public_root');
        DB::table('user')->insert(['id'=>'geofence-user','username'=>'geofence-user','email'=>'geofence@example.invalid','fullName'=>'Geofence Test','passwordHash'=>'unused','role'=>'STAFFADMIN','isActive'=>true,'createdAt'=>now(),'updatedAt'=>now()]);
        DB::table('staff')->insert(['id'=>'geofence-staff','userId'=>'geofence-user','attendance_enabled'=>true,'createdAt'=>now(),'updatedAt'=>now()]);
        $this->withSession($this->manager())->put('/dashboard/pegawai/absensi/settings',$this->policy())->assertSessionHasNoErrors();
        $owner=['auth_user'=>['id'=>'geofence-user','role'=>'STAFFADMIN','source'=>'user']];
        $payload=fn($latitude,$action='checkin',$type='Office')=>['attendanceAction'=>$action,'workLocationType'=>$type,'locationLabel'=>'Alamat Pengujian','locationSource'=>'manual','latitude'=>$latitude,'longitude'=>0,'locationAccuracy'=>3,'photo'=>UploadedFile::fake()->image('selfie.jpg')];
        $this->withSession($owner)->post('/dashboard/pegawai/absensi',$payload(.0001))->assertSessionHasErrors('workLocationType');
        $this->assertDatabaseMissing('attendance',['staffId'=>'geofence-staff']);
        $this->assertCount(0,Storage::disk('public_root')->allFiles());
        $this->withSession($owner)->post('/dashboard/pegawai/absensi',$payload(.00008))->assertSessionHasNoErrors();
        $record=DB::table('attendance')->where('staffId','geofence-staff')->first();
        $notes=json_decode($record->notes,true);
        $this->assertSame(10,$notes['checkIn']['officeVerification']['radiusMeters']);
        $this->assertLessThan(10,$notes['checkIn']['officeVerification']['distanceMeters']);
        $this->withSession($owner)->post('/dashboard/pegawai/absensi',$payload(.001,'checkout'))->assertSessionHasErrors('workLocationType');
        $this->assertNull(DB::table('attendance')->where('id',$record->id)->value('checkOut'));
        $this->withSession($owner)->post('/dashboard/pegawai/absensi',$payload(0,'checkout'))->assertSessionHasNoErrors();
        $this->assertNotNull(DB::table('attendance')->where('id',$record->id)->value('checkOut'));
        DB::table('attendance')->where('id',$record->id)->delete();
        $this->withSession($owner)->post('/dashboard/pegawai/absensi',$payload(1,'checkin','WFH'))->assertSessionHasNoErrors();
    }

    public function test_kpi_and_attendance_report_use_shared_start_time_and_grace(): void
    {
        DB::table('user')->insert(['id'=>'attendance-clock-user','username'=>'attendance-clock-user','email'=>'clock@example.invalid','fullName'=>'Clock Test','passwordHash'=>'unused','role'=>'STAFFADMIN','isActive'=>true,'createdAt'=>'2020-01-01','updatedAt'=>now()]);
        DB::table('staff')->insert(['id'=>'attendance-clock-staff','userId'=>'attendance-clock-user','attendance_enabled'=>true,'createdAt'=>'2020-01-01','updatedAt'=>now()]);
        foreach (['02'=>'09:10:00','03'=>'09:16:00'] as $day=>$time) DB::table('attendance')->insert(['id'=>'attendance-clock-'.$day,'staffId'=>'attendance-clock-staff','date'=>'2020-01-'.$day,'checkIn'=>'2020-01-'.$day.' '.$time,'status'=>'Hadir','createdAt'=>now(),'updatedAt'=>now()]);
        $this->withSession($this->manager())->put('/dashboard/pegawai/absensi/settings',$this->policy())->assertSessionHasNoErrors();
        $this->withSession($this->manager())->get('/dashboard/productivity/attendance-clock-user?report=1&start_date=2020-01-01&end_date=2020-01-05')->assertOk()->assertJsonPath('employee.lateDays',1)->assertJsonPath('attendanceStartTime','09:00')->assertJsonPath('attendanceGraceMinutes',15);
        $response=$this->withSession($this->manager())->get('/dashboard/pegawai/laporan?month=2020-01')->assertOk();
        $row=collect($response->viewData('page')['props']['rows'])->firstWhere('id','attendance-clock-user');
        $this->assertSame(1,(int)$row->lateDays);
    }
}
