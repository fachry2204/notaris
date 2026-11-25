<?php

namespace Tests\Feature;

use App\Mail\SystemNotificationMail;
use App\Services\NotificationGateway;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Tests\TestCase;

class MessageLogTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
        config(['app.url' => 'http://localhost']);
        url()->forceRootUrl('http://localhost');
        Http::preventStrayRequests();
        DB::table('app_settings')->updateOrInsert(['settings_key' => 'GLOBAL_APP_SETTINGS'], [
            'id' => 'message-log-test-settings', 'settings_value' => json_encode([
                'email' => ['enabled' => true, 'username' => 'sender@example.invalid', 'appPassword' => 'private-mail-token', 'fromAddress' => 'sender@example.invalid'],
                'whatsapp' => ['enabled' => true, 'apiToken' => 'private-wa-token', 'endpointUrl' => 'https://example.invalid/send', 'categories' => ['attendance' => true]],
            ]), 'updated_at' => now(),
        ]);
    }

    private function admin(): array
    {
        $account = DB::table('admin')->where('isActive', true)->first();
        return ['auth_user' => ['id' => $account->id, 'role' => 'ADMINISTRATOR', 'source' => 'admin']];
    }

    public function test_email_whatsapp_and_failures_record_rendered_content_without_secrets(): void
    {
        Http::fake(fn ($request) => $request['target'] === '6281398765432'
            ? Http::response(['status' => false, 'reason' => 'private-wa-token'], 500)
            : Http::response(['status' => true]));
        Mail::fake();
        $gateway = app(NotificationGateway::class);
        $data = ['clientName' => 'Client Pengujian', 'clientPhone' => '081234567890', 'clientEmail' => 'client@example.invalid', 'number' => 'INV/UJI', 'total' => 50000];
        $gateway->sendEmail('invoice', $data);
        $gateway->sendWhatsapp('invoice', $data);
        $this->assertDatabaseHas('message_logs', ['channel' => 'email', 'destination' => 'client@example.invalid', 'recipient_position' => 'CLIENT', 'status' => 'ACCEPTED']);
        $this->assertDatabaseHas('message_logs', ['channel' => 'whatsapp', 'phone' => '6281234567890', 'recipient_name' => 'Client Pengujian', 'status' => 'ACCEPTED']);
        $body = DB::table('message_logs')->where('channel', 'email')->where('destination', 'client@example.invalid')->value('body');
        $this->assertStringContainsString('Rp 50.000', $body);
        Mail::assertSent(SystemNotificationMail::class, fn ($mail) => $mail->body === $body);
        try {
            $gateway->sendWhatsapp('attendance', ['clientPhone' => '081398765432', 'employeeName' => 'Pegawai OB', 'recipientRole' => 'OB']);
            $this->fail('Gateway failure must be propagated.');
        } catch (\RuntimeException $exception) {
            $this->assertStringContainsString('Fonnte', $exception->getMessage());
        }
        $failed = DB::table('message_logs')->where('recipient_name', 'Pegawai OB')->first();
        $this->assertSame('FAILED', $failed->status);
        $this->assertSame('OB', $failed->recipient_position);
        $this->assertStringNotContainsString('private-wa-token', $failed->status_note);
        $this->assertStringNotContainsString('{nama_karyawan}', $failed->body);
    }

    public function test_disabled_channels_do_not_create_logs_and_failed_email_is_logged(): void
    {
        $gateway = app(NotificationGateway::class);
        DB::table('app_settings')->where('settings_key', 'GLOBAL_APP_SETTINGS')->update(['settings_value' => json_encode(['email' => ['enabled' => false], 'whatsapp' => ['enabled' => false]])]);
        $before = DB::table('message_logs')->count();
        $gateway->sendWhatsapp('invoice', ['clientPhone' => '081234567890']);
        $gateway->sendEmail('invoice', ['clientEmail' => 'client@example.invalid']);
        $this->assertSame($before, DB::table('message_logs')->count());
        DB::table('app_settings')->where('settings_key', 'GLOBAL_APP_SETTINGS')->update(['settings_value' => json_encode(['email' => ['enabled' => true]])]);
        try {
            $gateway->sendEmail('invoice', ['clientEmail' => 'client@example.invalid']);
            $this->fail('Incomplete SMTP must fail.');
        } catch (\RuntimeException $exception) {
            $this->assertStringContainsString('SMTP', $exception->getMessage());
        }
        $this->assertDatabaseHas('message_logs', ['channel' => 'email', 'destination' => 'client@example.invalid', 'status' => 'FAILED']);
    }

    public function test_history_is_admin_only_paginated_filterable_and_detail_is_separate(): void
    {
        $ids = [];
        for ($i = 0; $i < 17; $i++) {
            $ids[] = $id = (string) Str::uuid();
            DB::table('message_logs')->insert(['id' => $id, 'category' => 'attendance', 'channel' => 'whatsapp', 'recipient_name' => 'Riwayat Uji '.$i, 'recipient_position' => 'PIMPINAN', 'phone' => '6281234567890', 'destination' => '6281234567890', 'subject' => null, 'body' => 'Isi lengkap <script>teks biasa</script>', 'status' => 'ACCEPTED', 'status_note' => 'Diterima gateway', 'created_at' => now(), 'updated_at' => now()]);
        }
        $this->get('/dashboard/settings/messages')->assertRedirect();
        $this->withSession(['auth_user' => ['id' => 'staff-test', 'role' => 'STAFFADMIN', 'source' => 'user']])->get('/dashboard/settings/messages/'.$ids[0])->assertRedirect();
        $result = $this->withSession($this->admin())->getJson('/dashboard/settings/messages?q=Riwayat%20Uji&position=PIMPINAN&channel=whatsapp&status=ACCEPTED')->assertOk()->assertJsonPath('total', 17)->assertJsonCount(15, 'data');
        $this->assertArrayNotHasKey('body', $result->json('data.0'));
        $this->withSession($this->admin())->getJson('/dashboard/settings/messages?q=Riwayat%20Uji&page=2')->assertOk()->assertJsonCount(2, 'data');
        $this->withSession($this->admin())->getJson('/dashboard/settings/messages/'.$ids[0])->assertOk()->assertJsonPath('body', 'Isi lengkap <script>teks biasa</script>');
        $this->withSession($this->admin())->getJson('/dashboard/settings/messages?q=%25')->assertOk()->assertJsonPath('total', 0);
        $this->withSession($this->admin())->getJson('/dashboard/settings/messages?status=READ')->assertUnprocessable();
        $this->withSession($this->admin())->getJson('/dashboard/settings/messages/'.Str::uuid())->assertNotFound();
    }
}
