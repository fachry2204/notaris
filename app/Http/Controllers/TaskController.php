<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class TaskController extends Controller
{
    private const JOB_TABLES = [
        'badanHukumId' => 'badan_hukum',
        'nonBadanHukumId' => 'non_badan_hukum',
        'ppatId' => 'ppat',
    ];

    public function index(Request $request)
    {
        $search = trim((string) $request->query('search'));
        $userId = trim((string) $request->query('userId'));
        $taskType = trim((string) $request->query('taskType'));
        $paymentStatus = trim((string) $request->query('paymentStatus'));
        $startDate = trim((string) $request->query('startDate'));
        $endDate = trim((string) $request->query('endDate'));

        $query = DB::table('job_employee_task as task')
            ->leftJoin('user as employee', 'employee.id', '=', 'task.userId')
            ->leftJoin('staff as s', 's.userId', '=', 'employee.id')
            ->leftJoin('badan_hukum as bh', 'bh.id', '=', 'task.badanHukumId')
            ->leftJoin('non_badan_hukum as nbh', 'nbh.id', '=', 'task.nonBadanHukumId')
            ->leftJoin('ppat as ppat', 'ppat.id', '=', 'task.ppatId')
            ->leftJoin('client as c', 'c.id', '=', DB::raw('COALESCE(bh.clientId, nbh.clientId, ppat.clientId)'))
            ->select(
                'task.id',
                'task.userId',
                'task.taskType',
                'task.customTask',
                'task.fee',
                'task.isPaid',
                'task.paidAt',
                'task.createdAt',
                'task.badanHukumId',
                'task.nonBadanHukumId',
                'task.ppatId',
                'employee.fullName as employeeName',
                'employee.username as employeeUsername',
                's.photoPath as employeePhoto',
                'employee.role as employeeRole',
                'c.name as clientName',
                DB::raw('COALESCE(bh.id, nbh.id, ppat.id) as jobId'),
                DB::raw("CASE WHEN bh.id IS NOT NULL THEN 'badan_hukum' WHEN nbh.id IS NOT NULL THEN 'non_badan_hukum' WHEN ppat.id IS NOT NULL THEN 'ppat' END as jobType"),
                DB::raw("CASE WHEN bh.id IS NOT NULL THEN 'Badan Hukum/Usaha' WHEN nbh.id IS NOT NULL THEN 'Non Badan Hukum' WHEN ppat.id IS NOT NULL THEN 'PPAT' END as jobCategory"),
                DB::raw('COALESCE(bh.title, nbh.title, ppat.title) as jobTitle'),
                DB::raw('COALESCE(bh.trackingCode, nbh.trackingCode, ppat.trackingCode) as trackingCode'),
                DB::raw('COALESCE(bh.status, nbh.status, ppat.status) as jobStatus')
            )
            ->when($userId, fn ($q) => $q->where('task.userId', $userId))
            ->when($taskType, fn ($q) => $q->where('task.taskType', $taskType))
            ->when($paymentStatus === 'paid', fn ($q) => $q->where('task.isPaid', true))
            ->when($paymentStatus === 'unpaid', fn ($q) => $q->where('task.isPaid', false))
            ->when($startDate, fn ($q) => $q->whereDate('task.createdAt', '>=', $startDate))
            ->when($endDate, fn ($q) => $q->whereDate('task.createdAt', '<=', $endDate))
            ->when($search, fn ($q) => $q->where(fn ($sub) => $sub->where('bh.title', 'like', "%{$search}%")
                ->orWhere('nbh.title', 'like', "%{$search}%")
                ->orWhere('ppat.title', 'like', "%{$search}%")
                ->orWhere('bh.trackingCode', 'like', "%{$search}%")
                ->orWhere('nbh.trackingCode', 'like', "%{$search}%")
                ->orWhere('ppat.trackingCode', 'like', "%{$search}%")
                ->orWhere('c.name', 'like', "%{$search}%")
                ->orWhere('task.customTask', 'like', "%{$search}%")
                ->orWhere('employee.fullName', 'like', "%{$search}%")
            ));

        $clonedQuery = clone $query;
        $totalTasks = (clone $query)->count();
        $totalFee = (float) (clone $clonedQuery)->sum('task.fee');
        $paidFee = (float) (clone $clonedQuery)->where('task.isPaid', true)->sum('task.fee');
        $unpaidFee = (float) (clone $clonedQuery)->where('task.isPaid', false)->sum('task.fee');

        $staffList = DB::table('user')
            ->select('id', 'fullName', 'role')
            ->where('isActive', true)
            ->orderBy('fullName')
            ->get();

        $tasks = $query->orderByDesc('task.createdAt')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Tasks/Index', [
            'tasks' => $tasks,
            'staff' => $staffList,
            'filters' => [
                'search' => $search,
                'userId' => $userId,
                'taskType' => $taskType,
                'paymentStatus' => $paymentStatus,
                'startDate' => $startDate,
                'endDate' => $endDate,
            ],
            'stats' => [
                'totalTasks' => $totalTasks,
                'totalFee' => $totalFee,
                'paidFee' => $paidFee,
                'unpaidFee' => $unpaidFee,
            ],
        ]);
    }

    public function paymentPreview(Request $request, string $id)
    {
        $this->authorizePaymentManagement($request);
        $task = $this->paymentTask($id);
        abort_unless((bool) $task, 404);

        [$jobForeignKey, $jobTable, $jobId] = $this->taskJobReference($task);
        $invoices = collect();

        if ($jobForeignKey && $jobTable && $jobId) {
            $sourceInvoiceId = DB::table($jobTable)->where('id', $jobId)->value('sourceInvoiceId');
            $invoiceQuery = DB::table('invoice')->where($jobForeignKey, $jobId);
            if ($sourceInvoiceId) {
                $invoiceQuery->orWhere('id', $sourceInvoiceId);
            }
            $invoices = $invoiceQuery
                ->select('id', 'invoiceNumber', 'amount', 'status', 'date')
                ->orderByDesc('date')
                ->get();
        }

        $paidByInvoice = $invoices->isEmpty()
            ? collect()
            : DB::table('financerecord')
                ->whereIn('invoiceId', $invoices->pluck('id'))
                ->where('type', 'INCOME')
                ->select('invoiceId', DB::raw('SUM(amount) as paidAmount'))
                ->groupBy('invoiceId')
                ->pluck('paidAmount', 'invoiceId');

        $invoiceDetails = $invoices->map(function (object $invoice) use ($paidByInvoice) {
            $amount = (float) $invoice->amount;
            $paidAmount = (float) ($paidByInvoice->get($invoice->id) ?? 0);

            return [
                'id' => $invoice->id,
                'invoiceNumber' => $invoice->invoiceNumber,
                'status' => $invoice->status,
                'amount' => $amount,
                'paidAmount' => $paidAmount,
                'remainingAmount' => max(0, $amount - $paidAmount),
            ];
        })->values();

        $totalInvoiceAmount = (float) $invoiceDetails->sum('amount');
        $totalPaidAmount = (float) $invoiceDetails->sum('paidAmount');

        return response()->json([
            'task' => [
                'id' => $task->id,
                'employeeName' => $task->employeeName,
                'taskType' => $task->taskType,
                'customTask' => $task->customTask,
                'fee' => (float) ($task->fee ?? 0),
                'isPaid' => (bool) $task->isPaid,
                'jobTitle' => $task->jobTitle,
                'trackingCode' => $task->trackingCode,
                'clientName' => $task->clientName,
            ],
            'billing' => [
                'hasInvoice' => $invoiceDetails->isNotEmpty(),
                'hasPayment' => $totalPaidAmount > 0,
                'invoiceCount' => $invoiceDetails->count(),
                'totalInvoiceAmount' => $totalInvoiceAmount,
                'totalPaidAmount' => $totalPaidAmount,
                'totalRemainingAmount' => max(0, $totalInvoiceAmount - $totalPaidAmount),
                'invoices' => $invoiceDetails,
            ],
        ]);
    }

    public function togglePaymentStatus(Request $request, string $id)
    {
        $this->authorizePaymentManagement($request);
        $request->validate(['confirmed' => ['accepted']]);
        $task = $this->paymentTask($id);
        abort_unless((bool) $task, 404);

        $newPaidState = ! $task->isPaid;
        $feeAmount = (float) ($task->fee ?? 0);

        DB::transaction(function () use ($id, $task, $newPaidState, $feeAmount) {
            DB::table('job_employee_task')->where('id', $id)->update([
                'isPaid' => $newPaidState,
                'paidAt' => $newPaidState ? now() : null,
                'updatedAt' => now(),
            ]);

            $expenseDescription = 'Pembayaran Fee Pegawai '.($task->employeeName ?? 'Pegawai').' (Tugas: '.$task->taskType.') - Berkas: '.($task->jobTitle ?? 'Berkas').' ['.($task->trackingCode ?? '-').']';

            if ($newPaidState && $feeAmount > 0) {
                DB::table('expense')->insert([
                    'id' => 'EXP-'.Str::lower(Str::random(12)),
                    'category' => 'Fee Pegawai',
                    'amount' => $feeAmount,
                    'description' => $expenseDescription,
                    'expenseDate' => now()->toDateString(),
                    'createdAt' => now(),
                ]);
            } elseif (! $newPaidState) {
                DB::table('expense')
                    ->where('category', 'Fee Pegawai')
                    ->where('description', $expenseDescription)
                    ->delete();
            }
        });

        $feeFormatted = 'Rp '.number_format($feeAmount, 0, ',', '.');

        return back()->with(
            'success',
            $newPaidState
                ? "Fee tugas {$feeFormatted} berhasil dibayar & dicatat ke Pengeluaran Uang."
                : "Status fee tugas diubah menjadi BELUM TERBAYAR."
        );
    }

    private function authorizePaymentManagement(Request $request): void
    {
        $sessionId = $request->session()->get('auth_user.id');
        $userRole = $sessionId ? DB::table('user')->where('id', $sessionId)->value('role') : null;
        abort_unless(in_array($userRole, ['ADMINISTRATOR', 'PIMPINAN'], true), 403, 'Hanya Admin atau Pimpinan yang dapat merubah status pembayaran fee.');
    }

    private function paymentTask(string $id): ?object
    {
        return DB::table('job_employee_task as task')
            ->leftJoin('user as employee', 'employee.id', '=', 'task.userId')
            ->leftJoin('badan_hukum as bh', 'bh.id', '=', 'task.badanHukumId')
            ->leftJoin('non_badan_hukum as nbh', 'nbh.id', '=', 'task.nonBadanHukumId')
            ->leftJoin('ppat as ppat', 'ppat.id', '=', 'task.ppatId')
            ->leftJoin('client as c', 'c.id', '=', DB::raw('COALESCE(bh.clientId, nbh.clientId, ppat.clientId)'))
            ->where('task.id', $id)
            ->select(
                'task.*',
                'employee.fullName as employeeName',
                'c.name as clientName',
                DB::raw('COALESCE(bh.title, nbh.title, ppat.title) as jobTitle'),
                DB::raw('COALESCE(bh.trackingCode, nbh.trackingCode, ppat.trackingCode) as trackingCode')
            )
            ->first();
    }

    private function taskJobReference(object $task): array
    {
        foreach (self::JOB_TABLES as $foreignKey => $table) {
            if (! empty($task->{$foreignKey})) {
                return [$foreignKey, $table, $task->{$foreignKey}];
            }
        }

        return [null, null, null];
    }
}
