<?php

namespace Tests\Feature;

use App\Services\NotificationGateway;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AttendanceWhatsAppTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
        config(['app.url'=>'http://localhost']); url()->forceRootUrl('http://localhost');
        Storage::fake('public_root'); Http::preventStrayRequests();
        foreach (['wa-att-employee','wa-att-other'] as $id) {
            DB::table('user')->insert(['id'=>$id,'username'=>$id,'email'=>$id.'@example.invalid','fullName'=>$id,'phone'=>$id==='wa-att-employee' ? '081234567890' : '081398765432','passwordHash'=>'unused','role'=>'STAFFADMIN','isActive'=>true,'createdAt'=>now(),'updatedAt'=>now()]);
            DB::table('staff')->insert(['id'=>$id.'-staff','userId'=>$id,'attendance_enabled'=>true,'createdAt'=>now(),'updatedAt'=>now()]);
        }
    }

    private function configure(array $categories = [], bool $enabled = true): void
    {
        DB::table('app_settings')->updateOrInsert(['settings_key'=>'GLOBAL_APP_SETTINGS'], ['id'=>'wa-att-settings','settings_value'=>json_encode(['general'=>['officeName'=>'Kantor Uji'], 'email'=>['enabled'=>false], 'whatsapp'=>['enabled'=>$enabled,'endpointUrl'=>'https://example.invalid/send','apiToken'=>'fake-token','categories'=>array_replace(NotificationGateway::whatsappCategoryDefaults(), ['attendance'=>true], $categories)], 'notificationTemplates'=>['attendance'=>['whatsapp'=>'Halo {nama_karyawan}. {jenis_absensi} berhasil pada {tanggal} {jam}. {jenis_lokasi}: {lokasi}. {nama_kantor}']]]),'updated_at'=>now()]);
    }

    private function record(string $action, array $extra = [])
    {
        return $this->withSession(['auth_user'=>['id'=>'wa-att-employee','role'=>'STAFFADMIN','source'=>'user']])->post('/dashboard/pegawai/absensi', [...[
            'attendanceAction'=>$action,'workLocationType'=>'WFH','locationLabel'=>'Alamat pengujian','latitude'=>-6.2,'longitude'=>106.8,'photo'=>UploadedFile::fake()->image('photo.jpg'),'reason'=>'Menyelesaikan dokumen kantor',
        ], ...$extra]);
    }

    public function test_successful_attendance_only_notifies_actor_and_duplicates_or_invalid_submissions_send_nothing(): void
    {
        $this->configure(); Http::fake(['*'=>Http::response(['status'=>true])]);
        $this->record('checkin',['latitude'=>null])->assertSessionHasErrors('latitude'); Http::assertNothingSent();
        $this->record('checkin',['clientPhone'=>'081398765432'])->assertSessionHasNoErrors();
        Http::assertSentCount(1);
        Http::assertSent(fn($r)=>$r['target']==='6281234567890' && str_contains($r['message'],'wa-att-employee') && str_contains($r['message'],'Absen masuk') && str_contains($r['message'],'Alamat pengujian') && !str_contains($r['message'],'{nama_karyawan}'));
        $this->record('checkin')->assertSessionHasErrors('attendanceAction'); Http::assertSentCount(1);
        $this->record('checkout')->assertSessionHasNoErrors(); Http::assertSentCount(2);
        $this->record('checkout')->assertSessionHasErrors('attendanceAction'); Http::assertSentCount(2);
        $this->record('overtime-start')->assertSessionHasNoErrors(); Http::assertSentCount(3);
        $this->record('overtime-finish')->assertSessionHasNoErrors(); Http::assertSentCount(4);
        foreach(Http::recorded() as [$request]) $this->assertSame('6281234567890',$request['target']);
    }

    public function test_switches_missing_phone_and_gateway_failure_do_not_undo_attendance(): void
    {
        $this->configure(['attendance'=>false]); Http::fake(['*'=>Http::response(['status'=>true])]);
        $this->record('checkin')->assertSessionHasNoErrors(); Http::assertNothingSent();
        $this->configure([],false); $this->record('checkout')->assertSessionHasNoErrors(); Http::assertNothingSent();
        $this->configure(); DB::table('user')->where('id','wa-att-employee')->update(['phone'=>null]);
        $this->record('overtime-start')->assertSessionHasNoErrors(); Http::assertNothingSent();
        DB::table('user')->where('id','wa-att-employee')->update(['phone'=>'081234567890']);
        Http::fake(['*'=>Http::response(['status'=>false,'reason'=>'Gateway unavailable'],500)]);
        $this->record('overtime-finish')->assertSessionHasNoErrors();
        $this->assertDatabaseHas('overtime_requests',['user_id'=>'wa-att-employee','status'=>'PENDING']);
        Http::assertSentCount(1);
    }

    public function test_category_blocks_direct_whatsapp_and_normalizes_one_indonesian_recipient(): void
    {
        $this->configure(['quotation'=>false,'invoice'=>true,'job'=>false]); Http::fake(['*'=>Http::response(['status'=>true])]);
        $gateway=app(NotificationGateway::class);
        $gateway->sendWhatsapp('quotation',['clientPhone'=>'081234567890']); $gateway->sendWhatsapp('job',['clientPhone'=>'081234567890']); Http::assertNothingSent();
        $gateway->sendWhatsapp('invoice',['clientPhone'=>'081234567890']); Http::assertSentCount(1);
        foreach(['0812 3456-7890','+62 812 3456 7890','6281234567890','81234567890','006281234567890'] as $number) $this->assertSame('6281234567890',NotificationGateway::normalizeIndonesianPhone($number));
        foreach(['','081234567890,081398765432','abc081234567890','+12025550123'] as $number) $this->assertNull(NotificationGateway::normalizeIndonesianPhone($number));
    }

    public function test_settings_save_category_switches_and_attendance_template_with_valid_placeholders(): void
    {
        $account=DB::table('admin')->where('isActive',true)->first();
        $this->assertNotNull($account);
        $admin=['auth_user'=>['id'=>$account->id,'role'=>'ADMINISTRATOR','source'=>'admin']];
        $payload=$this->withSession($admin)->get('/dashboard/settings')->assertOk()->viewData('page')['props']['settings'];
        $payload['general']=['appName'=>'Notaris Digital','officeName'=>'Kantor Pengujian'];
        $payload['email']['enabled']=false; $payload['whatsapp']['enabled']=false;
        $payload['whatsapp']['categories']=['quotation'=>false,'invoice'=>true,'job'=>false,'attendance'=>true];
        $payload['notificationTemplates']['attendance']['whatsapp']='Halo {nama_karyawan}. {jenis_absensi} berhasil pada {tanggal}, {jam}. {lokasi}. {nama_kantor}';
        $this->withSession($admin)->put('/dashboard/settings',$payload)->assertSessionHasNoErrors();
        $this->withSession($admin)->get('/dashboard/settings')->assertInertia(fn($page)=>$page->where('settings.whatsapp.categories',$payload['whatsapp']['categories'])->where('settings.notificationTemplates.attendance.whatsapp',$payload['notificationTemplates']['attendance']['whatsapp'])->etc());
        $payload['notificationTemplates']['attendance']['whatsapp']='Data tidak didukung {semua_nomor}';
        $this->withSession($admin)->put('/dashboard/settings',$payload)->assertSessionHasErrors('notificationTemplates.attendance.whatsapp');
        $payload['notificationTemplates']['attendance']['whatsapp']='Halo {nama_karyawan}';
        $payload['whatsapp']['categories']['attendance']='bukan-boolean';
        $this->withSession($admin)->put('/dashboard/settings',$payload)->assertSessionHasErrors('whatsapp.categories.attendance');
    }
}
