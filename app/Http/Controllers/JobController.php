<?php

namespace App\Http\Controllers;

use App\Services\DocumentNumberService;
use App\Services\NotificationGateway;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Throwable;

class JobController extends Controller
{
    private const TABLES = ['badan_hukum' => 'Badan Hukum/Usaha', 'non_badan_hukum' => 'Non Badan Hukum', 'ppat' => 'PPAT'];

    public function __construct(private readonly DocumentNumberService $numbers) {}

    public function index(Request $request)
    {
        $search = trim((string) $request->query('search'));
        $status = (string) $request->query('status');
        $pageTitle = 'Berkas Masuk';
        $pageDescription = 'Kelola seluruh pekerjaan dan pantau proses berkas notaris.';
        if ($request->routeIs('jobs.completed')) {
            $status = 'SELESAI';
            $pageTitle = 'Berkas Selesai';
            $pageDescription = 'Arsip seluruh pekerjaan yang telah selesai.';
        }
        if ($request->routeIs('jobs.processing')) {
            $status = 'PROSES';
            $pageTitle = 'Proses Berkas';
            $pageDescription = 'Pantau pekerjaan yang sedang dalam proses.';
        }
        $parts = collect(self::TABLES)->map(fn ($category, $table) => DB::table($table.' as j')->leftJoin('client as c', 'c.id', '=', 'j.clientId')->select(['j.id', 'j.trackingCode', 'j.title', 'j.status', 'j.priority', 'j.deadline', 'j.createdAt', 'c.name as clientName'])->selectRaw('? as category, ? as jobType', [$category, $table])->when($search, fn ($q) => $q->where(fn ($q) => $q->where('j.title', 'like', "%{$search}%")->orWhere('j.trackingCode', 'like', "%{$search}%")->orWhere('c.name', 'like', "%{$search}%")))->when($status, fn ($q) => $q->where('j.status', $status)));
        $query = $parts->shift();
        foreach ($parts as $part) {
            $query->unionAll($part);
        }
        $stats = ['all' => 0, 'PENDING' => 0, 'PROSES' => 0, 'SELESAI' => 0];
        foreach (array_keys(self::TABLES) as $table) {
            $stats['all'] += DB::table($table)->count();
            foreach (['PENDING', 'PROSES', 'SELESAI'] as $key) {
                $stats[$key] += DB::table($table)->where('status', $key)->count();
            }
        }

        return Inertia::render('Jobs/Index', ['jobs' => $query->orderByDesc('createdAt')->paginate(20)->withQueryString(), 'search' => $search, 'status' => $status, 'stats' => $stats, 'pageTitle' => $pageTitle, 'pageDescription' => $pageDescription, 'lockedStatus' => $request->routeIs('jobs.completed', 'jobs.processing')]);
    }

    public function create(Request $request)
    {
        $type = (string) $request->query('type');
        $selectedClientId = (string) $request->query('client');
        $sourceInvoiceId = (string) $request->query('invoice');
        if ($selectedClientId && ! DB::table('client')->where('id', $selectedClientId)->exists()) {
            $selectedClientId = '';
        }
        $selectedStaffId = $this->sourceStaffId($sourceInvoiceId);
        if (! isset(self::TABLES[$type])) {
            return Inertia::render('Jobs/CreateSelect', [
                'selectedClientId' => $selectedClientId,
                'sourceInvoiceId' => $sourceInvoiceId,
            ]);
        }

        return Inertia::render('Jobs/Form', [
            'job' => null,
            'flowType' => $type,
            'selectedClientId' => $selectedClientId,
            'selectedStaffId' => $selectedStaffId,
            'sourceInvoiceId' => $sourceInvoiceId,
            'clients' => DB::table('client')->select('id', 'name', 'phone')->orderBy('name')->get(),
            'staff' => DB::table('user')->select('id', 'fullName', 'role')->where('isActive', true)->orderBy('fullName')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);
        $table = $data['jobType'];
        $sourceInvoiceId = $data['sourceInvoiceId'] ?? null;
        unset($data['jobType'], $data['sourceInvoiceId']);
        $sourceInvoice = $sourceInvoiceId
            ? DB::table('invoice')->where('id', $sourceInvoiceId)->first()
            : null;
        if ($sourceInvoiceId && ! $sourceInvoice) {
            throw ValidationException::withMessages([
                'sourceInvoiceId' => 'Invoice sumber tidak ditemukan.',
            ]);
        }
        if ($sourceInvoice && ($sourceInvoice->badanHukumId || $sourceInvoice->nonBadanHukumId || $sourceInvoice->ppatId)) {
            throw ValidationException::withMessages([
                'sourceInvoiceId' => 'Invoice ini sudah terhubung dengan berkas lain.',
            ]);
        }
        if ($sourceInvoice?->quotationId) {
            $invoiceClientId = DB::table('quotation')
                ->where('id', $sourceInvoice->quotationId)
                ->value('clientId');
            if ($invoiceClientId && $invoiceClientId !== $data['clientId']) {
                throw ValidationException::withMessages([
                    'clientId' => 'Client berkas harus sama dengan Client pada Invoice.',
                ]);
            }
        }
        $founders = $data['founders'] ?? [];
        $employeeTasks = $data['employeeTasks'] ?? [];
        $sourcePicStaffId = $this->sourceStaffId((string) $sourceInvoiceId);
        if ($sourcePicStaffId && ! $this->taskPicStaffId($employeeTasks)) {
            array_unshift($employeeTasks, [
                'userId' => $sourcePicStaffId,
                'taskType' => 'PIC',
                'customTask' => null,
            ]);
        }
        $data['staffId'] = $this->taskPicStaffId($employeeTasks);
        $attachments = $request->file('attachments', []);
        $attachmentDescriptions = $data['attachmentDescriptions'] ?? [];
        $attachmentUserId = $attachments ? $this->attachmentUserId($request, $data['staffId'] ?? null) : null;
        unset($data['founders'],$data['employeeTasks'],$data['attachments'],$data['attachmentDescriptions']);
        DB::transaction(function () use ($data, $table, $founders, $employeeTasks, $attachments, $attachmentDescriptions, $attachmentUserId, $request, $sourceInvoice) {
            $trackingCode = $this->numbers->next($table, $data['tanggalMasuk'] ?? now());
            $id = 'job-'.Str::lower(Str::random(12));
            $createdAt = ! empty($data['tanggalMasuk']) ? $data['tanggalMasuk'].' '.now()->format('H:i:s') : now();
            $invoiceStatus = match ($sourceInvoice?->status) {
                'Lunas' => 'LUNAS',
                'DP Bayar' => 'DP',
                default => 'PENDING',
            };
            unset($data['tanggalMasuk']);
            DB::table($table)->insert([...$data, 'id' => $id, 'trackingCode' => $trackingCode, 'invoiceStatus' => $invoiceStatus, 'sourceInvoiceId' => $sourceInvoice?->id, 'createdAt' => $createdAt, 'updatedAt' => now()]);
            if ($sourceInvoice) {
                DB::table('invoice')->where('id', $sourceInvoice->id)->update([
                    $this->foreignKey($table) => $id,
                    'updatedAt' => now(),
                ]);
            }
            foreach ($founders as $f) {
                if (! empty($f['name'])) {
                    DB::table('founder')->insert(['id' => 'FND-'.Str::random(12), 'name' => $f['name'], 'position' => $f['position'] ?? null, 'phone' => $f['phone'] ?? null, 'email' => $f['email'] ?? null, $this->foreignKey($table) => $id, 'createdAt' => now()]);
                }
            }
            $this->insertEmployeeTasks($employeeTasks, $this->foreignKey($table), $id, $this->canManageFee($request));
            foreach ($attachments as $index => $file) {
                $path = $file->store('uploads/attachments', 'public_root');
                DB::table('attachment')->insert(['id' => 'ATT-'.Str::random(12), 'userId' => $attachmentUserId, 'fileName' => $file->getClientOriginalName(), 'filePath' => '/'.$path, 'fileType' => $file->getMimeType() ?: 'application/octet-stream', 'description' => $attachmentDescriptions[$index] ?? null, $this->foreignKey($table) => $id, 'createdAt' => now()]);
            }
            DB::table('jobprogress')->insert([
                'id' => 'PROG-'.Str::random(12),
                'userId' => $attachmentUserId,
                'statusBefore' => $data['status'] ?? 'PENDING',
                'statusAfter' => $data['status'] ?? 'PENDING',
                'description' => 'Berkas baru didaftarkan'.(! empty($data['pengurusanUntuk']) ? " ({$data['pengurusanUntuk']})" : ''),
                $this->foreignKey($table) => $id,
                'createdAt' => now(),
            ]);
            $this->log($request, 'CREATE_JOB', "Membuat berkas {$id}");
        });

        return redirect()->route('jobs.index')->with('success', 'Berkas berhasil dibuat.');
    }

    public function show(string $type, string $id)
    {
        abort_unless(isset(self::TABLES[$type]), 404);
        $fk = $this->foreignKey($type);
        $job = DB::table($type.' as j')->leftJoin('client as c', 'c.id', '=', 'j.clientId')->leftJoin('user as u', 'u.id', '=', 'j.staffId')->select('j.*', 'c.name as clientName', 'c.phone as clientPhone', 'c.email as clientEmail', 'c.address as clientAddress', 'c.village as clientVillage', 'c.district as clientDistrict', 'c.city as clientCity', 'c.province as clientProvince', 'u.fullName as staffName')->where('j.id', $id)->first();
        abort_unless((bool) $job, 404);

        $invoices = DB::table('invoice')
            ->where($fk, $id)
            ->when($job->sourceInvoiceId ?? null, fn ($query, $sourceInvoiceId) => $query->orWhere('id', $sourceInvoiceId))
            ->orderByDesc('date')
            ->orderByDesc('createdAt')
            ->get();
        $payments = $invoices->isEmpty()
            ? collect()
            : DB::table('financerecord')
                ->whereIn('invoiceId', $invoices->pluck('id'))
                ->where('type', 'INCOME')
                ->orderByDesc('date')
                ->orderByDesc('createdAt')
                ->get()
                ->groupBy('invoiceId');
        $invoiceHistory = $invoices->map(function (object $invoice) use ($payments) {
            $invoicePayments = $payments->get($invoice->id, collect())->values();
            $paidAmount = (float) $invoicePayments->sum('amount');
            $invoice->paidAmount = $paidAmount;
            $invoice->remainingAmount = max(0, (float) $invoice->amount - $paidAmount);
            $invoice->payments = $invoicePayments;

            return $invoice;
        });

        $employeeTasks = DB::table('job_employee_task as task')
            ->leftJoin('user as employee', 'employee.id', '=', 'task.userId')
            ->where("task.{$fk}", $id)
            ->select(
                'task.id',
                'task.userId',
                'task.taskType',
                'task.customTask',
                'task.fee',
                'employee.fullName as employeeName',
                'employee.role as employeeRole',
            )
            ->orderBy('task.createdAt')
            ->get();

        $progress = DB::table('jobprogress')->where($fk, $id)->orderByDesc('createdAt')->get();
        if ($progress->isEmpty()) {
            DB::table('jobprogress')->insert([
                'id' => 'PROG-'.Str::random(12),
                'userId' => $job->staffId,
                'statusBefore' => $job->status ?? 'PENDING',
                'statusAfter' => $job->status ?? 'PENDING',
                'description' => 'Berkas didaftarkan'.(! empty($job->pengurusanUntuk) ? " ({$job->pengurusanUntuk})" : ''),
                $fk => $id,
                'createdAt' => $job->createdAt ?? now(),
            ]);
            $progress = DB::table('jobprogress')->where($fk, $id)->orderByDesc('createdAt')->get();
        }

        return Inertia::render('Jobs/Show', [
            'job' => $job,
            'jobType' => $type,
            'founders' => DB::table('founder')->where($fk, $id)->get(),
            'attachments' => DB::table('attachment')->where($fk, $id)->get(),
            'employeeTasks' => $employeeTasks,
            'progress' => DB::table('jobprogress')->where($fk, $id)->orderByDesc('createdAt')->get(),
            'invoiceHistory' => $invoiceHistory,
        ]);
    }

    public function updateProgress(Request $request, string $type, string $id)
    {
        abort_unless(isset(self::TABLES[$type]), 404);
        $data = $request->validate([
            'status' => 'required|in:PENDING,PROSES,REVISI,REVISI_PROSES,VERIFIKASI,SELESAI,CANCELLED',
            'description' => 'nullable|string|max:1000',
        ]);
        $job = DB::table($type)->where('id', $id)->first();
        abort_unless((bool) $job, 404);
        $foreignKey = $this->foreignKey($type);

        $actorUserId = $this->attachmentUserId($request, $job->staffId ?? null);
        DB::transaction(function () use ($request, $type, $id, $data, $job, $foreignKey, $actorUserId) {
            DB::table($type)->where('id', $id)->update([
                'status' => $data['status'],
                'updatedAt' => now(),
            ]);
            DB::table('jobprogress')->insert([
                'id' => 'PROG-'.Str::random(12),
                'userId' => $actorUserId,
                'statusBefore' => $job->status,
                'statusAfter' => $data['status'],
                'description' => $data['description'] ?: 'Progress berkas diperbarui',
                $foreignKey => $id,
                'createdAt' => now(),
            ]);
            $this->log($request, 'UPDATE_JOB_PROGRESS', "Memperbarui progress berkas {$id}");
        });

        return back()->with('success', 'Progress berkas berhasil diperbarui.');
    }

    public function notify(Request $request, string $type, string $id, NotificationGateway $notifications)
    {
        abort_unless(isset(self::TABLES[$type]), 404);
        $job = DB::table($type.' as j')
            ->leftJoin('client as c', 'c.id', '=', 'j.clientId')
            ->leftJoin('user as u', 'u.id', '=', 'j.staffId')
            ->select('j.id', 'j.trackingCode', 'j.title', 'j.status', 'c.name as clientName', 'c.phone as clientPhone', 'c.email as clientEmail', 'u.fullName as picName')
            ->where('j.id', $id)
            ->first();
        abort_unless((bool) $job, 404);

        try {
            $sent = $notifications->notify('job', [
                'clientName' => $job->clientName,
                'clientEmail' => $job->clientEmail,
                'clientPhone' => $job->clientPhone,
                'number' => $job->trackingCode,
                'title' => $job->title,
                'status' => $job->status,
                'url' => url('/tracking'),
                'picName' => $job->picName,
            ]);
            DB::table('jobprogress')->insert([
                'id' => 'PROG-'.Str::random(12),
                'userId' => $this->attachmentUserId($request, null),
                'statusBefore' => $job->status,
                'statusAfter' => $job->status,
                'description' => 'Notifikasi informasi berkas berhasil dikirim via '.implode(' dan ', $sent),
                $this->foreignKey($type) => $id,
                'createdAt' => now(),
            ]);
        } catch (ValidationException $exception) {
            return back()->withErrors($exception->errors());
        } catch (Throwable $exception) {
            return back()->withErrors(['notification' => $exception->getMessage()]);
        }

        return back()->with('success', 'Informasi berkas berhasil dikirim melalui '.implode(' dan ', $sent).'.');
    }

    public function legacyShow(string $id)
    {
        [$type] = $this->locate($id);

        return redirect()->route('jobs.show', [$type, $id]);
    }

    public function legacyEdit(string $id)
    {
        [$type] = $this->locate($id);

        return redirect()->route('jobs.edit', [$type, $id]);
    }

    public function legacyInvoice(string $id)
    {
        [$type] = $this->locate($id);

        return redirect()->route('invoices.create', ['job' => $id, 'type' => $type]);
    }

    public function edit(string $type, string $id)
    {
        abort_unless(isset(self::TABLES[$type]), 404);
        $job = DB::table($type)->where('id', $id)->first();
        abort_unless((bool) $job, 404);

        $foreignKey = $this->foreignKey($type);

        return Inertia::render('Jobs/Form', ['job' => [...(array) $job, 'jobType' => $type], 'founders' => DB::table('founder')->where($foreignKey, $id)->get(), 'attachments' => DB::table('attachment')->where($foreignKey, $id)->orderBy('createdAt')->get(), 'employeeTasks' => DB::table('job_employee_task')->where($foreignKey, $id)->orderBy('createdAt')->get(), 'clients' => DB::table('client')->select('id', 'name', 'phone')->orderBy('name')->get(), 'staff' => DB::table('user')->select('id', 'fullName', 'role')->where('isActive', true)->orderBy('fullName')->get()]);
    }

    public function update(Request $request, string $type, string $id)
    {
        abort_unless(isset(self::TABLES[$type]), 404);
        $data = $this->validated($request, false);
        $founders = $data['founders'] ?? [];
        $employeeTasks = $data['employeeTasks'] ?? [];
        $data['staffId'] = $this->taskPicStaffId($employeeTasks);
        $attachments = $request->file('attachments', []);
        $attachmentDescriptions = $data['attachmentDescriptions'] ?? [];
        unset($data['jobType'],$data['founders'],$data['employeeTasks'],$data['attachments'],$data['attachmentDescriptions'],$data['tanggalMasuk']);
        $old = DB::table($type)->where('id', $id)->first();
        abort_unless((bool) $old, 404);
        $actorUserId = $this->attachmentUserId($request, $data['staffId'] ?? $old->staffId);
        $fk = $this->foreignKey($type);
        DB::transaction(function () use ($data, $founders, $employeeTasks, $attachments, $attachmentDescriptions, $actorUserId, $request, $type, $id, $old, $fk) {
            DB::table($type)->where('id', $id)->update([...$data, 'updatedAt' => now()]);
            DB::table('founder')->where($fk, $id)->delete();
            DB::table('job_employee_task')->where($fk, $id)->delete();
            foreach ($founders as $f) {
                if (! empty($f['name'])) {
                    DB::table('founder')->insert(['id' => 'FND-'.Str::random(12), 'name' => $f['name'], 'position' => $f['position'] ?? null, 'phone' => $f['phone'] ?? null, 'email' => $f['email'] ?? null, $fk => $id, 'createdAt' => now()]);
                }
            }
            $this->insertEmployeeTasks($employeeTasks, $fk, $id, $this->canManageFee($request));
            foreach ($attachments as $index => $file) {
                $path = $file->store('uploads/attachments', 'public_root');
                DB::table('attachment')->insert(['id' => 'ATT-'.Str::random(12), 'userId' => $actorUserId, 'fileName' => $file->getClientOriginalName(), 'filePath' => '/'.$path, 'fileType' => $file->getMimeType() ?: 'application/octet-stream', 'description' => $attachmentDescriptions[$index] ?? null, $fk => $id, 'createdAt' => now()]);
            }
            $changes = [];
            if (isset($data['pengurusanUntuk']) && ($old->pengurusanUntuk ?? '') !== $data['pengurusanUntuk']) {
                $oldVal = $old->pengurusanUntuk ?: '-';
                $newVal = $data['pengurusanUntuk'] ?: '-';
                $changes[] = "Pengurusan diubah dari '{$oldVal}' menjadi '{$newVal}'";
            }
            if (isset($data['title']) && ($old->title ?? '') !== $data['title']) {
                $changes[] = "Judul berkas diubah ke '{$data['title']}'";
            }
            if (isset($data['status']) && $old->status !== $data['status']) {
                $changes[] = "Status diubah dari {$old->status} ke {$data['status']}";
            }

            $userDesc = $request->input('description');
            $finalDesc = $userDesc ?: ($changes ? implode('; ', $changes) : 'Informasi berkas diperbarui');

            DB::table('jobprogress')->insert([
                'id' => 'PROG-'.Str::random(12),
                'userId' => $actorUserId,
                'statusBefore' => $old->status,
                'statusAfter' => $data['status'] ?? $old->status,
                'description' => $finalDesc,
                $fk => $id,
                'createdAt' => now(),
            ]);
        });
        $this->log($request, 'UPDATE_JOB', "Memperbarui berkas {$id}");

        return redirect()->route('jobs.show', [$type, $id])->with('success', 'Berkas diperbarui.');
    }

    public function destroy(Request $request, string $type, string $id)
    {
        abort_unless(isset(self::TABLES[$type]), 404);
        $fk = $this->foreignKey($type);
        DB::transaction(function () use ($type, $id, $fk, $request) {
            foreach (['founder', 'attachment', 'jobprogress', 'job_employee_task'] as $table) {
                DB::table($table)->where($fk, $id)->delete();
            }DB::table($type)->where('id', $id)->delete();
            $this->log($request, 'DELETE_JOB', "Menghapus berkas {$id}");
        });

        return redirect()->route('jobs.index')->with('success', 'Berkas dihapus.');
    }

    private function validated(Request $r, bool $creating = true): array
    {
        return $r->validate(['jobType' => [$creating ? 'required' : 'nullable', 'in:'.implode(',', array_keys(self::TABLES))], 'sourceInvoiceId' => 'nullable|string|exists:invoice,id', 'clientId' => 'required|string', 'staffId' => 'nullable|string', 'title' => 'required|string|max:255', 'type' => 'required|string|max:255', 'pengurusanUntuk' => 'nullable|string|max:255', 'companyName' => 'nullable|string|max:255', 'status' => 'required|in:PENDING,PROSES,REVISI,REVISI_PROSES,VERIFIKASI,SELESAI,CANCELLED', 'priority' => 'required|in:LOW,MEDIUM,HIGH,URGENT', 'deadline' => 'nullable|date', 'tanggalMasuk' => 'nullable|date', 'saksi' => 'nullable|string|max:255', 'notes' => 'nullable|string', 'founders' => 'nullable|array', 'founders.*.name' => 'nullable|string', 'founders.*.position' => 'nullable|string|max:255', 'founders.*.phone' => 'nullable|string', 'founders.*.email' => 'nullable|email', 'employeeTasks' => 'nullable|array|max:25', 'employeeTasks.*.userId' => 'required|string|exists:user,id', 'employeeTasks.*.taskType' => 'required|in:PIC,Saksi,NPWP,NIB,PBB,Lainnya', 'employeeTasks.*.customTask' => 'nullable|string|max:255|required_if:employeeTasks.*.taskType,Lainnya', 'employeeTasks.*.fee' => 'nullable|numeric|min:0', 'attachments' => 'nullable|array', 'attachments.*' => 'nullable|file|max:10240', 'attachmentDescriptions' => 'nullable|array', 'attachmentDescriptions.*' => 'nullable|string|max:500']);
    }

    private function taskPicStaffId(array $employeeTasks): ?string
    {
        foreach ($employeeTasks as $employeeTask) {
            if (($employeeTask['taskType'] ?? null) === 'PIC') {
                return $employeeTask['userId'] ?? null;
            }
        }

        return null;
    }

    private function canManageFee(Request $request): bool
    {
        $sessionId = $request->session()->get('auth_user.id');
        if (! $sessionId) {
            return false;
        }

        $role = DB::table('user')->where('id', $sessionId)->value('role');

        return in_array($role, ['ADMINISTRATOR', 'PIMPINAN'], true);
    }

    private function insertEmployeeTasks(array $employeeTasks, string $foreignKey, string $jobId, bool $canManageFee = true): void
    {
        foreach ($employeeTasks as $employeeTask) {
            $fee = $canManageFee && isset($employeeTask['fee']) ? max(0, (float) $employeeTask['fee']) : 0;
            DB::table('job_employee_task')->insert([
                'id' => 'JET-'.Str::random(12),
                'userId' => $employeeTask['userId'],
                'taskType' => $employeeTask['taskType'],
                'customTask' => $employeeTask['taskType'] === 'Lainnya'
                    ? $employeeTask['customTask']
                    : null,
                'fee' => $fee,
                $foreignKey => $jobId,
                'createdAt' => now(),
                'updatedAt' => now(),
            ]);
        }
    }

    private function foreignKey(string $table): string
    {
        return $table === 'badan_hukum' ? 'badanHukumId' : ($table === 'non_badan_hukum' ? 'nonBadanHukumId' : 'ppatId');
    }

    private function attachmentUserId(Request $request, ?string $staffId): string
    {
        $sessionId = $request->session()->get('auth_user.id');
        if ($sessionId && DB::table('user')->where('id', $sessionId)->exists()) {
            return $sessionId;
        }if ($staffId && DB::table('user')->where('id', $staffId)->exists()) {
            return $staffId;
        }$fallback = DB::table('user')->where('isActive', true)->value('id');
        abort_unless($fallback, 422, 'Tidak ada akun pegawai aktif untuk menyimpan lampiran.');

        return $fallback;
    }

    private function sourceStaffId(string $invoiceId): string
    {
        if ($invoiceId === '') {
            return '';
        }

        $invoice = DB::table('invoice')->where('id', $invoiceId)->first();
        if (! $invoice) {
            return '';
        }

        $staffId = '';
        if ($invoice->quotationId ?? null) {
            $staffId = (string) DB::table('quotation')
                ->where('id', $invoice->quotationId)
                ->value('picUserId');
        } else {
            foreach ([
                'badanHukumId' => 'badan_hukum',
                'nonBadanHukumId' => 'non_badan_hukum',
                'ppatId' => 'ppat',
            ] as $foreignKey => $table) {
                if ($invoice->{$foreignKey} ?? null) {
                    $staffId = (string) DB::table($table)
                        ->where('id', $invoice->{$foreignKey})
                        ->value('staffId');
                    break;
                }
            }
        }

        return $staffId && DB::table('user')
            ->where('id', $staffId)
            ->where('isActive', true)
            ->exists()
            ? $staffId
            : '';
    }

    private function locate(string $id): array
    {
        foreach (array_keys(self::TABLES) as $table) {
            if (DB::table($table)->where('id', $id)->exists()) {
                return [$table, $id];
            }
        }abort(404);
    }

    public function deleteAttachment(Request $request, string $id)
    {
        $attachment = DB::table('attachment')->where('id', $id)->first();
        if ($attachment) {
            $filePath = ltrim((string) $attachment->filePath, '/');
            if ($filePath && Storage::disk('public_root')->exists($filePath)) {
                Storage::disk('public_root')->delete($filePath);
            }
            DB::table('attachment')->where('id', $id)->delete();
            $this->log($request, 'DELETE_ATTACHMENT', "Menghapus lampiran {$attachment->fileName}");
        }

        return back()->with('success', 'Lampiran berhasil dihapus.');
    }

    private function log(Request $r, string $activity, string $details): void
    {
        $sessionId = $r->session()->get('auth_user.id');
        $userId = $sessionId && DB::table('user')->where('id', $sessionId)->exists() ? $sessionId : null;
        DB::table('activitylog')->insert(['id' => 'LOG-'.Str::random(12), 'userId' => $userId, 'activity' => $activity, 'details' => $details, 'ipAddress' => $r->ip(), 'device' => substr((string) $r->userAgent(), 0, 255), 'createdAt' => now()]);
    }
}
