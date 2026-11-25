<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SummaryFiltersTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
        config(['app.url' => 'http://localhost']);
        url()->forceRootUrl('http://localhost');
    }

    private function adminSession(): array
    {
        return ['auth_user' => ['id' => 'local-test-admin', 'username' => 'local-test-admin', 'fullName' => 'Admin Test', 'role' => 'ADMINISTRATOR', 'source' => 'admin']];
    }

    public function test_office_map_link_persists_and_rejects_unsafe_schemes(): void
    {
        $payload = $this->withSession($this->adminSession())->get('/dashboard/settings')->assertOk()->viewData('page')['props']['settings'];
        $payload['general'] = ['appName'=>'Notaris Digital','officeName'=>'Kantor Uji','officeMapUrl'=>'https://maps.app.goo.gl/example-office'];
        $payload['email']['enabled'] = false;
        $payload['whatsapp']['enabled'] = false;
        $this->withSession($this->adminSession())->put('/dashboard/settings',$payload)->assertSessionHasNoErrors();
        $this->withSession($this->adminSession())->get('/dashboard/settings')->assertInertia(fn (Assert $page) => $page->where('settings.general.officeMapUrl','https://maps.app.goo.gl/example-office'));
        $payload['general']['officeMapUrl'] = 'javascript:alert(1)';
        $this->withSession($this->adminSession())->put('/dashboard/settings',$payload)->assertSessionHasErrors('general.officeMapUrl');
        $this->withSession(['auth_user'=>['id'=>'other','role'=>'STAFFADMIN','source'=>'user']])->put('/dashboard/settings',$payload)->assertRedirect('/admin/login');
    }

    public function test_dashboard_reports_real_jobs_and_deadlines_for_selected_period(): void
    {
        DB::table('client')->insert(['id' => 'dashboard-real-client', 'name' => 'Client Dashboard', 'type' => 'individual', 'updatedAt' => now()]);
        foreach (['PENDING', 'PROSES', 'SELESAI'] as $i => $status) {
            DB::table('badan_hukum')->insert([
                'id' => 'dashboard-real-'.$i, 'trackingCode' => 'REAL/DASH/'.$i,
                'clientId' => 'dashboard-real-client', 'title' => 'Berkas Dashboard '.$i,
                'type' => 'PT', 'status' => $status, 'deadline' => '2020-03-25',
                'createdAt' => '2020-03-15 10:00:00', 'updatedAt' => '2020-03-20 10:00:00',
            ]);
        }
        $response = $this->withSession($this->adminSession())->get('/dashboard?start_date=2020-03-01&end_date=2020-03-31')->assertOk();
        $props = $response->viewData('page')['props'];
        $this->assertSame(3, $props['stats']['total']);
        $this->assertSame(1, $props['stats']['pending']);
        $this->assertSame(1, $props['stats']['processing']);
        $this->assertSame(1, $props['stats']['completed']);
        $this->assertSame(3, $props['categoryCounts']['badan_hukum']);
        $this->assertSame(3, $props['months'][0]['incoming']);
        $this->assertSame(1, $props['months'][0]['completed']);
        $this->assertTrue(collect($props['recentJobs'])->contains(fn ($job) => $job->id === 'dashboard-real-0' && str_starts_with($job->deadline, '2020-03-25')));
    }

    public function test_client_type_filter_is_applied_before_pagination(): void
    {
        foreach (range(1, 22) as $i) DB::table('client')->insert(['id' => 'filter-client-'.$i, 'name' => 'Filter Client '.$i, 'type' => $i <= 21 ? 'individual' : 'corporate', 'updatedAt' => now()]);
        $this->withSession($this->adminSession())->get('/dashboard/clients?search=Filter%20Client&type=corporate')->assertOk()->assertInertia(fn (Assert $page) => $page->where('clients.total', 1)->where('clients.data.0.type', 'corporate'));
    }

    public function test_staff_status_filter_is_applied_before_pagination(): void
    {
        foreach (range(1, 22) as $i) DB::table('user')->insert(['id' => 'filter-user-'.$i, 'username' => 'filter-user-'.$i, 'email' => 'filter-user-'.$i.'@example.invalid', 'fullName' => 'Filter Pegawai '.$i, 'passwordHash' => 'unused', 'role' => 'STAFFADMIN', 'isActive' => $i <= 21, 'updatedAt' => now()]);
        $this->withSession($this->adminSession())->get('/dashboard/pegawai/data?search=Filter%20Pegawai&status=inactive')->assertOk()->assertInertia(fn (Assert $page) => $page->where('staff.total', 1)->where('staff.data.0.username', 'filter-user-22'));
    }

    public function test_quotation_group_matches_card_statuses(): void
    {
        DB::table('user')->insert(['id' => 'filter-pic', 'username' => 'filter-pic', 'email' => 'filter-pic@example.invalid', 'fullName' => 'Filter PIC', 'passwordHash' => 'unused', 'role' => 'STAFFADMIN', 'isActive' => 1, 'updatedAt' => now()]);
        foreach (['Draft', 'Dikirim', 'Disetujui', 'Invoice Terbuat', 'Ditolak'] as $i => $status) DB::table('quotation')->insert(['id' => 'filter-quotation-'.$i, 'quotationNumber' => 'TEST/FILTER/'.$i, 'picUserId' => 'filter-pic', 'subject' => 'Filter quotation', 'quotationDate' => '2026-01-01', 'status' => $status]);
        foreach (['pending', 'approved'] as $group) $this->withSession($this->adminSession())->get('/dashboard/quotation?search=Filter%20quotation&group='.$group)->assertOk()->assertInertia(fn (Assert $page) => $page->where('quotations.total', 2));
    }

    public function test_active_job_filter_includes_processing_and_excludes_finished_jobs(): void
    {
        DB::table('client')->insert(['id' => 'active-filter-client', 'name' => 'Active Filter', 'type' => 'individual', 'updatedAt' => now()]);
        DB::table('badan_hukum')->insert(['id' => 'active-filter-job', 'trackingCode' => 'FILTER/ACTIVE/001', 'clientId' => 'active-filter-client', 'title' => 'Active Filter', 'type' => 'PT', 'updatedAt' => now()]);
        foreach (['PENDING', 'PROSES', 'REVISI', 'REVISI_PROSES', 'VERIFIKASI', 'SELESAI', 'CANCELLED'] as $status) {
            DB::table('badan_hukum')->where('id', 'active-filter-job')->update(['status' => $status]);
            $expected = in_array($status, ['PENDING', 'PROSES', 'REVISI', 'REVISI_PROSES', 'VERIFIKASI'], true) ? 1 : 0;
            $this->withSession($this->adminSession())->get('/dashboard/jobs?search=FILTER%2FACTIVE%2F001&status=AKTIF')
                ->assertOk()->assertInertia(fn (Assert $page) => $page->where('jobs.total', $expected));
        }
    }
    public function test_job_signature_cards_filter_and_count_signed_deeds(): void
    {
        DB::table('client')->insert(['id' => 'deed-filter-client', 'name' => 'Signature Filter', 'type' => 'individual', 'updatedAt' => now()]);
        foreach (['signed', 'unsigned'] as $kind) {
            DB::table('badan_hukum')->insert(['id' => 'deed-'.$kind, 'trackingCode' => 'DEED/FILTER/'.$kind, 'clientId' => 'deed-filter-client', 'title' => 'Signature Filter', 'type' => 'PT', 'updatedAt' => now()]);
        }
        DB::table('signed_deeds')->insert(['job_type' => 'badan_hukum', 'job_id' => 'deed-signed', 'signed_date' => '2026-11-24', 'created_at' => now(), 'updated_at' => now()]);
        foreach (['SIGNED' => 'deed-signed', 'UNSIGNED' => 'deed-unsigned'] as $status => $expected) {
            $this->withSession($this->adminSession())->get('/dashboard/jobs?search=Signature%20Filter&status='.$status)
                ->assertOk()->assertInertia(fn (Assert $page) => $page->where('jobs.total', 1)->where('jobs.data.0.id', $expected)->where('jobs.data.0.deedSignedDate', $status === 'SIGNED' ? '2026-11-24' : null));
        }
    }
    public function test_task_payment_filter_does_not_change_summary_totals(): void
    {
        DB::table('user')->insert(['id' => 'fee-filter-user', 'username' => 'fee-filter-user', 'email' => 'fee-filter@example.invalid', 'fullName' => 'Fee Filter User', 'passwordHash' => 'unused', 'role' => 'STAFFADMIN', 'isActive' => 1, 'updatedAt' => now()]);
        foreach (['paid' => [100000, 1], 'unpaid' => [250000, 0]] as $status => [$fee, $paid]) {
            DB::table('job_employee_task')->insert(['id' => 'fee-filter-'.$status, 'userId' => 'fee-filter-user', 'taskType' => 'PIC', 'fee' => $fee, 'isPaid' => $paid, 'createdAt' => now(), 'updatedAt' => now()]);
        }
        foreach (['', 'paid', 'unpaid'] as $status) {
            $this->withSession($this->adminSession())->get('/dashboard/tasks?userId=fee-filter-user&paymentStatus='.$status)
                ->assertOk()->assertInertia(fn (Assert $page) => $page->where('stats.totalTasks', 2)->where('stats.totalFee', 350000)->where('stats.paidFee', 100000)->where('stats.unpaidFee', 250000)->where('tasks.total', $status === '' ? 2 : 1));
        }
    }
    public function test_audit_log_is_restricted_and_returns_complete_details(): void
    {
        DB::table('activitylog')->insert(['id' => 'audit-filter-test', 'activity' => 'UPDATE_JOB_PROGRESS', 'details' => "Status: PENDING → PROSES\nKeterangan: Dokumen diperiksa", 'ipAddress' => '127.0.0.1', 'device' => 'Test browser', 'createdAt' => now()->addMinute()]);
        $this->withSession($this->adminSession())->get('/dashboard/audit')->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('rows.data.0.id', 'audit-filter-test')->where('rows.data.0.details', "Status: PENDING → PROSES\nKeterangan: Dokumen diperiksa"));
        $this->withSession(['auth_user' => ['id' => 'staff-test', 'role' => 'STAFFADMIN']])->get('/dashboard/audit')->assertForbidden();
    }
    public function test_notification_test_uses_requested_enabled_channel(): void
    {
        $gateway = \Mockery::mock(\App\Services\NotificationGateway::class);
        $gateway->shouldReceive('enabledChannels')->twice()->andReturn(['email' => true, 'whatsapp' => true]);
        $gateway->shouldReceive('sendEmail')->once()->with('test', ['clientEmail' => 'test@example.invalid']);
        $gateway->shouldReceive('sendWhatsapp')->once()->with('test', ['clientPhone' => '628123456789']);
        $this->app->instance(\App\Services\NotificationGateway::class, $gateway);
        foreach (['email' => 'test@example.invalid', 'whatsapp' => '628123456789'] as $channel => $recipient) {
            $this->withSession($this->adminSession())->postJson('/dashboard/settings/test-notification', compact('channel', 'recipient'))->assertOk();
        }
        $this->withSession(['auth_user' => ['id' => 'staff-test', 'role' => 'STAFFADMIN']])->postJson('/dashboard/settings/test-notification', ['channel' => 'email', 'recipient' => 'test@example.invalid'])->assertRedirect();
    }

    public function test_notification_test_rejects_disabled_channel(): void
    {
        $gateway = \Mockery::mock(\App\Services\NotificationGateway::class);
        $gateway->shouldReceive('enabledChannels')->once()->andReturn(['email' => false, 'whatsapp' => false]);
        $this->app->instance(\App\Services\NotificationGateway::class, $gateway);
        $this->withSession($this->adminSession())->postJson('/dashboard/settings/test-notification', ['channel' => 'email', 'recipient' => 'test@example.invalid'])->assertUnprocessable();
    }
    public function test_custom_notification_templates_replace_placeholders_and_preserve_defaults(): void
    {
        $settings = ['whatsapp' => ['enabled' => true, 'apiToken' => 'test-token', 'endpointUrl' => 'https://example.invalid/send'], 'notificationTemplates' => ['job' => ['whatsapp' => 'Halo {nama_client}, {nomor} berstatus {status}. {tautan}']]];
        DB::table('app_settings')->updateOrInsert(['settings_key' => 'GLOBAL_APP_SETTINGS'], ['id' => 'test-global-settings', 'settings_value' => json_encode($settings), 'created_at' => now(), 'updated_at' => now()]);
        \Illuminate\Support\Facades\Http::fake(['*' => \Illuminate\Support\Facades\Http::response(['status' => true])]);
        $gateway = app(\App\Services\NotificationGateway::class);
        $gateway->sendWhatsapp('job', ['clientPhone' => '628123456789', 'clientName' => 'Andi', 'number' => 'BHM/001', 'status' => 'PROSES', 'url' => 'https://example.invalid/job']);
        $gateway->sendWhatsapp('invoice', ['clientPhone' => '628123456789', 'clientName' => 'Andi', 'number' => 'INV/001', 'title' => 'Jasa', 'total' => 100000]);
        \Illuminate\Support\Facades\Http::assertSent(fn ($request) => $request['message'] === 'Halo Andi, BHM/001 berstatus PROSES. https://example.invalid/job');
        \Illuminate\Support\Facades\Http::assertSent(fn ($request) => str_contains($request['message'], 'INV/001') && str_contains($request['message'], 'Rp 100.000'));
        $this->withSession($this->adminSession())->get('/dashboard/settings')->assertOk()->assertInertia(fn (Assert $page) => $page->where('settings.notificationTemplates.job.whatsapp', $settings['notificationTemplates']['job']['whatsapp'])->has('settings.notificationTemplates.invoice.email'));
    }
    public function test_document_history_does_not_record_unchanged_date_formats(): void
    {
        $request = \Illuminate\Http\Request::create('/');
        $request->setLaravelSession(app('session')->driver());
        app(\App\Services\DocumentEditHistory::class)->record($request, 'invoice', 'history-date-test', (object) ['date' => '2026-07-24 00:00:00.000', 'dueDate' => '2026-08-06 00:00:00.000'], ['date' => '2026-07-24', 'dueDate' => '2026-08-07'], collect(), [], 'Perubahan jatuh tempo');
        $entry = app(\App\Services\DocumentEditHistory::class)->forDocument('invoice', 'history-date-test')->first();
        $this->assertSame('Perubahan jatuh tempo', $entry->reason);
        $this->assertCount(1, $entry->changes);
        $this->assertSame('dueDate', $entry->changes[0]['field']);
    }
    public function test_job_edits_require_reason_and_record_actor_and_changes(): void
    {
        DB::table('client')->insert(['id' => 'history-client', 'name' => 'History Client', 'type' => 'individual', 'updatedAt' => now()]);
        DB::table('badan_hukum')->insert(['id' => 'history-job', 'trackingCode' => 'HISTORY/001', 'clientId' => 'history-client', 'title' => 'Nama Lama', 'type' => 'PT', 'status' => 'PENDING', 'priority' => 'MEDIUM', 'updatedAt' => now()]);
        $payload = ['clientId' => 'history-client', 'title' => 'Nama Baru', 'type' => 'PT', 'status' => 'PENDING', 'priority' => 'MEDIUM', 'employeeTasks' => [], 'founders' => []];
        $this->withSession($this->adminSession())->put('/dashboard/jobs/badan_hukum/history-job', $payload)->assertSessionHasErrors('description');
        $this->withSession($this->adminSession())->put('/dashboard/jobs/badan_hukum/history-job', [...$payload, 'description' => 'Perbaikan nama'])->assertSessionHasNoErrors()->assertRedirect();
        $entry = DB::table('document_edit_history')->where('document_type', 'job_progress')->where('reason', 'Perbaikan nama')->first();
        $this->assertNotNull($entry);
        $this->assertSame('Admin Test', $entry->actor_name);
        $this->assertContains(['field' => 'Pekerjaan', 'before' => 'Nama Lama', 'after' => 'Nama Baru'], json_decode($entry->changes, true));
        $this->withSession($this->adminSession())->get('/dashboard/jobs/badan_hukum/history-job')->assertOk()->assertInertia(fn (Assert $page) => $page->where('progress.0.actorName', 'Admin Test')->where('progress.0.editReason', 'Perbaikan nama'));
    }
    public function test_document_history_hides_unchanged_items_for_existing_entries(): void
    {
        $item = fn ($name) => ['description' => $name, 'quantity' => 1, 'unit' => 'item', 'unitPrice' => 500000];
        DB::table('document_edit_history')->insert(['document_type' => 'invoice', 'document_id' => 'item-diff-test', 'actor_name' => 'Admin', 'reason' => 'Perbaikan item', 'changes' => json_encode([['field' => 'items', 'before' => [$item('Jasa lama'), $item('NIB'), $item('NIB')], 'after' => [$item('Jasa baru'), $item('NIB')]]]), 'created_at' => now()]);
        $entry = app(\App\Services\DocumentEditHistory::class)->forDocument('invoice', 'item-diff-test')->first();
        $this->assertSame(['Jasa lama', 'NIB'], array_column($entry->changes[0]['before'], 'description'));
        $this->assertSame(['Jasa baru'], array_column($entry->changes[0]['after'], 'description'));
    }
    public function test_client_created_from_invoice_is_linked_and_cannot_be_overwritten(): void
    {
        DB::table('user')->insert(['id' => 'invoice-client-pic', 'username' => 'invoice-client-pic', 'email' => 'invoice-client-pic@example.invalid', 'fullName' => 'PIC', 'passwordHash' => 'unused', 'role' => 'STAFFADMIN', 'isActive' => 1, 'updatedAt' => now()]);
        DB::table('quotation')->insert(['id' => 'invoice-client-quotation', 'quotationNumber' => 'CLIENT/MODAL/001', 'picUserId' => 'invoice-client-pic', 'subject' => 'Pengujian', 'clientName' => 'Client Baru', 'quotationDate' => '2026-01-01', 'status' => 'Dikirim']);
        DB::table('invoice')->insert(['id' => 'invoice-client-test', 'invoiceNumber' => 'INV/CLIENT/TEST', 'quotationId' => 'invoice-client-quotation', 'amount' => 100000, 'updatedAt' => now()]);
        $this->withSession($this->adminSession())->get('/dashboard/invoice/invoice-client-test')->assertOk()->assertInertia(fn (Assert $page) => $page->where('masterClient', null));
        $data = ['sourceInvoiceId' => 'invoice-client-test', 'type' => 'individual', 'name' => 'Client Baru', 'email' => 'client@example.invalid'];
        $this->withSession($this->adminSession())->post('/dashboard/clients', $data)->assertSessionHasNoErrors()->assertRedirect('/dashboard/invoice/invoice-client-test');
        $clientId = DB::table('quotation')->where('id', 'invoice-client-quotation')->value('clientId');
        $this->assertNotNull($clientId);
        $this->withSession($this->adminSession())->get('/dashboard/invoice/invoice-client-test')->assertOk()->assertInertia(fn (Assert $page) => $page->where('masterClient.id', $clientId));
        $this->withSession($this->adminSession())->post('/dashboard/clients', $data)->assertSessionHasErrors('sourceInvoiceId');
        $this->assertSame($clientId, DB::table('quotation')->where('id', 'invoice-client-quotation')->value('clientId'));
    }
    public function test_publishing_and_sending_quotation_are_separate_and_invoice_options_are_eligible(): void
    {
        DB::table('user')->insert(['id' => 'publish-filter-pic', 'username' => 'publish-filter-pic', 'email' => 'publish-filter-pic@example.invalid', 'fullName' => 'PIC', 'passwordHash' => 'unused', 'role' => 'STAFFADMIN', 'isActive' => 1, 'updatedAt' => now()]);
        foreach (['draft', 'ready', 'used'] as $name) {
            DB::table('quotation')->insert(['id' => 'publish-'.$name, 'quotationNumber' => 'PUB/'.strtoupper($name), 'picUserId' => 'publish-filter-pic', 'subject' => 'Pengujian '.$name, 'clientName' => 'Client Uji', 'quotationDate' => '2026-01-01', 'status' => $name === 'draft' ? 'Draft' : 'Diterbitkan']);
        }
        DB::table('invoice')->insert(['id' => 'publish-used-invoice', 'invoiceNumber' => 'INV/PUB/USED', 'quotationId' => 'publish-used', 'amount' => 100000, 'updatedAt' => now()]);
        $gateway = \Mockery::mock(\App\Services\NotificationGateway::class);
        $gateway->shouldReceive('notify')->once()->with('quotation', \Mockery::on(fn ($data) => $data['number'] === 'PUB/DRAFT'))->andReturn(['Email']);
        $this->app->instance(\App\Services\NotificationGateway::class, $gateway);
        $this->withSession($this->adminSession())->post('/dashboard/quotation/publish-draft/publish')->assertSessionHasNoErrors();
        $this->assertSame('Diterbitkan', DB::table('quotation')->where('id', 'publish-draft')->value('status'));
        $this->withSession($this->adminSession())->post('/dashboard/quotation/publish-draft/notify')->assertSessionHasNoErrors();
        $response = $this->withSession($this->adminSession())->get('/dashboard/invoice/new')->assertOk();
        $ids = collect($response->viewData('page')['props']['quotations'])->pluck('id')->all();
        $this->assertContains('publish-draft', $ids);
        $this->assertContains('publish-ready', $ids);
        $this->assertNotContains('publish-used', $ids);
    }
    public function test_client_can_be_registered_from_quotation_before_invoice_creation(): void
    {
        DB::table('user')->insert(['id' => 'preinvoice-pic', 'username' => 'preinvoice-pic', 'email' => 'preinvoice-pic@example.invalid', 'fullName' => 'PIC', 'passwordHash' => 'unused', 'role' => 'STAFFADMIN', 'isActive' => 1, 'updatedAt' => now()]);
        DB::table('quotation')->insert(['id' => 'preinvoice-quotation', 'quotationNumber' => 'CLIENT/PRE/001', 'picUserId' => 'preinvoice-pic', 'subject' => 'Pengujian', 'clientName' => 'Client Quotation', 'quotationDate' => '2026-01-01', 'status' => 'Diterbitkan']);
        $url = '/dashboard/invoice/new?quotation=preinvoice-quotation';
        $this->withSession($this->adminSession())->get($url)->assertOk()->assertInertia(fn (Assert $page) => $page->where('sourceQuotation.registeredClientId', null));
        $data = ['sourceQuotationId' => 'preinvoice-quotation', 'type' => 'corporate', 'name' => 'Client Quotation'];
        $this->withSession($this->adminSession())->post('/dashboard/clients', $data)->assertSessionHasNoErrors()->assertRedirect($url);
        $clientId = DB::table('quotation')->where('id', 'preinvoice-quotation')->value('clientId');
        $this->assertNotNull($clientId);
        $this->withSession($this->adminSession())->get($url)->assertOk()->assertInertia(fn (Assert $page) => $page->where('sourceQuotation.registeredClientId', $clientId));
        $this->withSession($this->adminSession())->post('/dashboard/clients', $data)->assertSessionHasErrors('sourceQuotationId');
    }
}
