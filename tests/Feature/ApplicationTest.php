<?php

namespace Tests\Feature;

use App\Http\Controllers\InvoiceController;
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
use Tests\TestCase;

class ApplicationTest extends TestCase
{
    use DatabaseTransactions;

    public function test_required_routes_are_registered(): void
    {
        $routes = app('router')->getRoutes();
        $this->assertTrue($routes->hasNamedRoute('login'));
        $this->assertTrue($routes->hasNamedRoute('dashboard'));
        $this->assertTrue($routes->hasNamedRoute('clients.index'));
        $this->assertTrue($routes->hasNamedRoute('jobs.index'));
        $this->assertTrue($routes->hasNamedRoute('quotations.index'));
        $this->assertTrue($routes->hasNamedRoute('quotations.store'));
        $this->assertTrue($routes->hasNamedRoute('quotations.publish'));
        $this->assertTrue($routes->hasNamedRoute('quotations.cancel'));
        $this->assertTrue($routes->hasNamedRoute('invoices.notify'));
        $this->assertTrue($routes->hasNamedRoute('jobs.notify'));
    }

    public function test_every_main_page_can_be_opened_with_an_authenticated_session(): void
    {
        $this->withoutExceptionHandling();
        config(['app.url' => 'http://localhost']);
        url()->forceRootUrl('http://localhost');

        if (! Schema::hasTable('admin') && ! Schema::hasTable('user')) {
            $this->markTestSkipped('Legacy schema is not installed on the isolated SQLite test database.');
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

    public function test_job_can_store_multiple_attachments_with_descriptions(): void
    {
        config(['app.url' => 'http://localhost']);
        url()->forceRootUrl('http://localhost');

        if (! Schema::hasTable('attachment')) {
            $this->markTestSkipped('Legacy schema is not installed on the isolated SQLite test database.');
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
        ]);

        $response->assertRedirect(route('jobs.index'));
        $job = DB::table('badan_hukum')->where('title', 'QA Multi Lampiran')->orderByDesc('createdAt')->first();
        $this->assertNotNull($job);
        $this->assertMatchesRegularExpression('/^[A-Z]+\/\d{8}\/\d{4}$/', $job->trackingCode);
        $this->assertDatabaseHas('attachment', ['fileName' => $firstName, 'description' => 'KTP — KTP Direktur Utama']);
        $this->assertDatabaseHas('attachment', ['fileName' => $secondName, 'description' => 'NPWP — NPWP Perusahaan']);
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
            'clientEmail' => 'quotation@example.com',
            'clientAddress' => 'Jakarta Selatan',
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
        $this->assertMatchesRegularExpression('/^[A-Z]+\/\d{8}\/\d{4}$/', $quotation->quotationNumber);
        $this->assertNull($quotation->clientId);
        $this->assertSame('PT Client Quotation Manual', $quotation->clientName);
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

        $this->assertMatchesRegularExpression('/^PEN\/03022037\/\d{4}$/', $generated[0]);
        $this->assertMatchesRegularExpression('/^TAG\/03022037\/\d{4}$/', $generated[1]);
        $this->assertMatchesRegularExpression('/^BH\/03022037\/\d{4}$/', $generated[2]);
        $this->assertMatchesRegularExpression('/^NBH\/03022037\/\d{4}$/', $generated[3]);
        $this->assertMatchesRegularExpression('/^PAT\/03022037\/\d{4}$/', $generated[4]);
    }

    public function test_quotation_publish_sends_email_and_whatsapp_once(): void
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
            'status' => 'Dikirim',
        ]);
        $publication = DB::table('quotation_publications')
            ->where('quotationId', $quotation->id)
            ->first();
        $this->assertNotNull($publication?->emailSentAt);
        $this->assertNotNull($publication?->whatsappSentAt);
        $this->assertNotNull($publication?->publishedAt);
        Mail::assertSent(SystemNotificationMail::class, fn ($mail) => $mail->hasTo('client.publish@example.com')
            && str_contains($mail->body, (string) $quotation->quotationNumber)
            && str_contains($mail->body, 'Total penawaran'));
        Http::assertSent(fn ($request) => $request->url() === 'https://api.fonnte.com/send'
            && $request->hasHeader('Authorization', 'test-fonnte-token')
            && $request['target'] === '081234567890');

        $this->withSession($session)
            ->post("/dashboard/quotation/{$quotation->id}/publish", [
                'publishWithoutNotification' => false,
            ])
            ->assertSessionHasNoErrors();
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
            'status' => 'Dikirim',
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
            'url' => 'http://localhost/tracking',
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

    public function test_quotation_can_be_published_without_notifications_after_confirmation(): void
    {
        $createdQuotationTable = ! Schema::hasTable('quotation');
        $createdPublicationTable = ! Schema::hasTable('quotation_publications');
        if ($createdQuotationTable) {
            Schema::create('quotation', function ($table) {
                $table->string('id')->primary();
                $table->string('status');
                $table->dateTime('updatedAt')->nullable();
            });
        }
        if ($createdPublicationTable) {
            Schema::create('quotation_publications', function ($table) {
                $table->string('id')->primary();
                $table->string('quotationId')->unique();
                $table->dateTime('emailSentAt')->nullable();
                $table->dateTime('whatsappSentAt')->nullable();
                $table->dateTime('publishedAt')->nullable();
                $table->dateTime('processingAt')->nullable();
                $table->text('lastError')->nullable();
                $table->dateTime('createdAt');
                $table->dateTime('updatedAt');
            });
        }

        $quotationId = 'quo-no-channel-'.uniqid();
        DB::table('quotation')->insert([
            'id' => $quotationId,
            'status' => 'Draft',
            'updatedAt' => now(),
        ]);
        $gateway = Mockery::mock(NotificationGateway::class);
        $gateway->shouldReceive('enabledChannels')
            ->twice()
            ->andReturn(['email' => false, 'whatsapp' => false]);
        $publisher = new QuotationPublisher($gateway);
        $quotation = (object) [
            'id' => $quotationId,
            'clientName' => 'Client QA',
            'clientEmail' => null,
            'clientPhone' => null,
            'quotationNumber' => 'QUO/24072026/0099',
            'subject' => 'QA Tanpa Notifikasi',
            'grandTotal' => 1000000,
            'validUntil' => '2026-08-01',
            'picName' => 'Admin QA',
        ];

        try {
            $publisher->publish($quotation, false);
            $this->fail('Penerbitan tanpa notifikasi harus meminta konfirmasi.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('publish', $exception->errors());
        }

        $message = $publisher->publish($quotation, true);
        $this->assertStringContainsString('tanpa notifikasi', $message);
        $this->assertDatabaseHas('quotation', [
            'id' => $quotationId,
            'status' => 'Dikirim',
        ]);
        $publication = DB::table('quotation_publications')->where('quotationId', $quotationId)->first();
        $this->assertNotNull($publication?->publishedAt);
        $this->assertNull($publication?->emailSentAt);
        $this->assertNull($publication?->whatsappSentAt);

        if ($createdPublicationTable) {
            Schema::drop('quotation_publications');
        }
        if ($createdQuotationTable) {
            Schema::drop('quotation');
        }
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
            'status' => 'Dikirim',
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
