<?php
namespace Tests\Feature;

use Carbon\Carbon;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class LiveOvertimeTest extends TestCase
{
    use DatabaseTransactions;

    public function test_employee_can_clock_overtime_without_prior_approval_and_only_completed_accepted_minutes_count(): void
    {
        config(['app.url'=>'http://localhost']); url()->forceRootUrl('http://localhost');
        Storage::fake('public_root');
        DB::table('user')->insert(['id'=>'live-ot-user','username'=>'live-ot-user','email'=>'live-ot@example.invalid','fullName'=>'Live Overtime Test','passwordHash'=>'unused','role'=>'OB','isActive'=>true,'createdAt'=>now(),'updatedAt'=>now()]);
        DB::table('staff')->insert(['id'=>'live-ot-staff','userId'=>'live-ot-user','attendance_enabled'=>true,'createdAt'=>'2020-01-01','updatedAt'=>now()]);
        $owner=['auth_user'=>['id'=>'live-ot-user','role'=>'OB','source'=>'user']];
        $manager=['auth_user'=>['id'=>'other-manager','role'=>'PIMPINAN','source'=>'user']];
        $payload=fn($action)=>['attendanceAction'=>$action,'reason'=>'Menyelesaikan pekerjaan kantor','workLocationType'=>'WFH','locationLabel'=>'Lokasi pengujian','latitude'=>-6.2,'longitude'=>106.8,'photo'=>UploadedFile::fake()->image('selfie.jpg')];
        $path='/dashboard/pegawai/absensi';
        try {
            Carbon::setTestNow('2026-11-25 23:00:00');
            $this->withSession($owner)->post($path,$payload('overtime-start'))->assertSessionHasErrors('attendanceAction');
            DB::table('attendance')->insert(['id'=>'live-ot-att','staffId'=>'live-ot-staff','date'=>today(),'checkIn'=>today()->setTime(8,0),'status'=>'Hadir','createdAt'=>now(),'updatedAt'=>now()]);
            $this->withSession($owner)->post($path,[...$payload('overtime-start'),'reason'=>''])->assertSessionHasErrors('reason');
            $this->withSession($owner)->post($path,$payload('overtime-start'))->assertSessionHasNoErrors();
            $row=DB::table('overtime_requests')->where('user_id','live-ot-user')->first();
            $this->assertSame('ACTIVE',$row->status); $this->assertNull($row->end_at);
            $this->withSession($owner)->post($path,$payload('overtime-start'))->assertSessionHasErrors('attendanceAction');
            $review='/dashboard/productivity/live-ot-user/overtime/'.$row->id;
            $this->withSession($manager)->patch($review,['status'=>'APPROVED'])->assertSessionHasErrors('status');
            Carbon::setTestNow('2026-11-26 00:30:00');
            $this->withSession($owner)->post($path,$payload('overtime-finish'))->assertSessionHasNoErrors();
            $row=DB::table('overtime_requests')->where('id',$row->id)->first();
            $this->assertSame('PENDING',$row->status); $this->assertSame(90,(int)$row->minutes);
            $this->assertSame('2026-11-25', $row->date);
            $notes=json_decode($row->attendance_notes,true); Storage::disk('public_root')->assertExists(ltrim($notes['start']['photoPath'],'/')); Storage::disk('public_root')->assertExists(ltrim($notes['finish']['photoPath'],'/'));
            $this->withSession($owner)->post($path,$payload('overtime-finish'))->assertSessionHasErrors('attendanceAction');
            $report='/dashboard/productivity/live-ot-user?report=1&start_date=2026-11-25&end_date=2026-11-25';
            $this->withSession($owner)->get($report)->assertOk()->assertJsonPath('attendance.0.overtimeMinutes',0);
            $this->withSession($owner)->get('/dashboard/pegawai/absensi')->assertInertia(fn ($page)=>$page->where('records.data.0.overtimeMinutes',0)->etc());
            $this->withSession($owner)->patch($review,['status'=>'APPROVED'])->assertForbidden();
            $this->withSession($manager)->patch($review,['status'=>'APPROVED'])->assertSessionHasNoErrors();
            $this->assertDatabaseHas('overtime_requests',['id'=>$row->id,'status'=>'APPROVED','minutes'=>90]);
            $this->withSession($owner)->get($report)->assertOk()->assertJsonPath('attendance.0.overtimeMinutes',90);
            $this->withSession($owner)->get('/dashboard/pegawai/absensi')->assertInertia(fn ($page)=>$page->where('records.data.0.overtimeMinutes',90)->etc());
            $rejected=DB::table('overtime_requests')->insertGetId(['user_id'=>'live-ot-user','date'=>'2026-11-25','start_at'=>'2026-11-25 19:00:00','end_at'=>'2026-11-25 20:00:00','minutes'=>60,'reason'=>'Pengajuan untuk diperiksa','status'=>'PENDING','created_at'=>now(),'updated_at'=>now()]);
            $this->withSession($manager)->patch('/dashboard/productivity/live-ot-user/overtime/'.$rejected,['status'=>'REJECTED','review_notes'=>'Pekerjaan tidak diperlukan'])->assertSessionHasNoErrors();
            $this->withSession($owner)->get($report)->assertOk()->assertJsonPath('attendance.0.overtimeMinutes',90);
            $this->withSession($owner)->get('/dashboard/pegawai/absensi/overtime')->assertOk();
        } finally { Carbon::setTestNow(); }
    }
}
