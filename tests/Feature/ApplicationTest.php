<?php

namespace Tests\Feature;

use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\JobController;
use App\Http\Controllers\UserLoginController;
use App\Mail\SystemNotificationMail;
use App\Services\DocumentNumberService;
use App\Services\NotificationGateway;
use App\Services\QuotationPublisher;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Testing\AssertableInertia as Assert;
use Mockery;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class ApplicationTest extends TestCase
{
    use DatabaseTransactions;

    public function test_initial_document_title_uses_configured_branding(): void
    {
        config(['app.url' => 'http://localhost', 'app.name' => 'Laravel']);
        url()->forceRootUrl('http://localhost');
        $key = 'GLOBAL_APP_SETTINGS';
        $stored = DB::table('app_settings')->where('settings_key', $key)->first();
        $settings = json_decode($stored?->settings_value ?: '{}', true) ?: [];
        $settings['general']['appName'] = 'Kantor Uji Notaris';
        DB::table('app_settings')->updateOrInsert(['settings_key' => $key], ['id' => $stored?->id ?: 'test-brand-settings', 'settings_value' => json_encode($settings), 'updated_at' => now()]);
        \Illuminate\Support\Facades\Cache::forget('app.global-branding');
        $this->get('/login')->assertOk()->assertSee('<title inertia>Kantor Uji Notaris</title>', false);
        \Illuminate\Support\Facades\Cache::forget('app.global-branding');
    }

    public function test_required_routes_are_registered(): void
    {
        $routes = app('router')->getRoutes();
        $this->assertTrue($routes->hasNamedRoute('login'));
        $this->assertTrue($routes->hasNamedRoute('admin.login'));
        $this->assertTrue($routes->hasNamedRoute('admin.frontend'));
        $this->assertTrue($routes->hasNamedRoute('dashboard'));
        $this->assertTrue($routes->hasNamedRoute('clients.index'));
        $this->assertTrue($routes->hasNamedRoute('jobs.index'));
        $this->assertTrue($routes->hasNamedRoute('tracking'));
        $this->assertTrue($routes->hasNamedRoute('tracking.search'));
        $this->assertStringEndsWith('/cekberkas', route('tracking'));
        $this->assertTrue($routes->hasNamedRoute('jobs.fees.update'));
        $this->assertTrue($routes->hasNamedRoute('quotations.index'));
        $this->assertTrue($routes->hasNamedRoute('quotations.store'));
        $this->assertTrue($routes->hasNamedRoute('quotations.publish'));
        $this->assertTrue($routes->hasNamedRoute('quotations.cancel'));
        $this->assertTrue($routes->hasNamedRoute('invoices.notify'));
        $this->assertTrue($routes->hasNamedRoute('jobs.notify'));
        $this->assertTrue($routes->hasNamedRoute('user-logins.index'));
        $this->assertTrue($routes->hasNamedRoute('user-logins.store'));
        $this->assertTrue($routes->hasNamedRoute('user-logins.update'));
        $this->assertTrue($routes->hasNamedRoute('user-logins.status'));
        $this->assertTrue($routes->hasNamedRoute('user-logins.destroy'));
    }

    public function test_creating_employee_creates_linked_login_with_default_password(): void
    {
        config(['app.url' => 'http://localhost']);
        url()->forceRootUrl('http://localhost');

        if (! Schema::hasTable('user') || ! Schema::hasTable('staff')) {
            $this->markTestSkipped('Skema pegawai belum tersedia di database pengujian.');
        }

        $username = 'test-pegawai-'.\Illuminate\Support\Str::random(10);
        $this->withSession(['auth_user' => ['id' => 'admin-test', 'role' => 'ADMINISTRATOR']])
            ->post(route('staff.store'), [
                'fullName' => 'Pegawai Baru',
                'username' => $username,
                'email' => $username.'@example.com',
                'role' => 'STAFFADMIN',
            ])->assertRedirect(route('staff.index'))->assertSessionHasNoErrors();

        $user = DB::table('user')->where('username', $username)->first();
        $this->assertNotNull($user);
        $this->assertTrue(\Illuminate\Support\Facades\Hash::check('123456789', $user->passwordHash));
        $this->assertDatabaseHas('staff', ['userId' => $user->id]);
    }

    public function test_dashboard_and_statistics_filter_jobs_by_creation_date(): void
    {
        if (! Schema::hasTable('badan_hukum')) {
            $this->markTestSkipped('Skema pekerjaan belum tersedia di database pengujian.');
        }
        config(['app.url' => 'http://localhost']);
        url()->forceRootUrl('http://localhost');
        $start = '2020-01-01';
        $end = '2020-12-31';
        $expected = collect(['badan_hukum', 'non_badan_hukum', 'ppat'])
            ->sum(fn ($table) => DB::table($table)->whereBetween('createdAt', [$start.' 00:00:00', $end.' 23:59:59'])->count());
        $session = ['auth_user' => ['id' => 'test', 'role' => 'ADMINISTRATOR']];
        foreach (['/dashboard', '/dashboard/stats'] as $path) {
            $this->withSession($session)->get($path.'?start_date='.$start.'&end_date='.$end)
                ->assertOk()
                ->assertInertia(fn (Assert $page) => $page
                    ->where('filters.start_date', $start)
                    ->where('filters.end_date', $end)
                    ->where('stats.total', $expected)
                    ->has('months', 12));
            $this->withSession($session)->get($path.'?start_date=2020-12-31&end_date=2020-01-01')
                ->assertSessionHasErrors('end_date');
        }
    }

    public function test_productivity_detail_shows_employee_metrics_and_restricts_other_staff(): void
    {
        if (! Schema::hasTable('user') || ! ($employee = DB::table('user')->first())) {
            $this->markTestSkipped('Data pegawai pengujian belum tersedia.');
        }
        config(['app.url' => 'http://localhost']);
        url()->forceRootUrl('http://localhost');
        $admin = ['auth_user' => ['id' => 'test-admin', 'role' => 'ADMINISTRATOR', 'source' => 'admin']];
        $expected = collect(['badan_hukum', 'non_badan_hukum', 'ppat'])
            ->sum(fn ($table) => DB::table($table)->where('staffId', $employee->id)->count());
        $this->withSession($admin)->get('/dashboard/productivity/'.$employee->id)
            ->assertOk()->assertInertia(fn (Assert $page) => $page
                ->component('Modules/ProductivityDetail')
                ->where('employee.id', $employee->id)
                ->where('employee.photoPath', DB::table('staff')->where('userId', $employee->id)->value('photoPath'))
                ->where('employee.totalJobs', $expected)
                ->has('jobs')->has('tasks')->has('attendance'));
        $this->withSession(['auth_user' => ['id' => 'other-user', 'role' => 'STAFFADMIN', 'source' => 'user']])
            ->get('/dashboard/productivity/'.$employee->id)->assertForbidden();
        $this->withSession(['auth_user' => ['id' => $employee->id, 'role' => 'STAFFADMIN', 'source' => 'user']])
            ->get('/dashboard/productivity/'.$employee->id)->assertOk();
    }

    public function test_kpi_report_returns_all_records_and_restricts_access(): void
    {
        config(['app.url' => 'http://localhost']);
        url()->forceRootUrl('http://localhost');
        $employee = DB::table('user')->whereIn('role', ['STAFFADMIN', 'OB', 'ADMINISTRATOR', 'PIMPINAN'])->first();
        if (! $employee) $this->markTestSkipped('Data pegawai pengujian belum tersedia.');
        $path = '/dashboard/productivity/'.$employee->id.'?report=1';
        $expectedTasks = DB::table('job_employee_task')->where('userId', $employee->id)->count();
        $expectedJobs = collect(['badan_hukum', 'non_badan_hukum', 'ppat'])->sum(fn ($table) => DB::table($table)->where('staffId', $employee->id)->count());
        $this->withSession(['auth_user' => ['id' => 'test-admin', 'role' => 'ADMINISTRATOR', 'source' => 'admin']])
            ->get($path)->assertOk()->assertJsonCount($expectedTasks, 'tasks')->assertJsonCount($expectedJobs, 'jobs')
            ->assertJsonPath('employee.email', $employee->email)->assertJsonStructure(['insights'])->assertHeader('Cache-Control', 'no-store, private');
        $this->withSession(['auth_user' => ['id' => 'other-user', 'role' => 'STAFFADMIN', 'source' => 'user']])
            ->get($path)->assertForbidden();
    }

    public function test_kpi_report_compares_equal_length_periods_using_record_dates(): void
    {
        config(['app.url' => 'http://localhost']);
        url()->forceRootUrl('http://localhost');
        $employee = DB::table('user')->whereIn('role', ['STAFFADMIN', 'OB', 'ADMINISTRATOR', 'PIMPINAN'])->first();
        if (! $employee) $this->markTestSkipped('Data pegawai pengujian belum tersedia.');
        $expected = DB::table('job_employee_task')->where('userId', $employee->id)
            ->whereBetween('createdAt', ['2026-01-01 00:00:00', '2026-01-10 23:59:59'])->count();
        $session = ['auth_user' => ['id' => 'test-admin', 'role' => 'ADMINISTRATOR', 'source' => 'admin']];
        $path = '/dashboard/productivity/'.$employee->id;
        $this->withSession($session)->get($path.'?report=1&start_date=2026-01-11&end_date=2026-01-20')
            ->assertOk()->assertJsonPath('comparison.previousStart', '2026-01-01')
            ->assertJsonPath('comparison.previousEnd', '2026-01-10')
            ->assertJsonPath('comparison.previous.totalTasks', $expected);
        $this->withSession($session)->get($path.'?report=1')->assertOk()->assertJsonPath('comparison', null);
    }

    public function test_task_work_status_tracks_changes_and_restricts_access(): void
    {
        config(['app.url' => 'http://localhost']);
        url()->forceRootUrl('http://localhost');
        $user = DB::table('user')->whereIn('role', ['STAFFADMIN', 'OB'])->first();
        if (! $user) $this->markTestSkipped('Data pegawai pengujian belum tersedia.');
        $id = 'kpi-status-test-'.\Illuminate\Support\Str::random(8);
        DB::table('job_employee_task')->insert(['id' => $id, 'userId' => $user->id, 'taskType' => 'PIC', 'createdAt' => now(), 'updatedAt' => now()]);
        $path = '/dashboard/tasks/'.$id.'/work-status';
        $payload = ['status' => 'SELESAI', 'targetDate' => '2026-11-30', 'reason' => 'Tugas selesai'];
        $this->withSession(['auth_user' => ['id' => 'other-user', 'role' => 'STAFFADMIN', 'source' => 'user']])->patch($path, $payload)->assertForbidden();
        $this->withSession(['auth_user' => ['id' => $user->id, 'role' => 'STAFFADMIN', 'source' => 'user']])->patch($path, $payload)->assertRedirect();
        $this->assertDatabaseHas('job_employee_task', ['id' => $id, 'workStatus' => 'SELESAI', 'targetDate' => '2026-11-30']);
        $this->assertNotNull(DB::table('job_employee_task')->where('id', $id)->value('completedAt'));
        $this->assertDatabaseHas('task_status_history', ['taskId' => $id, 'oldStatus' => null, 'newStatus' => 'SELESAI', 'reason' => 'Tugas selesai']);
        $this->withSession(['auth_user' => ['id' => $user->id, 'role' => 'STAFFADMIN', 'source' => 'user']])->patch($path, ['status' => 'PROSES', 'reason' => 'Dibuka kembali'])->assertRedirect();
        $this->assertNull(DB::table('job_employee_task')->where('id', $id)->value('completedAt'));
        $this->assertDatabaseHas('task_status_history', ['taskId' => $id, 'oldStatus' => 'SELESAI', 'newStatus' => 'PROSES']);
    }

    public function test_ob_role_cannot_access_restricted_modules(): void
    {
        config(['app.url' => 'http://localhost']);
        url()->forceRootUrl('http://localhost');
        $ob = ['auth_user' => ['id' => 'test-ob', 'role' => 'OB', 'source' => 'user']];
        foreach (['/dashboard/quotation', '/dashboard/invoice', '/dashboard/clients', '/dashboard/jobs/inbound', '/dashboard/jobs/new', '/dashboard/akta', '/dashboard/modules'] as $path) {
            $response = $this->withSession($ob)->get($path);
            // A missing route is inaccessible as well.
            $this->assertContains($response->status(), [403, 404], $path);
        }
        $this->withSession($ob)->get('/dashboard/tasks')->assertOk();
        $admin = ['auth_user' => ['id' => 'test-admin', 'role' => 'ADMINISTRATOR', 'source' => 'admin']];
        $this->withSession($admin)->get('/dashboard/invoice')->assertOk();
        $this->withSession($admin)->get('/dashboard/jobs/inbound')->assertOk();
    }

    public function test_kpi_evaluation_requires_manager_and_stays_in_selected_period(): void
    {
        config(['app.url' => 'http://localhost']); url()->forceRootUrl('http://localhost');
        $user = DB::table('user')->whereIn('role', ['STAFFADMIN', 'OB', 'ADMINISTRATOR', 'PIMPINAN'])->first();
        if (! $user) $this->markTestSkipped('Pegawai uji tidak tersedia.');
        $path = '/dashboard/productivity/'.$user->id.'/evaluation';
        $data = ['start_date'=>'2026-01-01', 'end_date'=>'2026-01-31', 'notes'=>'Catatan uji', 'improvement_plan'=>'Rencana uji', 'next_target'=>'Target uji'];
        $this->withSession(['auth_user'=>['id'=>$user->id,'role'=>'STAFFADMIN','source'=>'user']])->put($path, $data)->assertForbidden();
        $this->withSession(['auth_user'=>['id'=>'test-admin','role'=>'ADMINISTRATOR','source'=>'admin']])->put($path, $data)->assertRedirect();
        $this->assertDatabaseHas('kpi_evaluations', ['user_id'=>$user->id,'period_start'=>'2026-01-01','period_end'=>'2026-01-31','notes'=>'Catatan uji']);
        $this->withSession(['auth_user'=>['id'=>'test-admin','role'=>'ADMINISTRATOR','source'=>'admin']])->get('/dashboard/productivity/'.$user->id.'?report=1&start_date=2026-01-01&end_date=2026-01-31')->assertOk()->assertJsonPath('evaluation.notes', 'Catatan uji');
    }

    public function test_self_profile_requires_current_password_and_supports_photo(): void
    {
        config(['app.url'=>'http://localhost']); url()->forceRootUrl('http://localhost');
        Storage::fake('public_root');
        $id = 'profile-test-user';
        DB::table('user')->insert(['id'=>$id,'username'=>'profile-test-user','email'=>'profile-test@example.invalid','fullName'=>'Uji Profil','passwordHash'=>\Illuminate\Support\Facades\Hash::make('old-password'),'role'=>'STAFFADMIN','isActive'=>true,'createdAt'=>now(),'updatedAt'=>now()]);
        $session=['auth_user'=>['id'=>$id,'source'=>'user','role'=>'STAFFADMIN']];
        $data=['fullName'=>'Nama Baru','email'=>'profile-test@example.invalid','phone'=>'','current_password'=>'salah','password'=>'new-password','password_confirmation'=>'new-password'];
        $this->withSession($session)->put('/dashboard/profile',$data)->assertSessionHasErrors('current_password');
        $this->assertTrue(\Illuminate\Support\Facades\Hash::check('old-password', DB::table('user')->where('id',$id)->value('passwordHash')));
        $data['current_password']='old-password'; $data['photo']=UploadedFile::fake()->image('profil.png');
        $this->withSession($session)->put('/dashboard/profile',$data)->assertRedirect()->assertSessionHasNoErrors();
        $this->assertTrue(\Illuminate\Support\Facades\Hash::check('new-password', DB::table('user')->where('id',$id)->value('passwordHash')));
        $photo=DB::table('staff')->where('userId',$id)->value('photoPath'); $this->assertNotEmpty($photo); Storage::disk('public_root')->assertExists(ltrim($photo,'/'));
        $this->withSession($session)->get('/dashboard/profile')->assertOk()->assertInertia(fn(Assert $page)=>$page->where('profile.fullName','Nama Baru')->where('profile.photoPath',$photo));
    }

    public function test_logo_upload_is_stored_and_requires_admin(): void
    {
        config(['app.url'=>'http://localhost']); url()->forceRootUrl('http://localhost'); Storage::fake('public_root');
        $this->postJson('/dashboard/settings/upload',['type'=>'logo','file'=>UploadedFile::fake()->image('logo.png')])->assertRedirect();
        $admin = DB::table('admin')->where('role','ADMINISTRATOR')->where('isActive',true)->first();
        if (! $admin) $this->markTestSkipped('Admin pengujian belum tersedia.');
        $result=$this->withSession(['auth_user'=>['id'=>$admin->id,'source'=>'admin','role'=>'ADMINISTRATOR']])->postJson('/dashboard/settings/upload',['type'=>'logo','file'=>UploadedFile::fake()->image('logo.png')])->assertOk();
        Storage::disk('public_root')->assertExists(ltrim($result->json('url'),'/'));
    }

    public function test_kpi_detail_uses_the_viewed_employees_photo(): void
    {
        config(['app.url' => 'http://localhost']);
        url()->forceRootUrl('http://localhost');
        DB::table('user')->insert(['id' => 'kpi-photo-user', 'username' => 'kpi-photo-user', 'email' => 'kpi-photo@example.invalid', 'fullName' => 'Photo Test', 'passwordHash' => 'unused', 'role' => 'STAFFADMIN', 'isActive' => true, 'createdAt' => now(), 'updatedAt' => now()]);
        DB::table('staff')->insert(['id' => 'kpi-photo-staff', 'userId' => 'kpi-photo-user', 'photoPath' => '/uploads/staff/kpi-photo.jpg', 'createdAt' => now(), 'updatedAt' => now()]);
        $this->withSession(['auth_user' => ['id' => 'test-admin', 'role' => 'ADMINISTRATOR', 'source' => 'admin']])
            ->get('/dashboard/productivity/kpi-photo-user')->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('employee.photoPath', '/uploads/staff/kpi-photo.jpg'));
        $this->withSession(['auth_user' => ['id' => 'other-user', 'role' => 'STAFFADMIN', 'source' => 'user']])
            ->get('/dashboard/productivity/kpi-photo-user')->assertForbidden();
    }

    public function test_employee_kpis_filter_and_sort_the_selected_period(): void
    {
        if (! Schema::hasTable('user') || ! ($employee = DB::table('user')->first())) {
            $this->markTestSkipped('Data pegawai pengujian belum tersedia.');
        }
        config(['app.url' => 'http://localhost']);
        url()->forceRootUrl('http://localhost');
        $start = '2026-01-01';
        $end = '2026-12-31';
        $bounds = [$start.' 00:00:00', $end.' 23:59:59'];
        $expected = collect(['badan_hukum', 'non_badan_hukum', 'ppat'])
            ->sum(fn ($table) => DB::table($table)->where('staffId', $employee->id)->whereBetween('createdAt', $bounds)->count());
        $tasks = DB::table('job_employee_task')->where('userId', $employee->id)->whereBetween('createdAt', $bounds)->count();
        $session = ['auth_user' => ['id' => 'test-admin', 'role' => 'ADMINISTRATOR', 'source' => 'admin']];
        $path = '/dashboard/productivity/'.$employee->id;
        $this->withSession($session)->get($path.'?start_date='.$start.'&end_date='.$end.'&sort=asc')
            ->assertOk()->assertInertia(fn (Assert $page) => $page
                ->where('filters.start_date', $start)->where('filters.end_date', $end)
                ->where('filters.sort', 'asc')->where('employee.totalJobs', $expected)
                ->where('employee.totalTasks', $tasks));
        $this->withSession($session)->get($path.'?start_date=2026-11-19&end_date=2026-11-19')
            ->assertOk()->assertInertia(fn (Assert $page) => $page->where('filters.start_date', '2026-11-19')->where('filters.end_date', '2026-11-19'));
        $this->withSession($session)->get($path.'?start_date=2026-12-31&end_date=2026-01-01')
            ->assertSessionHasErrors('end_date');
        $this->withSession($session)->get($path.'?start_date=2026-01-01')
            ->assertSessionHasErrors('end_date');
        $this->withSession($session)->get($path.'?sort=invalid')->assertSessionHasErrors('sort');
    }

    public function test_productivity_team_filters_period_and_sorts_employees(): void
    {
        if (! Schema::hasTable('user') || ! ($employee = DB::table('user')->first())) {
            $this->markTestSkipped('Data pegawai pengujian belum tersedia.');
        }
        config(['app.url' => 'http://localhost']);
        url()->forceRootUrl('http://localhost');
        $session = ['auth_user' => ['id' => 'test-admin', 'role' => 'ADMINISTRATOR', 'source' => 'admin']];
        $start = '2026-01-01';
        $end = '2026-12-31';
        $bounds = [$start.' 00:00:00', $end.' 23:59:59'];
        $expected = collect(['badan_hukum', 'non_badan_hukum', 'ppat'])
            ->sum(fn ($table) => DB::table($table)->where('staffId', $employee->id)->whereBetween('createdAt', $bounds)->count());
        $response = $this->withSession($session)->get('/dashboard/productivity?start_date='.$start.'&end_date='.$end.'&sort=oldest');
        $response->assertOk()->assertInertia(fn (Assert $page) => $page->component('Modules/Productivity')
            ->where('filters.start_date', $start)->where('filters.end_date', $end)->where('filters.sort', 'oldest')->has('staff'));
        $staff = collect($response->viewData('page')['props']['staff']);
        $this->assertSame($expected, $staff->firstWhere('id', $employee->id)['totalJobs']);
        $dates = $staff->pluck('createdAt')->all();
        $sorted = $dates;
        sort($sorted);
        $this->assertSame($sorted, $dates);
        $this->withSession($session)->get('/dashboard/productivity?start_date=2026-11-19&end_date=2026-11-19')->assertOk();
        $this->withSession($session)->get('/dashboard/productivity?start_date=2026-12-31&end_date=2026-01-01')->assertSessionHasErrors('end_date');
        $this->withSession($session)->get('/dashboard/productivity?sort=invalid')->assertSessionHasErrors('sort');
        $this->withSession(['auth_user' => ['id' => $employee->id, 'role' => 'STAFFADMIN', 'source' => 'user']])
            ->get('/dashboard/productivity?start_date='.$start.'&end_date='.$end)
            ->assertOk()->assertInertia(fn (Assert $page) => $page->has('staff', 1)->where('staff.0.id', $employee->id));
    }

    public function test_admin_dashboard_shows_today_attendance_notifications_without_leaking_to_staff(): void
    {
        if (! Schema::hasTable('attendance')) {
            $this->markTestSkipped('Skema absensi belum tersedia.');
        }
        config(['app.url' => 'http://localhost']);
        url()->forceRootUrl('http://localhost');
        $suffix = strtolower(\Illuminate\Support\Str::random(8));
        foreach (['WFH', 'WFC', 'Dinas Luar', 'Missing', 'NoProfile', 'Inactive', 'AdminMissing', 'AdminWFH'] as $index => $type) {
            $id = 'qa-'.$suffix.'-'.$index;
            DB::table('user')->insert(['id' => $id, 'username' => $id, 'email' => $id.'@example.com', 'fullName' => 'QA '.$suffix.' '.$type, 'passwordHash' => 'test', 'role' => str_starts_with($type, 'Admin') ? 'ADMINISTRATOR' : 'STAFFADMIN', 'isActive' => $type !== 'Inactive', 'createdAt' => now(), 'updatedAt' => now()]);
            if ($type === 'NoProfile') continue;
            $staffId = 'staff-'.$id;
            DB::table('staff')->insert(['id' => $staffId, 'userId' => $id, 'createdAt' => now(), 'updatedAt' => now()]);
            if (in_array($type, ['WFH', 'WFC', 'Dinas Luar', 'AdminWFH'], true)) {
                DB::table('attendance')->insert(['id' => 'att-'.$id, 'staffId' => $staffId, 'date' => now(), 'checkIn' => now(), 'status' => 'Hadir', 'notes' => json_encode(['checkIn' => ['workLocationType' => $type === 'AdminWFH' ? 'WFH' : $type]]), 'createdAt' => now(), 'updatedAt' => now()]);
            }
        }
        $admin = ['auth_user' => ['id' => 'admin-test', 'role' => 'ADMINISTRATOR', 'source' => 'admin']];
        $response = $this->withSession($admin)->get('/dashboard')->assertOk();
        $notifications = $response->viewData('page')['props']['attendanceNotifications'];
        foreach (['wfh' => 'WFH', 'wfc' => 'WFC', 'dinas' => 'Dinas Luar', 'missing' => 'Missing'] as $key => $label) {
            $this->assertContains('QA '.$suffix.' '.$label, $notifications[$key]);
        }
        $this->assertNotContains('QA '.$suffix.' AdminMissing', $notifications['missing']);
        $this->assertNotContains('QA '.$suffix.' AdminWFH', $notifications['wfh']);
        $this->assertNotContains('QA '.$suffix.' Inactive', $notifications['missing']);
        $this->assertNotContains('QA '.$suffix.' NoProfile', $notifications['missing']);
        $staff = ['auth_user' => ['id' => 'qa-'.$suffix.'-0', 'role' => 'STAFFADMIN', 'source' => 'user']];
        $this->withSession($staff)->get('/dashboard?view=overview')->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('attendanceNotifications', null));
    }

    public function test_reverse_geocoding_succeeds_when_file_cache_is_unavailable(): void
    {
        $cache = Mockery::mock();
        $cache->shouldReceive('get')->once()->andThrow(new \RuntimeException('cache read failed'));
        $cache->shouldReceive('put')->once()->andThrow(new \RuntimeException('cache write failed'));
        \Illuminate\Support\Facades\Cache::shouldReceive('store')->with('file')->twice()->andReturn($cache);
        Http::fake(['*' => Http::response(['display_name' => 'Alamat uji'], 200)]);
        $request = Request::create('/dashboard/pegawai/absensi/location', 'GET', ['latitude' => -6.17539, 'longitude' => 106.82715]);
        $response = app(\App\Http\Controllers\AttendanceController::class)->reverseGeocode($request);
        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame('Alamat uji', $response->getData(true)['address']);
    }

    public function test_attendance_keeps_gps_and_marks_manual_address_when_geocoding_is_unavailable(): void
    {
        if (! Schema::hasTable('attendance')) {
            $this->markTestSkipped('Skema absensi belum tersedia.');
        }
        config(['app.url' => 'http://localhost']);
        url()->forceRootUrl('http://localhost');
        $suffix = strtolower(\Illuminate\Support\Str::random(10));
        $userId = 'qa-gps-'.$suffix;
        $staffId = 'staff-'.$userId;
        DB::table('user')->insert(['id' => $userId, 'username' => $userId, 'email' => $userId.'@example.com', 'fullName' => 'QA Lokasi', 'passwordHash' => 'test', 'role' => 'STAFFADMIN', 'isActive' => true, 'createdAt' => now(), 'updatedAt' => now()]);
        DB::table('staff')->insert(['id' => $staffId, 'userId' => $userId, 'createdAt' => now(), 'updatedAt' => now()]);
        $session = ['auth_user' => ['id' => $userId, 'role' => 'STAFFADMIN', 'source' => 'user']];
        Http::fake(['*' => Http::response([], 503)]);
        $latitude = -6 - random_int(10000, 90000) / 100000;
        $this->withSession($session)->getJson('/dashboard/pegawai/absensi/location?latitude='.$latitude.'&longitude=106.8')->assertStatus(502);
        Storage::fake('public_root');
        $this->withSession($session)->post('/dashboard/pegawai/absensi', [
            'attendanceAction' => 'checkin', 'workLocationType' => 'WFH', 'locationLabel' => 'Alamat diisi manual', 'locationSource' => 'manual',
            'latitude' => $latitude, 'longitude' => 106.8, 'locationAccuracy' => 10.5, 'photo' => UploadedFile::fake()->image('foto.jpg'),
        ])->assertSessionHasNoErrors()->assertRedirect(route('attendance.checkin'));
        $record = DB::table('attendance')->where('staffId', $staffId)->first();
        $this->assertNotNull($record);
        $checkIn = json_decode($record->notes, true)['checkIn'];
        $this->assertSame('manual', $checkIn['locationSource']);
        $this->assertSame('Alamat diisi manual', $checkIn['locationLabel']);
        $this->assertEquals($latitude, $checkIn['latitude']);
        $this->assertEquals(106.8, $checkIn['longitude']);
        $this->assertEquals(10.5, $checkIn['locationAccuracy']);
        $recap = $this->withSession($session)->get('/dashboard/pegawai/absensi')->assertOk();
        $this->assertSame($record->id, data_get($recap->viewData('page')['props']['today'], 'id'));
        $rows = collect($recap->viewData('page')['props']['records']['data']);
        $this->assertTrue($rows->contains(fn ($row) => data_get($row, 'id') === $record->id && data_get($row, 'staffName') === 'QA Lokasi'));
        $this->assertNull(data_get($rows->firstWhere('id', $record->id), 'checkOut'));
        $admin = ['auth_user' => ['id' => 'test-admin', 'role' => 'ADMINISTRATOR', 'source' => 'admin']];
        $noProfile = ['auth_user' => ['id' => 'no-profile-'.$suffix, 'role' => 'STAFFADMIN', 'source' => 'user']];
        $noProfileRecap = $this->withSession($noProfile)->get('/dashboard/pegawai/absensi')->assertOk();
        $this->assertEmpty($noProfileRecap->viewData('page')['props']['records']['data']);
        $adminRecap = $this->withSession($admin)->get('/dashboard/pegawai/absensi')->assertOk();
        $this->assertTrue(collect($adminRecap->viewData('page')['props']['records']['data'])->contains(fn ($row) => data_get($row, 'id') === $record->id));
        $report = $this->withSession($admin)->get('/dashboard/pegawai/laporan?month='.now()->format('Y-m'))->assertOk();
        $reportRows = collect($report->viewData('page')['props']['rows']);
        $this->assertGreaterThanOrEqual(1, (int) data_get($reportRows->firstWhere('id', $userId), 'presentDays'));
        $this->withSession($session)->post('/dashboard/pegawai/absensi', [
            'attendanceAction' => 'checkin', 'workLocationType' => 'WFH', 'locationLabel' => 'Alamat manual', 'locationSource' => 'manual',
            'photo' => UploadedFile::fake()->image('foto.jpg'),
        ])->assertSessionHasErrors(['latitude', 'longitude']);
        $this->withSession($session)->get('/dashboard/pegawai/absensi/absenku')->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('checkoutRequested', false)->where('today.id', $record->id));
        $this->withSession($session)->get('/dashboard/pegawai/absensi/absenku?action=checkout')->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('checkoutRequested', true));
        $submission = [
            'workLocationType' => 'WFH', 'locationLabel' => 'Alamat manual', 'locationSource' => 'manual',
            'latitude' => $latitude, 'longitude' => 106.8, 'photo' => UploadedFile::fake()->image('foto.jpg'),
        ];
        $this->withSession($session)->post('/dashboard/pegawai/absensi', [...$submission, 'attendanceAction' => 'checkin'])->assertSessionHasErrors('attendanceAction');
        $this->assertNull(DB::table('attendance')->where('id', $record->id)->value('checkOut'));
        $this->withSession($session)->post('/dashboard/pegawai/absensi', $submission)->assertSessionHasErrors('attendanceAction');
        $this->withSession($session)->post('/dashboard/pegawai/absensi', [...$submission, 'attendanceAction' => 'checkout'])->assertSessionHasNoErrors()->assertRedirect(route('attendance.checkin'));
        $checkedOut = DB::table('attendance')->where('id', $record->id)->first();
        $this->assertNotNull($checkedOut->checkOut);
        $this->assertArrayHasKey('checkIn', json_decode($checkedOut->notes, true));
        $this->assertArrayHasKey('checkOut', json_decode($checkedOut->notes, true));
        $this->withSession($session)->post('/dashboard/pegawai/absensi', [...$submission, 'attendanceAction' => 'checkout'])->assertSessionHasErrors('attendanceAction');
    }

    public function test_employee_cannot_update_employee_fees(): void
    {
        $request = Request::create('/dashboard/jobs/badan_hukum/job-test/fees', 'PATCH', [
            'employeeTasks' => [],
        ]);
        $session = app('session')->driver();
        $session->put('auth_user', [
            'id' => 'employee-test',
            'role' => 'STAFFADMIN',
        ]);
        $request->setLaravelSession($session);

        try {
            app(JobController::class)->updateEmployeeFees($request, 'badan_hukum', 'job-test');
            $this->fail('Pegawai tidak boleh dapat mengubah fee.');
        } catch (HttpException $exception) {
            $this->assertSame(403, $exception->getStatusCode());
            $this->assertSame('Hanya Admin atau Pimpinan yang dapat mengubah fee pegawai.', $exception->getMessage());
        }
    }

    public function test_employee_cannot_manage_user_logins(): void
    {
        $request = Request::create('/dashboard/system/users', 'GET');
        $session = app('session')->driver();
        $session->put('auth_user', [
            'id' => 'employee-test',
            'role' => 'STAFFADMIN',
            'source' => 'user',
        ]);
        $request->setLaravelSession($session);

        try {
            app(UserLoginController::class)->index($request);
            $this->fail('STAFFADMIN seharusnya tidak dapat mengelola user login.');
        } catch (HttpException $exception) {
            $this->assertSame(403, $exception->getStatusCode());
        }
    }

    public function test_every_main_page_can_be_opened_with_an_authenticated_session(): void
    {
        $this->withoutExceptionHandling();
        config(['app.url' => 'http://localhost']);
        url()->forceRootUrl('http://localhost');

        if (! Schema::hasTable('admin') && ! Schema::hasTable('user')) {
            $this->markTestSkipped('Legacy schema is not installed on the isolated test database.');
        }

        $account = DB::table('admin')->where('isActive', true)->first()
            ?? DB::table('user')->where('isActive', true)->first();

        $this->assertNotNull($account, 'An active account is required for the page smoke test.');

        $session = ['auth_user' => [
            'id' => $account->id,
            'username' => $account->username,
            'fullName' => $account->fullName,
            'email' => $account->email,
            'role' => 'ADMINISTRATOR',
            'source' => 'admin',
        ]];

        $pages = [
            '/dashboard',
            '/dashboard/stats',
            '/dashboard/clients',
            '/dashboard/jobs/inbound',
            '/dashboard/jobs/processing',
            '/dashboard/jobs/completed',
            '/dashboard/akta',
            '/dashboard/saksi',
            '/dashboard/invoice',
            '/dashboard/quotation',
            '/dashboard/finance',
            '/dashboard/pegawai/data',
            '/dashboard/pegawai/absensi',
            '/dashboard/pegawai/laporan',
            '/dashboard/productivity',
            '/dashboard/reports',
            '/dashboard/audit',
            '/dashboard/settings',
            '/dashboard/clients/new',
            '/dashboard/jobs/new',
            '/dashboard/jobs/new?type=badan_hukum',
            '/dashboard/jobs/new?type=non_badan_hukum',
            '/dashboard/jobs/new?type=ppat',
            '/dashboard/invoice/new',
            '/dashboard/quotation/new',
            '/dashboard/pegawai/new',
        ];

        if ($clientId = DB::table('client')->value('id')) {
            $pages[] = "/dashboard/clients/{$clientId}";
            $pages[] = "/dashboard/clients/{$clientId}/edit";
        }
        if ($staffId = DB::table('user')->value('id')) {
            $pages[] = "/dashboard/pegawai/{$staffId}";
            $pages[] = "/dashboard/pegawai/{$staffId}/edit";
        }
        foreach (['badan_hukum', 'non_badan_hukum', 'ppat'] as $jobType) {
            if ($jobId = DB::table($jobType)->value('id')) {
                $pages[] = "/dashboard/jobs/{$jobType}/{$jobId}";
                $pages[] = "/dashboard/jobs/{$jobType}/{$jobId}/edit";
                $pages[] = "/dashboard/jobs/{$jobId}";
            }
        }
        if ($invoiceId = DB::table('invoice')->value('id')) {
            $pages[] = "/dashboard/invoice/{$invoiceId}";
            $pages[] = "/dashboard/invoice/{$invoiceId}/edit";
        }
        if (Schema::hasTable('quotation') && $quotationId = DB::table('quotation')->value('id')) {
            $pages[] = "/dashboard/quotation/{$quotationId}";
            $pages[] = "/dashboard/quotation/{$quotationId}/edit";
            $pages[] = "/print/quotation/{$quotationId}";
        }

        foreach ($pages as $page) {
            $response = $this->followingRedirects()->withSession($session)->get($page);
            $this->assertSame(200, $response->getStatusCode(), "Page {$page} did not open successfully.");
        }
    }

    public function test_jobs_can_attach_existing_invoice_and_start_new_invoice(): void
    {
        if (! Schema::hasTable('invoice') || ! ($clientId = DB::table('client')->value('id')) || ! ($staffId = DB::table('user')->value('id'))) {
            $this->markTestSkipped('Skema dan data pengujian belum tersedia.');
        }
        config(['app.url' => 'http://localhost']);
        url()->forceRootUrl('http://localhost');
        $session = ['auth_user' => ['id' => $staffId, 'role' => 'ADMINISTRATOR', 'source' => 'user']];
        $invoiceId = 'inv-qa-'.uniqid();
        DB::table('invoice')->insert(['id' => $invoiceId, 'invoiceNumber' => 'QA-'.uniqid(), 'amount' => 100000, 'status' => 'Lunas', 'date' => now(), 'createdAt' => now(), 'updatedAt' => now()]);
        $job = ['jobType' => 'badan_hukum', 'clientId' => $clientId, 'title' => 'QA invoice '.uniqid(), 'type' => 'PT / PMA', 'status' => 'PENDING', 'priority' => 'MEDIUM', 'tanggalMasuk' => today()->toDateString(), 'invoiceAction' => 'existing', 'sourceInvoiceId' => $invoiceId];
        $this->withSession($session)->post('/dashboard/jobs', $job)->assertRedirect(route('jobs.index'))->assertSessionHasNoErrors();
        $created = DB::table('badan_hukum')->where('title', $job['title'])->first();
        $this->assertNotNull($created);
        $this->assertDatabaseHas('invoice', ['id' => $invoiceId, 'badanHukumId' => $created->id]);
        $this->assertSame('LUNAS', $created->invoiceStatus);
        $form = $this->withSession($session)->get('/dashboard/jobs/new?type=badan_hukum')->assertOk();
        $this->assertTrue(collect($form->viewData('page')['props']['availableInvoices'])->contains('id', $invoiceId));
        $secondTitle = 'QA shared '.uniqid();
        $this->withSession($session)->post('/dashboard/jobs', [...$job, 'title' => $secondTitle])->assertSessionHasNoErrors();
        $sharedJob = DB::table('badan_hukum')->where('title', $secondTitle)->first();
        $this->assertNotNull($sharedJob);
        $this->assertDatabaseHas('badan_hukum', ['id' => $sharedJob->id, 'sourceInvoiceId' => $invoiceId, 'invoiceStatus' => 'LUNAS']);
        $this->assertDatabaseHas('invoice', ['id' => $invoiceId, 'badanHukumId' => $created->id]);
        $this->withSession($session)->put('/dashboard/invoice/'.$invoiceId, [
            'editReason' => 'Perbarui status pembayaran',
            'status' => 'DP Bayar', 'date' => today()->toDateString(),
            'items' => [['description' => 'Test', 'quantity' => 1, 'unit' => 'item', 'unitPrice' => 100000]],
        ])->assertSessionHasNoErrors();
        $this->assertDatabaseHas('badan_hukum', ['id' => $created->id, 'invoiceStatus' => 'DP']);
        $this->assertDatabaseHas('badan_hukum', ['id' => $sharedJob->id, 'invoiceStatus' => 'DP']);
        $editTitle = 'QA shared edit '.uniqid();
        $editJobData = [...$job, 'title' => $editTitle, 'invoiceAction' => 'none', 'sourceInvoiceId' => null, 'description' => 'Perbarui invoice terkait'];
        $this->withSession($session)->post('/dashboard/jobs', $editJobData)->assertSessionHasNoErrors();
        $editJob = DB::table('badan_hukum')->where('title', $editTitle)->first();
        $this->withSession($session)->put('/dashboard/jobs/badan_hukum/'.$editJob->id, [...$editJobData, 'invoiceAction' => 'existing', 'sourceInvoiceId' => $invoiceId])->assertSessionHasNoErrors();
        $this->assertDatabaseHas('badan_hukum', ['id' => $editJob->id, 'sourceInvoiceId' => $invoiceId, 'invoiceStatus' => 'DP']);
        $this->assertDatabaseHas('invoice', ['id' => $invoiceId, 'badanHukumId' => $created->id]);
        $directTitle = 'QA direct invoice '.uniqid();
        $directData = [...$job, 'title' => $directTitle, 'invoiceAction' => 'none', 'sourceInvoiceId' => null];
        $this->withSession($session)->post('/dashboard/jobs', $directData)->assertSessionHasNoErrors();
        $directJob = DB::table('badan_hukum')->where('title', $directTitle)->first();
        $show = $this->withSession($session)->get('/dashboard/jobs/badan_hukum/'.$directJob->id)->assertOk();
        $this->assertTrue(collect($show->viewData('page')['props']['availableInvoices'])->contains('id', $invoiceId));
        $this->withSession($session)->post('/dashboard/jobs/badan_hukum/'.$directJob->id.'/invoice', ['invoiceId' => $invoiceId])->assertSessionHasNoErrors();
        $this->assertDatabaseHas('badan_hukum', ['id' => $directJob->id, 'title' => $directTitle, 'sourceInvoiceId' => $invoiceId, 'invoiceStatus' => 'DP']);
        $this->assertDatabaseHas('invoice', ['id' => $invoiceId, 'badanHukumId' => $created->id]);
        $this->withSession($session)->post('/dashboard/jobs/badan_hukum/'.$directJob->id.'/invoice', ['invoiceId' => $invoiceId])->assertSessionHasErrors('invoiceId');
        $this->withSession($session)->delete('/dashboard/invoice/'.$invoiceId)->assertRedirect(route('invoices.index'));
        $this->assertDatabaseHas('badan_hukum', ['id' => $editJob->id, 'sourceInvoiceId' => null, 'invoiceStatus' => 'PENDING']);
        $this->assertDatabaseHas('badan_hukum', ['id' => $sharedJob->id, 'sourceInvoiceId' => null, 'invoiceStatus' => 'PENDING']);
        $newJob = [...$job, 'title' => 'QA new invoice '.uniqid(), 'invoiceAction' => 'new', 'sourceInvoiceId' => null];
        $response = $this->withSession($session)->post('/dashboard/jobs', $newJob)->assertSessionHasNoErrors();
        $createdNew = DB::table('badan_hukum')->where('title', $newJob['title'])->first();
        $this->assertNotNull($createdNew);
        $response->assertRedirect(route('invoices.create', ['job' => $createdNew->id, 'type' => 'badan_hukum']));
        $anotherJob = [...$newJob, 'title' => 'QA created invoice '.uniqid()];
        $this->withSession($session)->post('/dashboard/jobs', $anotherJob)->assertSessionHasNoErrors();
        $invoiceJob = DB::table('badan_hukum')->where('title', $anotherJob['title'])->first();
        $invoiceResponse = $this->withSession($session)->post('/dashboard/invoice', [
            'jobId' => $invoiceJob->id, 'jobType' => 'badan_hukum', 'date' => today()->toDateString(),
            'items' => [['description' => 'Jasa', 'quantity' => 1, 'unit' => 'item', 'unitPrice' => 100000]],
        ])->assertSessionHasNoErrors();
        $newInvoice = DB::table('invoice')->where('badanHukumId', $invoiceJob->id)->first();
        $this->assertNotNull($newInvoice);
        $invoiceResponse->assertRedirect(route('invoices.show', $newInvoice->id));
        $invoiceTwo = 'inv-qa-'.uniqid();
        DB::table('invoice')->insert(['id' => $invoiceTwo, 'invoiceNumber' => 'QA-'.uniqid(), 'amount' => 200000, 'status' => 'DP Bayar', 'date' => now(), 'createdAt' => now(), 'updatedAt' => now()]);
        $update = [...$newJob, 'invoiceAction' => 'existing', 'sourceInvoiceId' => $invoiceTwo, 'description' => 'Hubungkan invoice'];
        $this->withSession($session)->put('/dashboard/jobs/badan_hukum/'.$createdNew->id, $update)->assertSessionHasNoErrors()->assertRedirect(route('jobs.show', ['badan_hukum', $createdNew->id]));
        $this->assertDatabaseHas('invoice', ['id' => $invoiceTwo, 'badanHukumId' => $createdNew->id]);
        $this->assertDatabaseHas('badan_hukum', ['id' => $createdNew->id, 'sourceInvoiceId' => $invoiceTwo, 'invoiceStatus' => 'DP']);
        $this->withSession($session)->put('/dashboard/jobs/badan_hukum/'.$createdNew->id, [...$update, 'invoiceAction' => 'new'])->assertSessionHasErrors('sourceInvoiceId');
        $this->withSession($session)->post('/dashboard/invoice', ['jobId' => $createdNew->id, 'jobType' => 'badan_hukum', 'date' => today()->toDateString(), 'items' => [['description' => 'Test', 'quantity' => 1, 'unit' => 'item', 'unitPrice' => 100]]])->assertSessionHasErrors('jobId');
    }

    public function test_job_can_store_multiple_attachments_with_descriptions(): void
    {
        config(['app.url' => 'http://localhost']);
        url()->forceRootUrl('http://localhost');

        if (! Schema::hasTable('attachment')) {
            $this->markTestSkipped('Legacy schema is not installed on the isolated test database.');
        }

        $account = DB::table('admin')->where('isActive', true)->first();
        $clientId = DB::table('client')->value('id');
        $staffId = DB::table('user')->where('isActive', true)->value('id');
        $this->assertNotNull($account);
        $this->assertNotNull($clientId);
        $this->assertNotNull($staffId);
        Storage::fake('public_root');

        $session = ['auth_user' => [
            'id' => $account->id,
            'username' => $account->username,
            'fullName' => $account->fullName,
            'email' => $account->email,
            'role' => 'ADMINISTRATOR',
            'source' => 'admin',
        ]];
        $firstName = 'qa-ktp-'.uniqid().'.pdf';
        $secondName = 'qa-npwp-'.uniqid().'.pdf';

        $response = $this->withSession($session)->post('/dashboard/jobs', [
            'jobType' => 'badan_hukum',
            'clientId' => $clientId,
            'staffId' => $staffId,
            'title' => 'QA Multi Lampiran',
            'type' => 'PT / PMA',
            'companyName' => 'PT QA Lampiran',
            'status' => 'PENDING',
            'priority' => 'MEDIUM',
            'deadline' => now()->addDays(14)->toDateString(),
            'tanggalMasuk' => today()->toDateString(),
            'saksi' => 'QA',
            'attachments' => [
                UploadedFile::fake()->create($firstName, 20, 'application/pdf'),
                UploadedFile::fake()->create($secondName, 20, 'application/pdf'),
            ],
            'attachmentDescriptions' => [
                'KTP — KTP Direktur Utama',
                'NPWP — NPWP Perusahaan',
            ],
            'attachmentDeposits' => [true, false],
        ]);

        $response->assertRedirect(route('jobs.index'));
        $job = DB::table('badan_hukum')->where('title', 'QA Multi Lampiran')->orderByDesc('createdAt')->first();
        $this->assertNotNull($job);
        $this->assertMatchesRegularExpression('/^\d{4}\/[A-Z]+\/(I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII)\/\d{4}$/', $job->trackingCode);
        $this->assertDatabaseHas('attachment', ['fileName' => $firstName, 'description' => 'KTP — KTP Direktur Utama', 'isPhysicalDeposited' => true]);
        $this->assertDatabaseHas('attachment', ['fileName' => $secondName, 'description' => 'NPWP — NPWP Perusahaan', 'isPhysicalDeposited' => false]);
    }

    public function test_quotation_can_store_pic_and_multiple_items(): void
    {
        $this->withoutExceptionHandling();
        config(['app.url' => 'http://localhost']);
        url()->forceRootUrl('http://localhost');
        if (! Schema::hasTable('quotation') || ! Schema::hasTable('quotation_item')) {
            $this->markTestSkipped('Quotation tables are not installed.');
        }

        $account = DB::table('admin')->where('isActive', true)->first();
        $picUserId = DB::table('user')->where('isActive', true)->value('id');
        $this->assertNotNull($account);
        $this->assertNotNull($picUserId);
        $subject = 'QA Quotation '.uniqid();
        $session = ['auth_user' => [
            'id' => $account->id,
            'username' => $account->username,
            'fullName' => $account->fullName,
            'email' => $account->email,
            'role' => 'ADMINISTRATOR',
            'source' => 'admin',
        ]];

        $response = $this->withSession($session)->post('/dashboard/quotation', [
            'clientMode' => 'new',
            'clientId' => null,
            'clientName' => 'PT Client Quotation Manual',
            'clientPhone' => '081234567890',
            'clientEmail' => '',
            'clientAddress' => '',
            'picUserId' => $picUserId,
            'subject' => $subject,
            'quotationDate' => today()->toDateString(),
            'validUntil' => today()->addDays(14)->toDateString(),
            'status' => 'Draft',
            'discount' => 500000,
            'taxPercent' => 11,
            'notes' => 'Penawaran pengujian',
            'terms' => 'Berlaku empat belas hari.',
            'items' => [
                ['description' => 'Jasa Pendirian PT', 'quantity' => 2, 'unit' => 'paket', 'unitPrice' => 1500000],
                ['description' => 'Biaya Administrasi', 'quantity' => 1, 'unit' => 'item', 'unitPrice' => 500000],
            ],
        ]);
        $response->assertSessionHasNoErrors();

        $quotation = DB::table('quotation')->where('subject', $subject)->first();
        $this->assertNotNull($quotation);
        $response->assertRedirect(route('quotations.show', $quotation->id));
        $this->assertSame($picUserId, $quotation->picUserId);
        $this->assertMatchesRegularExpression('/^\d{4}\/[A-Z]+\/(I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII)\/\d{4}$/', $quotation->quotationNumber);
        $this->assertNull($quotation->clientId);
        $this->assertSame('PT Client Quotation Manual', $quotation->clientName);
        $this->assertNull($quotation->clientEmail);
        $this->assertNull($quotation->clientAddress);
        $this->assertEquals(3500000, (float) $quotation->subtotal);
        $this->assertEquals(3330000, (float) $quotation->grandTotal);
        $this->assertSame(2, DB::table('quotation_item')->where('quotationId', $quotation->id)->count());
        $this->assertDatabaseHas('quotation_item', ['quotationId' => $quotation->id, 'description' => 'Jasa Pendirian PT']);
    }

    public function test_quotation_can_use_an_existing_client(): void
    {
        config(['app.url' => 'http://localhost']);
        url()->forceRootUrl('http://localhost');
        if (! Schema::hasTable('quotation')) {
            $this->markTestSkipped('Quotation tables are not installed.');
        }

        $account = DB::table('admin')->where('isActive', true)->first();
        $client = DB::table('client')->first();
        $picUserId = DB::table('user')->where('isActive', true)->value('id');
        $this->assertNotNull($account);
        $this->assertNotNull($client);
        $this->assertNotNull($picUserId);
        $subject = 'QA Existing Client '.uniqid();
        $session = ['auth_user' => [
            'id' => $account->id,
            'username' => $account->username,
            'fullName' => $account->fullName,
            'email' => $account->email,
            'role' => 'ADMINISTRATOR',
            'source' => 'admin',
        ]];

        $response = $this->withSession($session)->post('/dashboard/quotation', [
            'clientMode' => 'existing',
            'clientId' => $client->id,
            'clientName' => null,
            'clientPhone' => null,
            'clientEmail' => null,
            'clientAddress' => null,
            'picUserId' => $picUserId,
            'subject' => $subject,
            'quotationDate' => today()->toDateString(),
            'validUntil' => today()->addDays(14)->toDateString(),
            'status' => 'Draft',
            'discount' => 0,
            'taxPercent' => 0,
            'items' => [
                ['description' => 'Jasa Client Lama', 'quantity' => 1, 'unit' => 'paket', 'unitPrice' => 1000000],
            ],
        ]);

        $response->assertSessionHasNoErrors();
        $quotation = DB::table('quotation')->where('subject', $subject)->first();
        $this->assertNotNull($quotation);
        $response->assertRedirect(route('quotations.show', $quotation->id));
        $this->assertSame($client->id, $quotation->clientId);
        $this->assertSame($client->name, $quotation->clientName);
        $this->assertSame($client->phone, $quotation->clientPhone);
    }

    public function test_document_number_prefixes_are_configurable_and_use_one_format(): void
    {
        if (! Schema::hasTable('app_settings')) {
            $this->markTestSkipped('Application settings table is not installed.');
        }

        $row = DB::table('app_settings')->where('settings_key', 'GLOBAL_APP_SETTINGS')->first();
        $settings = $row ? json_decode($row->settings_value, true) ?: [] : [];
        $settings['documentNumbers'] = [
            'quotation' => 'PEN',
            'invoice' => 'TAG',
            'badan_hukum' => 'BH',
            'non_badan_hukum' => 'NBH',
            'ppat' => 'PAT',
        ];
        DB::table('app_settings')->updateOrInsert(
            ['settings_key' => 'GLOBAL_APP_SETTINGS'],
            [
                'id' => 'settings-global',
                'settings_value' => json_encode($settings),
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );

        $numbers = app(DocumentNumberService::class);
        $date = '2037-02-03';
        $generated = [
            $numbers->next('quotation', $date),
            $numbers->next('invoice', $date),
            $numbers->next('badan_hukum', $date),
            $numbers->next('non_badan_hukum', $date),
            $numbers->next('ppat', $date),
        ];

        $this->assertMatchesRegularExpression('/^\d{4}\/PEN\/II\/2037$/', $generated[0]);
        $this->assertMatchesRegularExpression('/^\d{4}\/TAG\/II\/2037$/', $generated[1]);
        $this->assertMatchesRegularExpression('/^\d{4}\/BH\/II\/2037$/', $generated[2]);
        $this->assertMatchesRegularExpression('/^\d{4}\/NBH\/II\/2037$/', $generated[3]);
        $this->assertMatchesRegularExpression('/^\d{4}\/PAT\/II\/2037$/', $generated[4]);
    }

    public function test_quotation_publish_and_send_message_are_separate_actions(): void
    {
        $this->withoutExceptionHandling();
        config(['app.url' => 'http://localhost']);
        url()->forceRootUrl('http://localhost');

        if (! Schema::hasTable('quotation_publications')) {
            $this->markTestSkipped('Quotation publication table is not installed.');
        }

        $account = DB::table('admin')->where('isActive', true)->first();
        $quotation = DB::table('quotation')->first();
        $this->assertNotNull($account);
        $this->assertNotNull($quotation);

        DB::table('quotation_publications')->where('quotationId', $quotation->id)->delete();
        if (Schema::hasColumn('invoice', 'quotationId')) {
            DB::table('invoice')->where('quotationId', $quotation->id)->delete();
        }
        DB::table('quotation')->where('id', $quotation->id)->update([
            'clientName' => 'QA Client Publish',
            'clientPhone' => '081234567890',
            'clientEmail' => 'client.publish@example.com',
            'status' => 'Draft',
        ]);
        $row = DB::table('app_settings')->where('settings_key', 'GLOBAL_APP_SETTINGS')->first();
        $settings = $row ? json_decode($row->settings_value, true) ?: [] : [];
        $settings['email'] = [
            'enabled' => true,
            'host' => 'smtp.gmail.com',
            'port' => 465,
            'encryption' => 'ssl',
            'username' => 'sender@gmail.com',
            'appPassword' => 'test-app-password',
            'fromAddress' => 'sender@gmail.com',
            'fromName' => 'QA Notaris',
        ];
        $settings['whatsapp'] = [
            'enabled' => true,
            'provider' => 'fonnte',
            'endpointUrl' => 'https://api.fonnte.com/send',
            'apiToken' => 'test-fonnte-token',
        ];
        DB::table('app_settings')->updateOrInsert(
            ['settings_key' => 'GLOBAL_APP_SETTINGS'],
            [
                'id' => 'settings-global',
                'settings_value' => json_encode($settings),
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );

        Mail::fake();
        Http::fake([
            'api.fonnte.com/*' => Http::response([
                'status' => true,
                'detail' => 'success! message in queue',
            ]),
        ]);
        $session = ['auth_user' => [
            'id' => $account->id,
            'username' => $account->username,
            'fullName' => $account->fullName,
            'email' => $account->email,
            'role' => 'ADMINISTRATOR',
            'source' => 'admin',
        ]];

        $response = $this->withSession($session)
            ->post("/dashboard/quotation/{$quotation->id}/publish", [
                'publishWithoutNotification' => false,
            ]);

        $response->assertSessionHasNoErrors();
        $response->assertSessionHas('success');
        $this->assertDatabaseHas('quotation', [
            'id' => $quotation->id,
            'status' => 'Diterbitkan',
        ]);
        $publication = DB::table('quotation_publications')
            ->where('quotationId', $quotation->id)
            ->first();
        $this->assertNull($publication?->emailSentAt);
        $this->assertNull($publication?->whatsappSentAt);
        $this->assertNotNull($publication?->publishedAt);
        Mail::assertNothingSent();
        Http::assertNothingSent();
        $this->withSession($session)->post("/dashboard/quotation/{$quotation->id}/notify")->assertSessionHasNoErrors()->assertSessionHas('success');
        Mail::assertSent(SystemNotificationMail::class, fn ($mail) => $mail->hasTo('client.publish@example.com')
            && str_contains($mail->body, (string) $quotation->quotationNumber)
            && str_contains($mail->body, 'Total penawaran'));
        Http::assertSent(fn ($request) => $request->url() === 'https://api.fonnte.com/send'
            && $request->hasHeader('Authorization', 'test-fonnte-token')
            && $request['target'] === '6281234567890');

        $this->withExceptionHandling();
        $this->withSession($session)->post("/dashboard/quotation/{$quotation->id}/publish")->assertSessionHasErrors('publish');
        Mail::assertSentCount(1);
        Http::assertSentCount(1);

        if (Schema::hasColumn('invoice', 'quotationId')) {
            $this->withSession($session)
                ->get("/dashboard/invoice/new?quotation={$quotation->id}")
                ->assertOk()
                ->assertInertia(fn (Assert $page) => $page
                    ->component('Invoices/Form')
                    ->where('sourceQuotation.id', $quotation->id)
                    ->has('quotationItems'));
        }

        $this->withExceptionHandling();
        $this->withSession($session)
            ->post("/dashboard/quotation/{$quotation->id}/cancel")
            ->assertSessionHasErrors('cancellationReason');
        $this->withoutExceptionHandling();
        $this->assertDatabaseHas('quotation', [
            'id' => $quotation->id,
            'status' => 'Diterbitkan',
        ]);

        $this->withSession($session)
            ->post("/dashboard/quotation/{$quotation->id}/cancel", [
                'cancellationReason' => 'Client membatalkan rencana pekerjaan.',
            ])
            ->assertSessionHasNoErrors();
        $this->assertDatabaseHas('quotation', [
            'id' => $quotation->id,
            'status' => 'Dibatalkan',
            'cancellationReason' => 'Client membatalkan rencana pekerjaan.',
        ]);
    }

    public function test_global_gateway_builds_informative_invoice_and_job_messages(): void
    {
        config(['app.url' => 'http://localhost']);
        url()->forceRootUrl('http://localhost');

        if (! Schema::hasTable('app_settings')) {
            Schema::create('app_settings', function ($table) {
                $table->string('id')->primary();
                $table->string('settings_key')->unique();
                $table->text('settings_value');
                $table->timestamps();
            });
        }

        $row = DB::table('app_settings')->where('settings_key', 'GLOBAL_APP_SETTINGS')->first();
        $settings = $row ? json_decode($row->settings_value, true) ?: [] : [];
        $settings['email'] = [
            'enabled' => true,
            'host' => 'smtp.gmail.com',
            'port' => 465,
            'encryption' => 'ssl',
            'username' => 'sender@gmail.com',
            'appPassword' => 'test-app-password',
            'fromAddress' => 'sender@gmail.com',
            'fromName' => 'QA Notaris',
        ];
        $settings['whatsapp'] = [
            'enabled' => true,
            'provider' => 'fonnte',
            'endpointUrl' => 'https://api.fonnte.com/send',
            'apiToken' => 'test-fonnte-token',
        ];
        DB::table('app_settings')->updateOrInsert(
            ['settings_key' => 'GLOBAL_APP_SETTINGS'],
            [
                'id' => 'settings-global',
                'settings_value' => json_encode($settings),
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );

        Mail::fake();
        Http::fake([
            'api.fonnte.com/*' => Http::response(['status' => true, 'detail' => 'queued']),
        ]);
        $gateway = app(NotificationGateway::class);
        $recipient = [
            'clientName' => 'Client QA',
            'clientEmail' => 'client.qa@example.com',
            'clientPhone' => '081234567890',
        ];

        $gateway->notify('invoice', $recipient + [
            'number' => 'INV/24072026/0001',
            'title' => 'Pendirian PT',
            'total' => 5000000,
            'dueDate' => '2026-08-01',
            'status' => 'Belum Bayar',
            'url' => 'http://localhost/print/invoice/inv-qa',
        ]);
        $gateway->notify('job', $recipient + [
            'number' => 'BH/24072026/0001',
            'title' => 'Pendirian PT',
            'status' => 'PROSES',
            'url' => 'http://localhost/cekberkas',
            'picName' => 'Admin QA',
        ]);

        Mail::assertSent(SystemNotificationMail::class, 2);
        Mail::assertSent(SystemNotificationMail::class, fn ($mail) => str_contains($mail->mailSubject, 'Invoice INV/24072026/0001')
            && str_contains($mail->body, 'Jatuh tempo: 01-08-2026'));
        Mail::assertSent(SystemNotificationMail::class, fn ($mail) => str_contains($mail->mailSubject, 'Informasi Berkas BH/24072026/0001')
            && str_contains($mail->body, 'Status saat ini: PROSES'));
        Http::assertSentCount(2);
        Http::assertSent(fn ($request) => str_contains((string) $request['message'], 'Total: *Rp 5.000.000*'));
        Http::assertSent(fn ($request) => str_contains((string) $request['message'], 'Status: *PROSES*'));
    }

    public function test_cancelled_quotation_is_locked_from_editing(): void
    {
        $this->withoutExceptionHandling();
        config(['app.url' => 'http://localhost']);
        url()->forceRootUrl('http://localhost');

        if (! Schema::hasTable('quotation')) {
            $this->markTestSkipped('Quotation table is not installed.');
        }

        $account = DB::table('admin')->where('isActive', true)->first()
            ?? DB::table('user')->where('isActive', true)->first();
        $quotation = DB::table('quotation')->first();
        $this->assertNotNull($account);
        $this->assertNotNull($quotation);

        $session = ['auth_user' => [
            'id' => $account->id,
            'username' => $account->username,
            'fullName' => $account->fullName,
            'email' => $account->email,
            'role' => 'ADMINISTRATOR',
            'source' => Schema::hasTable('admin') ? 'admin' : 'user',
        ]];

        DB::table('quotation')->where('id', $quotation->id)->update([
            'status' => 'Dibatalkan',
        ]);

        $this->withSession($session)
            ->get("/dashboard/quotation/{$quotation->id}/edit")
            ->assertRedirect(route('quotations.show', $quotation->id))
            ->assertSessionHasErrors('quotation');

        $this->withSession($session)
            ->put("/dashboard/quotation/{$quotation->id}", [
                'subject' => 'Subject yang tidak boleh tersimpan',
            ])
            ->assertRedirect(route('quotations.show', $quotation->id))
            ->assertSessionHasErrors('quotation');

        $this->assertDatabaseMissing('quotation', [
            'id' => $quotation->id,
            'subject' => 'Subject yang tidak boleh tersimpan',
        ]);
    }

    public function test_quotation_can_be_published_without_notification_channels(): void
    {
        $quotation = DB::table('quotation')->first();
        $this->assertNotNull($quotation);
        DB::table('quotation_publications')->where('quotationId', $quotation->id)->delete();
        DB::table('quotation')->where('id', $quotation->id)->update(['status' => 'Draft']);
        $gateway = Mockery::mock(NotificationGateway::class);
        $publisher = new QuotationPublisher($gateway);
        $message = $publisher->publish($quotation);
        $this->assertStringContainsString('diterbitkan', $message);
        $this->assertDatabaseHas('quotation', ['id' => $quotation->id, 'status' => 'Diterbitkan']);
        $publication = DB::table('quotation_publications')->where('quotationId', $quotation->id)->first();
        $this->assertNotNull($publication?->publishedAt);
        $this->assertNull($publication?->emailSentAt);
        $this->assertNull($publication?->whatsappSentAt);
    }

    public function test_published_quotation_can_be_converted_to_invoice(): void
    {
        $createdQuotationTable = ! Schema::hasTable('quotation');
        $createdInvoiceTable = ! Schema::hasTable('invoice');
        $createdInvoiceItemTable = ! Schema::hasTable('invoice_item');
        $createdFinanceTable = ! Schema::hasTable('financerecord');
        if ($createdQuotationTable) {
            Schema::create('quotation', function ($table) {
                $table->string('id')->primary();
                $table->string('status');
                $table->dateTime('updatedAt')->nullable();
            });
        }
        if ($createdInvoiceTable) {
            Schema::create('invoice', function ($table) {
                $table->string('id')->primary();
                $table->string('invoiceNumber')->unique();
                $table->decimal('amount', 15, 2);
                $table->string('status');
                $table->text('description')->nullable();
                $table->dateTime('dueDate')->nullable();
                $table->dateTime('date');
                $table->string('badanHukumId')->nullable();
                $table->string('nonBadanHukumId')->nullable();
                $table->string('ppatId')->nullable();
                $table->string('quotationId')->nullable()->unique();
                $table->dateTime('createdAt');
                $table->dateTime('updatedAt');
            });
        }
        if ($createdInvoiceItemTable) {
            Schema::create('invoice_item', function ($table) {
                $table->string('id')->primary();
                $table->string('invoiceId');
                $table->text('description');
                $table->decimal('quantity', 12, 2);
                $table->string('unit');
                $table->decimal('unitPrice', 15, 2);
                $table->decimal('total', 15, 2);
                $table->unsignedInteger('sortOrder');
                $table->dateTime('createdAt')->nullable();
                $table->dateTime('updatedAt')->nullable();
            });
        }
        if ($createdFinanceTable) {
            Schema::create('financerecord', function ($table) {
                $table->string('id')->primary();
                $table->string('invoiceId')->nullable();
            });
        }

        $quotationId = 'quo-convert-'.uniqid();
        $quotationData = [
            'id' => $quotationId,
            'status' => 'Dikirim',
            'updatedAt' => now(),
        ];
        if (! $createdQuotationTable) {
            $quotationData += [
                'quotationNumber' => 'QUO/24072026/QA'.uniqid(),
                'clientName' => 'Client QA',
                'picUserId' => 'qa-admin',
                'subject' => 'Quotation QA',
                'quotationDate' => '2026-07-24',
                'subtotal' => 4600000,
                'discount' => 0,
                'taxPercent' => 0,
                'taxAmount' => 0,
                'grandTotal' => 4600000,
                'createdAt' => now(),
            ];
        }
        DB::table('quotation')->insert($quotationData);
        $numbers = Mockery::mock(DocumentNumberService::class);
        $numbers->shouldReceive('next')
            ->once()
            ->with('invoice', '2026-07-24')
            ->andReturn('INV/24072026/0099');
        $controller = new InvoiceController($numbers);
        $request = Request::create('/dashboard/invoice', 'POST', [
            'quotationId' => $quotationId,
            'jobId' => null,
            'jobType' => null,
            'dpAmount' => 0,
            'description' => 'Invoice hasil quotation',
            'date' => '2026-07-24',
            'dueDate' => '2026-08-10',
            'items' => [
                [
                    'description' => 'Jasa Notaris',
                    'quantity' => 1,
                    'unit' => 'item',
                    'unitPrice' => 4000000,
                ],
                [
                    'description' => 'Pembuatan NPWP',
                    'quantity' => 2,
                    'unit' => 'dokumen',
                    'unitPrice' => 300000,
                ],
            ],
        ]);

        $request->setLaravelSession(app('session')->driver());
        $response = $controller->store($request);
        $invoice = DB::table('invoice')->where('quotationId', $quotationId)->first();
        $this->assertNotNull($invoice);
        $this->assertSame('INV/24072026/0099', $invoice->invoiceNumber);
        $this->assertSame(4600000.0, (float) $invoice->amount);
        $this->assertDatabaseHas('invoice_item', [
            'invoiceId' => $invoice->id,
            'description' => 'Jasa Notaris',
            'total' => 4000000,
        ]);
        $this->assertDatabaseHas('invoice_item', [
            'invoiceId' => $invoice->id,
            'description' => 'Pembuatan NPWP',
            'quantity' => 2,
            'unit' => 'dokumen',
            'total' => 600000,
        ]);
        $this->assertDatabaseHas('quotation', [
            'id' => $quotationId,
            'status' => 'Invoice Terbuat',
        ]);
        $this->assertStringContainsString("/dashboard/invoice/{$invoice->id}", $response->getTargetUrl());
        $controller->destroy($invoice->id);
        $this->assertDatabaseMissing('invoice', ['id' => $invoice->id]);
        $this->assertDatabaseHas('quotation', [
            'id' => $quotationId,
            'status' => 'Diterbitkan',
        ]);

        if ($createdFinanceTable) {
            Schema::drop('financerecord');
        }
        if ($createdInvoiceItemTable) {
            Schema::drop('invoice_item');
        }
        if ($createdInvoiceTable) {
            Schema::drop('invoice');
        }
        if ($createdQuotationTable) {
            Schema::drop('quotation');
        }
    }
}
