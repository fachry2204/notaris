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
        $canViewFee = $this->canManageFee($request);
        $parts = collect(self::TABLES)->map(function ($category, $table) use ($search, $status, $canViewFee) {
            $foreignKey = $this->foreignKey($table);

            return DB::table($table.' as j')
                ->leftJoin('client as c', 'c.id', '=', 'j.clientId')
                ->select([
                    'j.id',
                    'j.trackingCode',
                    'j.title',
                    'j.status',
                    'j.priority',
                    'j.deadline',
                    'j.createdAt',
                    'c.name as clientName',
                ])
                ->when($canViewFee, fn ($builder) => $builder->selectSub(
                    fn ($query) => $query
                        ->from('job_employee_task as fee_tasks')
                        ->selectRaw('COUNT(*)')
                        ->whereColumn("fee_tasks.{$foreignKey}", 'j.id'),
                    'feeTaskCount',
                )
                ->selectSub(
                    fn ($query) => $query
                        ->from('job_employee_task as filled_fee_tasks')
                        ->selectRaw('COUNT(*)')
                        ->whereColumn("filled_fee_tasks.{$foreignKey}", 'j.id')
                        ->where('filled_fee_tasks.fee', '>', 0),
                    'filledFeeTaskCount',
                ))
                ->selectRaw('? as category, ? as jobType', [$category, $table])
                ->when($search, fn ($query) => $query->where(fn ($query) => $query
                    ->where('j.title', 'like', "%{$search}%")
                    ->orWhere('j.trackingCode', 'like', "%{$search}%")
                    ->orWhere('c.name', 'like', "%{$search}%")))
                ->when($status === 'TERLAMBAT', fn ($query) => $query->whereNotNull('j.deadline')->whereDate('j.deadline', '<', today())->whereNotIn('j.status', ['SELESAI', 'CANCELLED']))
                ->when($status && $status !== 'TERLAMBAT', fn ($query) => $query->where('j.status', $status));
        });
        $query = $parts->shift();
        foreach ($parts as $part) {
            $query->unionAll($part);
        }
        $stats = ['all' => 0, 'PENDING' => 0, 'PROSES' => 0, 'SELESAI' => 0, 'TERLAMBAT' => 0];
        foreach (array_keys(self::TABLES) as $table) {
            $stats['all'] += DB::table($table)->count();
            $stats['TERLAMBAT'] += DB::table($table)->whereNotNull('deadline')->whereDate('deadline', '<', today())->whereNotIn('status', ['SELESAI', 'CANCELLED'])->count();
            foreach (['PENDING', 'PROSES', 'SELESAI'] as $key) {
                $stats[$key] += DB::table($table)->where('status', $key)->count();
            }
        }

        return Inertia::render('Jobs/Index', ['canViewFee' => $canViewFee, 'jobs' => $query->orderByDesc('createdAt')->paginate(20)->withQueryString(), 'search' => $search, 'status' => $status, 'stats' => $stats, 'pageTitle' => $pageTitle, 'pageDescription' => $pageDescription, 'lockedStatus' => $request->routeIs('jobs.completed', 'jobs.processing')]);
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
            'availableInvoices' => $this->availableInvoices(),
            'linkedInvoice' => null,
            'clients' => DB::table('client')->select('id', 'name', 'phone')->orderBy('name')->get(),
            'staff' => DB::table('user')->select('id', 'fullName', 'role')->where('isActive', true)->orderBy('fullName')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);
        $manualNumber = $this->validateTrackingCode($request);
        $table = $data['jobType'];
        $invoiceAction = $data['invoiceAction'] ?? (! empty($data['sourceInvoiceId']) ? 'existing' : 'none');
        $sourceInvoiceId = $invoiceAction === 'existing' ? ($data['sourceInvoiceId'] ?? null) : null;
        if ($invoiceAction === 'existing' && ! $sourceInvoiceId) {
            throw ValidationException::withMessages(['sourceInvoiceId' => 'Pilih invoice yang akan dihubungkan.']);
        }
        unset($data['jobType'], $data['sourceInvoiceId'], $data['invoiceAction']);
        $sourceInvoice = $sourceInvoiceId
            ? DB::table('invoice')->where('id', $sourceInvoiceId)->first()
            : null;
        if ($sourceInvoiceId && ! $sourceInvoice) {
            throw ValidationException::withMessages([
                'sourceInvoiceId' => 'Invoice sumber tidak ditemukan.',
            ]);
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
        $attachmentDeposits = $data['attachmentDeposits'] ?? [];
        $attachmentUserId = $this->attachmentUserId($request, $data['staffId'] ?? null);
        unset($data['founders'],$data['employeeTasks'],$data['attachments'],$data['attachmentDescriptions'],$data['attachmentDeposits'],$data['savedAttachmentDeposits']);
        $id = DB::transaction(function () use ($data, $table, $founders, $employeeTasks, $attachments, $attachmentDescriptions, $attachmentDeposits, $attachmentUserId, $request, $sourceInvoice, $manualNumber) {
            if ($sourceInvoice) {
                $sourceInvoice = $this->lockInvoice($sourceInvoice->id);
            }
            if ($manualNumber) {
                $trackingCode = $manualNumber;
            } else {
                do {
                    $trackingCode = $this->numbers->next($table, $data['tanggalMasuk'] ?? now());
                } while ($this->trackingCodeExists($trackingCode));
            }
            $id = 'job-'.Str::lower(Str::random(12));
            $createdAt = ! empty($data['tanggalMasuk']) ? $data['tanggalMasuk'].' '.now()->format('H:i:s') : now();
            $invoiceStatus = match ($sourceInvoice?->status) {
                'Lunas' => 'LUNAS',
                'DP Bayar' => 'DP',
                default => 'PENDING',
            };
            unset($data['tanggalMasuk']);
            $creatorName = $request->session()->get('auth_user.fullName') ?: $request->session()->get('auth_user.username');
            DB::table($table)->insert([...$data, 'id' => $id, 'trackingCode' => $trackingCode, 'invoiceStatus' => $invoiceStatus, 'sourceInvoiceId' => $sourceInvoice?->id, 'createdByName' => $creatorName, 'createdAt' => $createdAt, 'updatedAt' => now()]);
            if ($sourceInvoice && ! $sourceInvoice->badanHukumId && ! $sourceInvoice->nonBadanHukumId && ! $sourceInvoice->ppatId) {
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
                DB::table('attachment')->insert(['id' => 'ATT-'.Str::random(12), 'userId' => $attachmentUserId, 'fileName' => $file->getClientOriginalName(), 'filePath' => '/'.$path, 'fileType' => $file->getMimeType() ?: 'application/octet-stream', 'description' => $attachmentDescriptions[$index] ?? null, 'isPhysicalDeposited' => (bool) ($attachmentDeposits[$index] ?? false), $this->foreignKey($table) => $id, 'createdAt' => now()]);
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
            return $id;
        });

        if ($invoiceAction === 'new') {
            return redirect()->route('invoices.create', ['job' => $id, 'type' => $table])->with('success', 'Berkas berhasil dibuat. Lengkapi invoice baru.');
        }
        return redirect()->route('jobs.index')->with('success', 'Berkas berhasil dibuat.');
    }

    public function show(Request $request, string $type, string $id)
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

        $canManageFee = $this->canManageFee($request);
        $employeeTasksQuery = DB::table('job_employee_task as task')
            ->leftJoin('user as employee', 'employee.id', '=', 'task.userId')
            ->where("task.{$fk}", $id)
            ->select(
                'task.id',
                'task.userId',
                'task.taskType',
                'task.customTask',
                'task.isPaid',
                'employee.fullName as employeeName',
                'employee.role as employeeRole',
            );

        if ($canManageFee) {
            $employeeTasksQuery->addSelect('task.fee');
        }

        $employeeTasks = $employeeTasksQuery
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

        $progressPhotos = DB::table('job_progress_photos')->whereIn('progress_id', $progress->pluck('id'))->orderBy('id')->get()->groupBy('progress_id');
        $progress->each(function ($item) use ($progressPhotos, $type, $id) {
            $item->photos = ($progressPhotos[$item->id] ?? collect())->map(fn ($photo) => ['id' => $photo->id, 'fileName' => $photo->file_name, 'filePath' => route('jobs.progress-photo', [$type, $id, $photo->id]), 'fileType' => 'image/jpeg'])->values();
        });
        return Inertia::render('Jobs/Show', [
            'uploadedReceipts' => DB::table('uploaded_job_receipts')->where('job_type', $type)->where('job_id', $id)->orderByDesc('created_at')->get()->map(function ($receipt) use ($type, $id) {
                return ['id' => $receipt->id, 'fileName' => $receipt->file_name, 'documentDate' => $receipt->document_date, 'receiver' => $receipt->receiver, 'submitter' => $receipt->submitter, 'uploadedBy' => $receipt->uploaded_by, 'url' => route('jobs.receipts.show', [$type, $id, $receipt->id])];
            }),
            'job' => $job,
            'jobType' => $type,
            'founders' => DB::table('founder')->where($fk, $id)->get(),
            'attachments' => DB::table('attachment')->where($fk, $id)->get(),
            'employeeTasks' => $employeeTasks,
            'progress' => $progress,
            'invoiceHistory' => $invoiceHistory,
            'availableInvoices' => $invoiceHistory->isEmpty() ? $this->availableInvoices() : collect(),
        ]);
    }

    public function attachInvoice(Request $request, string $type, string $id)
    {
        abort_unless(isset(self::TABLES[$type]), 404);
        $data = $request->validate(['invoiceId' => ['required', 'string', 'exists:invoice,id']]);
        $foreignKey = $this->foreignKey($type);

        DB::transaction(function () use ($type, $id, $foreignKey, $data) {
            $job = DB::table($type)->where('id', $id)->lockForUpdate()->first();
            abort_unless($job, 404);
            if (($job->sourceInvoiceId ?? null) || DB::table('invoice')->where($foreignKey, $id)->exists()) {
                throw ValidationException::withMessages(['invoiceId' => 'Berkas sudah memiliki invoice.']);
            }
            $invoice = $this->lockInvoice($data['invoiceId']);
            if (! $invoice->badanHukumId && ! $invoice->nonBadanHukumId && ! $invoice->ppatId) {
                DB::table('invoice')->where('id', $invoice->id)->update([$foreignKey => $id, 'updatedAt' => now()]);
            }
            DB::table($type)->where('id', $id)->update([
                'sourceInvoiceId' => $invoice->id,
                'invoiceStatus' => match ($invoice->status) { 'Lunas' => 'LUNAS', 'DP Bayar' => 'DP', default => 'PENDING' },
                'updatedAt' => now(),
            ]);
        });
        $this->log($request, 'ATTACH_INVOICE', "Menghubungkan invoice ke berkas {$id}");

        return back()->with('success', 'Invoice berhasil dihubungkan ke berkas.');
    }

    public function updateEmployeeFees(Request $request, string $type, string $id)
    {
        abort_unless(isset(self::TABLES[$type]), 404);
        abort_unless($this->canManageFee($request), 403, 'Hanya Admin atau Pimpinan yang dapat mengubah fee pegawai.');

        $data = $request->validate([
            'employeeTasks' => ['required', 'array', 'max:25'],
            'employeeTasks.*.id' => ['required', 'string'],
            'employeeTasks.*.fee' => ['required', 'numeric', 'min:0'],
        ]);
        $job = DB::table($type)->where('id', $id)->first();
        abort_unless((bool) $job, 404);
        $foreignKey = $this->foreignKey($type);
        $taskIds = collect($data['employeeTasks'])->pluck('id')->unique()->values();
        $tasks = DB::table('job_employee_task as task')
            ->leftJoin('user as employee', 'employee.id', '=', 'task.userId')
            ->where("task.{$foreignKey}", $id)
            ->whereIn('task.id', $taskIds)
            ->select('task.id', 'task.taskType', 'task.isPaid', 'employee.fullName as employeeName')
            ->get()
            ->keyBy('id');

        if ($tasks->count() !== $taskIds->count()) {
            throw ValidationException::withMessages([
                'employeeTasks' => 'Ada data tugas yang tidak terdaftar pada berkas ini.',
            ]);
        }

        DB::transaction(function () use ($data, $tasks, $job) {
            foreach ($data['employeeTasks'] as $employeeTask) {
                $task = $tasks->get($employeeTask['id']);
                $fee = max(0, (float) $employeeTask['fee']);

                DB::table('job_employee_task')->where('id', $task->id)->update([
                    'fee' => $fee,
                    'updatedAt' => now(),
                ]);

                if (! $task->isPaid) {
                    continue;
                }

                $expenseDescription = 'Pembayaran Fee Pegawai '.($task->employeeName ?? 'Pegawai')
                    .' (Tugas: '.$task->taskType.') - Berkas: '.($job->title ?? 'Berkas')
                    .' ['.($job->trackingCode ?? '-').']';
                $expenseQuery = DB::table('expense')
                    ->where('category', 'Fee Pegawai')
                    ->where('description', $expenseDescription);

                if ($fee > 0 && $expenseQuery->exists()) {
                    $expenseQuery->update(['amount' => $fee]);
                } elseif ($fee > 0) {
                    DB::table('expense')->insert([
                        'id' => 'EXP-'.Str::lower(Str::random(12)),
                        'category' => 'Fee Pegawai',
                        'amount' => $fee,
                        'description' => $expenseDescription,
                        'expenseDate' => now()->toDateString(),
                        'createdAt' => now(),
                    ]);
                } else {
                    $expenseQuery->delete();
                }
            }
        });
        $this->log($request, 'UPDATE_EMPLOYEE_FEES', "Memperbarui fee pegawai pada berkas {$id}");

        return back()->with('success', 'Fee pegawai berhasil diperbarui.');
    }

    public function updateProgress(Request $request, string $type, string $id)
    {
        abort_unless(isset(self::TABLES[$type]), 404);
        $data = $request->validate([
            'status' => 'required|in:PENDING,PROSES,REVISI,REVISI_PROSES,VERIFIKASI,SELESAI,CANCELLED',
            'description' => 'required|string|max:1000',
            'photos' => 'nullable|array|max:10',
            'photos.*' => 'required|image|mimes:jpg,jpeg,png,webp|max:5120',
        ]);
        $job = DB::table($type)->where('id', $id)->first();
        abort_unless((bool) $job, 404);
        $foreignKey = $this->foreignKey($type);

        $actorUserId = $this->attachmentUserId($request, $job->staffId ?? null);
        $paths = [];
        try {
        DB::transaction(function () use ($request, $type, $id, $data, $job, $foreignKey, $actorUserId, &$paths) {
            DB::table($type)->where('id', $id)->update([
                'status' => $data['status'],
                'updatedAt' => now(),
            ]);
            $progressId = 'PROG-'.Str::random(12);
            DB::table('jobprogress')->insert([
                'id' => $progressId,
                'userId' => $actorUserId,
                'statusBefore' => $job->status,
                'statusAfter' => $data['status'],
                'description' => $data['description'] ?: 'Progress berkas diperbarui',
                $foreignKey => $id,
                'createdAt' => now(),
            ]);
            foreach ($data['photos'] ?? [] as $photo) {
                $path = $photo->store('job-progress-photos', 'local');
                if (! $path) { throw new \RuntimeException('Gagal menyimpan foto progres.'); }
                $paths[] = $path;
                DB::table('job_progress_photos')->insert(['progress_id' => $progressId, 'file_path' => $path, 'file_name' => Str::limit($photo->getClientOriginalName(), 240, ''), 'created_at' => now()]);
            }
            $this->log($request, 'UPDATE_JOB_PROGRESS', "Memperbarui progress berkas {$id}");
        });
        } catch (Throwable $exception) {
            Storage::disk('local')->delete($paths);
            throw $exception;
        }

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
                'url' => url('/cekberkas'),
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

    public function edit(Request $request, string $type, string $id)
    {
        abort_unless(isset(self::TABLES[$type]), 404);
        $job = DB::table($type)->where('id', $id)->first();
        abort_unless((bool) $job, 404);

        $foreignKey = $this->foreignKey($type);

        $employeeTasks = DB::table('job_employee_task')
            ->where($foreignKey, $id)
            ->orderBy('createdAt')
            ->get()
            ->map(function (object $task) use ($request): object {
                if (! $this->canManageFee($request)) {
                    unset($task->fee);
                }

                return $task;
            });

        $linkedInvoice = DB::table('invoice')->where(fn ($query) => $query->where($foreignKey, $id)
            ->when($job->sourceInvoiceId ?? null, fn ($query, $source) => $query->orWhere('id', $source)))->first();

        return Inertia::render('Jobs/Form', ['linkedInvoice' => $linkedInvoice ? (object) ['id' => $linkedInvoice->id, 'invoiceNumber' => $linkedInvoice->invoiceNumber, 'status' => $linkedInvoice->status] : null, 'availableInvoices' => $this->availableInvoices(), 'job' => [...(array) $job, 'jobType' => $type], 'founders' => DB::table('founder')->where($foreignKey, $id)->get(), 'attachments' => DB::table('attachment')->where($foreignKey, $id)->orderBy('createdAt')->get(), 'employeeTasks' => $employeeTasks, 'clients' => DB::table('client')->select('id', 'name', 'phone')->orderBy('name')->get(), 'staff' => DB::table('user')->select('id', 'fullName', 'role')->where('isActive', true)->orderBy('fullName')->get()]);
    }

    public function update(Request $request, string $type, string $id)
    {
        abort_unless(isset(self::TABLES[$type]), 404);
        $data = $this->validated($request, false);
        $manualNumber = $this->validateTrackingCode($request, $type, $id);
        if ($manualNumber !== null) {
            $data['trackingCode'] = $manualNumber;
        }
        $invoiceAction = $data['invoiceAction'] ?? 'none';
        $sourceInvoiceId = $invoiceAction === 'existing' ? ($data['sourceInvoiceId'] ?? null) : null;
        if ($invoiceAction === 'existing' && ! $sourceInvoiceId) {
            throw ValidationException::withMessages(['sourceInvoiceId' => 'Pilih invoice yang akan dihubungkan.']);
        }
        $founders = $data['founders'] ?? [];
        $employeeTasks = $data['employeeTasks'] ?? [];
        $data['staffId'] = $this->taskPicStaffId($employeeTasks);
        $attachments = $request->file('attachments', []);
        $attachmentDescriptions = $data['attachmentDescriptions'] ?? [];
        $attachmentDeposits = $data['attachmentDeposits'] ?? [];
        $savedAttachmentDeposits = $data['savedAttachmentDeposits'] ?? [];
        unset($data['jobType'],$data['sourceInvoiceId'],$data['invoiceAction'],$data['founders'],$data['employeeTasks'],$data['attachments'],$data['attachmentDescriptions'],$data['attachmentDeposits'],$data['savedAttachmentDeposits'],$data['tanggalMasuk']);
        $old = DB::table($type)->where('id', $id)->first();
        abort_unless((bool) $old, 404);
        $actorUserId = $this->attachmentUserId($request, $data['staffId'] ?? $old->staffId);
        $fk = $this->foreignKey($type);
        DB::transaction(function () use ($data, $founders, $employeeTasks, $attachments, $attachmentDescriptions, $attachmentDeposits, $savedAttachmentDeposits, $actorUserId, $request, $type, $id, $old, $fk, $invoiceAction, $sourceInvoiceId) {
            $lockedJob = DB::table($type)->where('id', $id)->lockForUpdate()->first();
            abort_unless($lockedJob, 404);
            $linked = DB::table('invoice')->where(fn ($query) => $query->where($fk, $id)
                ->when($lockedJob->sourceInvoiceId ?? null, fn ($query, $source) => $query->orWhere('id', $source)))->lockForUpdate()->first();
            if ($invoiceAction !== 'none' && $linked) {
                throw ValidationException::withMessages(['sourceInvoiceId' => 'Berkas sudah memiliki invoice.']);
            }
            $invoiceFields = [];
            if ($invoiceAction === 'existing') {
                $invoice = $this->lockInvoice($sourceInvoiceId);
                if (! $invoice->badanHukumId && ! $invoice->nonBadanHukumId && ! $invoice->ppatId) {
                    DB::table('invoice')->where('id', $invoice->id)->update([$fk => $id, 'updatedAt' => now()]);
                }
                $invoiceFields = ['sourceInvoiceId' => $invoice->id, 'invoiceStatus' => match ($invoice->status) { 'Lunas' => 'LUNAS', 'DP Bayar' => 'DP', default => 'PENDING' }];
            }
            DB::table($type)->where('id', $id)->update([...$data, ...$invoiceFields, 'updatedAt' => now()]);
            DB::table('founder')->where($fk, $id)->delete();
            foreach ($founders as $f) {
                if (! empty($f['name'])) {
                    DB::table('founder')->insert(['id' => 'FND-'.Str::random(12), 'name' => $f['name'], 'position' => $f['position'] ?? null, 'phone' => $f['phone'] ?? null, 'email' => $f['email'] ?? null, $fk => $id, 'createdAt' => now()]);
                }
            }
            $this->syncEmployeeTasks($employeeTasks, $fk, $id, $this->canManageFee($request));
            foreach ($savedAttachmentDeposits as $attachmentId => $isPhysicalDeposited) {
                DB::table('attachment')
                    ->where('id', $attachmentId)
                    ->where($fk, $id)
                    ->update(['isPhysicalDeposited' => (bool) $isPhysicalDeposited]);
            }
            foreach ($attachments as $index => $file) {
                $path = $file->store('uploads/attachments', 'public_root');
                DB::table('attachment')->insert(['id' => 'ATT-'.Str::random(12), 'userId' => $actorUserId, 'fileName' => $file->getClientOriginalName(), 'filePath' => '/'.$path, 'fileType' => $file->getMimeType() ?: 'application/octet-stream', 'description' => $attachmentDescriptions[$index] ?? null, 'isPhysicalDeposited' => (bool) ($attachmentDeposits[$index] ?? false), $fk => $id, 'createdAt' => now()]);
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

        if ($invoiceAction === 'new') {
            return redirect()->route('invoices.create', ['job' => $id, 'type' => $type])->with('success', 'Berkas diperbarui. Lengkapi invoice baru.');
        }
        return redirect()->route('jobs.show', [$type, $id])->with('success', 'Berkas diperbarui.');
    }

    public function destroy(Request $request, string $type, string $id)
    {
        abort_unless(isset(self::TABLES[$type]), 404);
        $fk = $this->foreignKey($type);
        $receiptPaths = DB::table('uploaded_job_receipts')->where('job_type', $type)->where('job_id', $id)->pluck('file_path')->all();
        $photoPaths = DB::table('job_progress_photos')->whereIn('progress_id', DB::table('jobprogress')->where($fk, $id)->select('id'))->pluck('file_path')->all();
        DB::transaction(function () use ($type, $id, $fk, $request) {
            DB::table('job_progress_photos')->whereIn('progress_id', DB::table('jobprogress')->where($fk, $id)->select('id'))->delete();
            DB::table('uploaded_job_receipts')->where('job_type', $type)->where('job_id', $id)->delete();
            foreach (['founder', 'attachment', 'jobprogress', 'job_employee_task'] as $table) {
                DB::table($table)->where($fk, $id)->delete();
            }DB::table($type)->where('id', $id)->delete();
            $this->log($request, 'DELETE_JOB', "Menghapus berkas {$id}");
        });
        \Illuminate\Support\Facades\Storage::disk('local')->delete($receiptPaths);
        Storage::disk('local')->delete($photoPaths);

        return redirect()->route('jobs.index')->with('success', 'Berkas dihapus.');
    }

    private function validateTrackingCode(Request $request, ?string $type = null, ?string $id = null): ?string
    {
        $validated = $request->validate(['trackingCode' => 'nullable|string|max:191']);
        $number = trim($validated['trackingCode'] ?? '');
        if ($number !== '' && $this->trackingCodeExists($number, $type, $id)) {
            throw ValidationException::withMessages(['trackingCode' => 'Nomor berkas sudah digunakan.']);
        }

        return $number !== '' ? $number : null;
    }

    public function progressPhoto(string $type, string $id, int $photo)
    {
        abort_unless(isset(self::TABLES[$type]), 404);
        $foreignKey = $this->foreignKey($type);
        $file = DB::table('job_progress_photos as photo')->join('jobprogress as progress', 'progress.id', '=', 'photo.progress_id')->where("progress.{$foreignKey}", $id)->where('photo.id', $photo)->select('photo.file_path')->first();
        abort_unless($file && Storage::disk('local')->exists($file->file_path), 404);
        return Storage::disk('local')->response($file->file_path, null, ['Cache-Control' => 'private, no-store', 'X-Content-Type-Options' => 'nosniff']);
    }

    private function trackingCodeExists(string $number, ?string $type = null, ?string $id = null): bool
    {
        foreach (array_keys(self::TABLES) as $table) {
            $query = DB::table($table)->where('trackingCode', $number);
            if ($table === $type && $id !== null) {
                $query->where('id', '!=', $id);
            }
            if ($query->exists()) {
                return true;
            }
        }

        return false;
    }

    private function validated(Request $r, bool $creating = true): array
    {
        return $r->validate(['jobType' => [$creating ? 'required' : 'nullable', 'in:'.implode(',', array_keys(self::TABLES))], 'sourceInvoiceId' => 'nullable|string|exists:invoice,id', 'invoiceAction' => 'nullable|in:none,existing,new', 'clientId' => 'required|string', 'staffId' => 'nullable|string', 'title' => 'required|string|max:255', 'type' => 'required|string|max:255', 'pengurusanUntuk' => 'nullable|string|max:255', 'companyName' => 'nullable|string|max:255', 'status' => 'required|in:PENDING,PROSES,REVISI,REVISI_PROSES,VERIFIKASI,SELESAI,CANCELLED', 'priority' => 'required|in:LOW,MEDIUM,HIGH,URGENT', 'deadline' => 'nullable|date', 'tanggalMasuk' => 'nullable|date', 'saksi' => 'nullable|string|max:255', 'notes' => 'nullable|string', 'founders' => 'nullable|array', 'founders.*.name' => 'nullable|string', 'founders.*.position' => 'nullable|string|max:255', 'founders.*.phone' => 'nullable|string', 'founders.*.email' => 'nullable|email', 'employeeTasks' => 'nullable|array|max:25', 'employeeTasks.*.id' => 'nullable|string', 'employeeTasks.*.userId' => 'required|string|exists:user,id', 'employeeTasks.*.taskType' => 'required|in:PIC,Saksi,NPWP,NIB,PBB,Lainnya', 'employeeTasks.*.customTask' => 'nullable|string|max:255|required_if:employeeTasks.*.taskType,Lainnya', 'employeeTasks.*.fee' => 'nullable|numeric|min:0', 'attachments' => 'nullable|array', 'attachments.*' => 'nullable|file|max:10240', 'attachmentDescriptions' => 'nullable|array', 'attachmentDescriptions.*' => 'nullable|string|max:500', 'attachmentDeposits' => 'nullable|array', 'attachmentDeposits.*' => 'boolean', 'savedAttachmentDeposits' => 'nullable|array', 'savedAttachmentDeposits.*' => 'boolean']);
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
        $role = strtoupper((string) $request->session()->get('auth_user.role', ''));

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

    private function syncEmployeeTasks(array $employeeTasks, string $foreignKey, string $jobId, bool $canManageFee): void
    {
        $existingTasks = DB::table('job_employee_task')
            ->where($foreignKey, $jobId)
            ->get()
            ->keyBy('id');
        $retainedIds = [];

        foreach ($employeeTasks as $employeeTask) {
            $taskId = (string) ($employeeTask['id'] ?? '');
            $existingTask = $taskId !== '' ? $existingTasks->get($taskId) : null;

            // Kompatibilitas untuk form lama yang belum mengirim ID tugas.
            if (! $existingTask) {
                $existingTask = $existingTasks->first(function (object $task) use ($employeeTask, $retainedIds): bool {
                    return ! in_array($task->id, $retainedIds, true)
                        && $task->userId === $employeeTask['userId']
                        && $task->taskType === $employeeTask['taskType']
                        && ($task->customTask ?? '') === ($employeeTask['customTask'] ?? '');
                });
            }

            if ($existingTask) {
                $fee = $canManageFee
                    ? max(0, (float) ($employeeTask['fee'] ?? 0))
                    : (float) $existingTask->fee;
                DB::table('job_employee_task')->where('id', $existingTask->id)->update([
                    'userId' => $employeeTask['userId'],
                    'taskType' => $employeeTask['taskType'],
                    'customTask' => $employeeTask['taskType'] === 'Lainnya' ? ($employeeTask['customTask'] ?? null) : null,
                    'fee' => $fee,
                    'updatedAt' => now(),
                ]);
                $retainedIds[] = $existingTask->id;

                continue;
            }

            $newTaskId = 'JET-'.Str::random(12);
            DB::table('job_employee_task')->insert([
                'id' => $newTaskId,
                'userId' => $employeeTask['userId'],
                'taskType' => $employeeTask['taskType'],
                'customTask' => $employeeTask['taskType'] === 'Lainnya' ? ($employeeTask['customTask'] ?? null) : null,
                'fee' => $canManageFee ? max(0, (float) ($employeeTask['fee'] ?? 0)) : 0,
                $foreignKey => $jobId,
                'createdAt' => now(),
                'updatedAt' => now(),
            ]);
            $retainedIds[] = $newTaskId;
        }

        DB::table('job_employee_task')
            ->where($foreignKey, $jobId)
            ->when($retainedIds, fn ($query) => $query->whereNotIn('id', $retainedIds))
            ->delete();
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

    private function availableInvoices()
    {
        return DB::table('invoice as i')
            ->leftJoin('quotation as q', 'q.id', '=', 'i.quotationId')
            ->leftJoin('badan_hukum as bh', 'bh.id', '=', 'i.badanHukumId')
            ->leftJoin('non_badan_hukum as nb', 'nb.id', '=', 'i.nonBadanHukumId')
            ->leftJoin('ppat as pp', 'pp.id', '=', 'i.ppatId')
            ->leftJoin('client as c', 'c.id', '=', DB::raw('COALESCE(q.clientId, bh.clientId, nb.clientId, pp.clientId)'))
            ->select('i.id', 'i.invoiceNumber', 'i.amount', 'i.status')
            ->selectRaw('COALESCE(q.clientName, c.name) as clientName')
            ->orderByDesc('i.date')->get();
    }

    private function lockInvoice(string $invoiceId): object
    {
        $invoice = DB::table('invoice')->where('id', $invoiceId)->lockForUpdate()->first();
        if (! $invoice) {
            throw ValidationException::withMessages(['sourceInvoiceId' => 'Invoice tidak ditemukan.']);
        }
        return $invoice;
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
