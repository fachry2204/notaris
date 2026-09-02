<?php

namespace App\Http\Controllers;

use App\Services\DocumentNumberService;
use App\Services\NotificationGateway;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Throwable;

class InvoiceController extends Controller
{
    private const TABLES = ['badan_hukum', 'non_badan_hukum', 'ppat'];

    public function __construct(private readonly DocumentNumberService $numbers) {}

    public function index(Request $r)
    {
        $search = trim((string) $r->query('search'));
        $status = (string) $r->query('status');
        $q = DB::table('invoice as i')->leftJoin('badan_hukum as bh', 'bh.id', '=', 'i.badanHukumId')->leftJoin('non_badan_hukum as nb', 'nb.id', '=', 'i.nonBadanHukumId')->leftJoin('ppat as pp', 'pp.id', '=', 'i.ppatId')->leftJoin('quotation as q', 'q.id', '=', 'i.quotationId')->leftJoin('client as cb', 'cb.id', '=', 'bh.clientId')->leftJoin('client as cn', 'cn.id', '=', 'nb.clientId')->leftJoin('client as cp', 'cp.id', '=', 'pp.clientId')->leftJoin('client as cq', 'cq.id', '=', 'q.clientId')->select('i.*')->selectRaw('COALESCE(q.subject,bh.title,nb.title,pp.title) as jobTitle, COALESCE(q.clientName,cq.name,cb.name,cn.name,cp.name) as clientName')->when($search, fn ($x) => $x->where(fn ($x) => $x->where('i.invoiceNumber', 'like', "%{$search}%")->orWhereRaw('COALESCE(q.clientName,cq.name,cb.name,cn.name,cp.name) like ?', ["%{$search}%"])))->when($status, fn ($x) => $x->where('i.status', $status));

        return Inertia::render('Invoices/Index', ['invoices' => $q->orderByDesc('i.createdAt')->paginate(20)->withQueryString(), 'search' => $search, 'status' => $status, 'stats' => ['paid' => DB::table('invoice')->where('status', 'Lunas')->sum('amount'), 'dp' => DB::table('invoice')->where('status', 'DP Bayar')->sum('amount'), 'unpaid' => DB::table('invoice')->where('status', 'Belum Bayar')->sum('amount')]]);
    }

    public function create(Request $r)
    {
        $quotationId = (string) $r->query('quotation');
        if ($quotationId) {
            $quotation = DB::table('quotation as q')
                ->leftJoin('client as c', 'c.id', '=', 'q.clientId')
                ->select('q.*', 'c.name as legacyClientName', 'c.phone as legacyClientPhone', 'c.email as legacyClientEmail')
                ->where('q.id', $quotationId)
                ->first();
            abort_unless($quotation, 404);
            if ($invoiceId = DB::table('invoice')->where('quotationId', $quotationId)->value('id')) {
                return redirect()->route('invoices.show', $invoiceId);
            }
            abort_unless(in_array($quotation->status, ['Dikirim', 'Disetujui'], true), 422, 'Quotation harus diterbitkan sebelum dijadikan Invoice.');
            $quotation->clientName = $quotation->clientName ?: $quotation->legacyClientName;
            $quotation->clientPhone = $quotation->clientPhone ?: $quotation->legacyClientPhone;
            $quotation->clientEmail = $quotation->clientEmail ?: $quotation->legacyClientEmail;

            return Inertia::render('Invoices/Form', [
                'invoice' => null,
                'jobId' => '',
                'jobType' => '',
                'job' => null,
                'jobs' => [],
                'sourceQuotation' => $quotation,
                'quotationItems' => DB::table('quotation_item')->where('quotationId', $quotationId)->orderBy('sortOrder')->get(),
                'invoiceItems' => [],
            ]);
        }

        $jobId = (string) $r->query('job');
        $jobType = (string) $r->query('type');
        $job = null;
        if (in_array($jobType, self::TABLES) && $jobId) {
            $job = DB::table($jobType.' as j')->leftJoin('client as c', 'c.id', '=', 'j.clientId')->select('j.id', 'j.title', 'j.trackingCode', 'c.name as clientName')->where('j.id', $jobId)->first();
        }$jobs = collect();
        foreach (self::TABLES as $table) {
            $fk = $this->fk($table);
            $jobs = $jobs->concat(DB::table($table.' as j')->leftJoin('client as c', 'c.id', '=', 'j.clientId')->leftJoin('invoice as i', 'i.'.$fk, '=', 'j.id')->whereNull('i.id')->select('j.id', 'j.title', 'j.trackingCode', 'c.name as clientName')->selectRaw('? as jobType', [$table])->orderByDesc('j.createdAt')->get());
        }

        return Inertia::render('Invoices/Form', ['invoice' => null, 'jobId' => $jobId, 'jobType' => $jobType, 'job' => $job, 'jobs' => $jobs->values(), 'sourceQuotation' => null, 'quotationItems' => [], 'invoiceItems' => []]);
    }

    public function store(Request $r)
    {
        $d = $r->validate([
            'quotationId' => 'nullable|string|exists:quotation,id',
            'jobId' => 'required_without:quotationId|nullable|string',
            'jobType' => 'required_without:quotationId|nullable|in:badan_hukum,non_badan_hukum,ppat',
            'dpAmount' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
            'date' => 'required|date',
            'dueDate' => 'nullable|date',
            'items' => 'required|array|min:1|max:100',
            'items.*.description' => 'required|string|max:1000',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit' => 'required|string|max:50',
            'items.*.unitPrice' => 'required|numeric|min:0',
        ]);
        $amount = $this->itemsTotal($d['items']);
        if ((float) ($d['dpAmount'] ?? 0) > $amount) {
            throw ValidationException::withMessages(['dpAmount' => 'Pembayaran DP tidak boleh melebihi total Invoice.']);
        }
        if (! empty($d['quotationId'])) {
            $quotationStatus = DB::table('quotation')->where('id', $d['quotationId'])->value('status');
            if (! in_array($quotationStatus, ['Dikirim', 'Disetujui'], true)) {
                return back()->withErrors(['quotationId' => 'Quotation harus diterbitkan sebelum dijadikan Invoice.']);
            }
            if (DB::table('invoice')->where('quotationId', $d['quotationId'])->exists()) {
                return back()->withErrors(['quotationId' => 'Quotation ini sudah memiliki Invoice.']);
            }
        }
        $id = DB::transaction(function () use ($d, $amount) {
            $number = $this->numbers->next('invoice', $d['date']);
            $id = 'inv-'.Str::random(12);
            $source = [];
            if (! empty($d['quotationId'])) {
                $source['quotationId'] = $d['quotationId'];
            } else {
                $source[$this->fk($d['jobType'])] = $d['jobId'];
            }
            DB::table('invoice')->insert(['id' => $id, 'invoiceNumber' => $number, 'amount' => $amount, 'status' => ($d['dpAmount'] ?? 0) > 0 ? 'DP Bayar' : 'Belum Bayar', 'description' => $d['description'] ?? null, 'date' => $d['date'], 'dueDate' => $d['dueDate'] ?? null, ...$source, 'createdAt' => now(), 'updatedAt' => now()]);
            $this->storeItems($id, $d['items']);
            if (($d['dpAmount'] ?? 0) > 0) {
                $paymentSource = empty($d['quotationId']) ? [$this->fk($d['jobType']) => $d['jobId']] : [];
                DB::table('financerecord')->insert(['id' => 'FIN-'.Str::random(10), 'invoiceId' => $id, ...$paymentSource, 'type' => 'INCOME', 'amount' => $d['dpAmount'], 'description' => 'Pembayaran DP', 'date' => $d['date'], 'createdAt' => now()]);
            }
            if (! empty($d['quotationId'])) {
                DB::table('quotation')->where('id', $d['quotationId'])->update(['status' => 'Invoice Terbuat', 'updatedAt' => now()]);
            } else {
                DB::table($d['jobType'])->where('id', $d['jobId'])->update(['invoiceStatus' => ($d['dpAmount'] ?? 0) > 0 ? 'DP' : 'PENDING']);
            }

            return $id;
        });

        return redirect()->route('invoices.show', $id)->with('success', 'Invoice berhasil dibuat.');
    }

    public function show(string $id)
    {
        $invoice = DB::table('invoice')->where('id', $id)->first();
        abort_unless($invoice, 404);
        [$type,$jobId] = $this->invoiceJob($invoice);
        $job = $this->sourceDocument($type, $jobId);

        $masterClient = $type === 'quotation' && ($job->clientId ?? null)
            ? DB::table('client')->where('id', $job->clientId)->first()
            : null;

        return Inertia::render('Invoices/Show', ['invoice' => $invoice, 'items' => DB::table('invoice_item')->where('invoiceId', $id)->orderBy('sortOrder')->get(), 'payments' => DB::table('financerecord')->where('invoiceId', $id)->orderByDesc('date')->get(), 'job' => $job, 'jobType' => $type, 'masterClient' => $masterClient]);
    }

    public function edit(string $id)
    {
        $invoice = DB::table('invoice')->where('id', $id)->first();
        abort_unless($invoice, 404);
        [$type, $jobId] = $this->invoiceJob($invoice);
        $job = $this->sourceDocument($type, $jobId);

        return Inertia::render('Invoices/Form', ['invoice' => $invoice, 'jobId' => $type === 'quotation' ? '' : $jobId, 'jobType' => $type === 'quotation' ? '' : $type, 'job' => $type === 'quotation' ? null : $job, 'jobs' => [], 'sourceQuotation' => $type === 'quotation' ? $job : null, 'quotationItems' => [], 'invoiceItems' => DB::table('invoice_item')->where('invoiceId', $id)->orderBy('sortOrder')->get()]);
    }

    public function update(Request $r, string $id)
    {
        $d = $r->validate([
            'status' => 'required|in:Belum Bayar,DP Bayar,Lunas',
            'description' => 'nullable|string',
            'date' => 'required|date',
            'dueDate' => 'nullable|date',
            'items' => 'required|array|min:1|max:100',
            'items.*.description' => 'required|string|max:1000',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit' => 'required|string|max:50',
            'items.*.unitPrice' => 'required|numeric|min:0',
        ]);
        $amount = $this->itemsTotal($d['items']);
        $invoice = DB::table('invoice')->where('id', $id)->first();
        abort_unless($invoice, 404);
        DB::transaction(function () use ($id, $d, $amount, $invoice) {
            DB::table('invoice')->where('id', $id)->update(['amount' => $amount, 'status' => $d['status'], 'description' => $d['description'] ?? null, 'date' => $d['date'], 'dueDate' => $d['dueDate'] ?? null, 'updatedAt' => now()]);
            DB::table('invoice_item')->where('invoiceId', $id)->delete();
            $this->storeItems($id, $d['items']);
            $this->syncLinkedJobInvoiceStatus($invoice, $d['status']);
        });

        return redirect()->route('invoices.show', $id)->with('success', 'Invoice diperbarui.');
    }

    public function payment(Request $r, string $id)
    {
        $d = $r->validate(['amount' => 'required|numeric|min:1', 'date' => 'required|date', 'description' => 'nullable|string']);
        $inv = DB::table('invoice')->where('id', $id)->first();
        abort_unless($inv, 404);
        $alreadyPaid = (float) DB::table('financerecord')->where('invoiceId', $id)->where('type', 'INCOME')->sum('amount');
        abort_if($alreadyPaid + (float) $d['amount'] > (float) $inv->amount, 422, 'Nominal pembayaran melebihi sisa tagihan.');
        [$type,$jobId] = $this->invoiceJob($inv);
        DB::transaction(function () use ($d, $id, $inv, $alreadyPaid, $type, $jobId) {
            $paymentSource = $type === 'quotation' ? [] : [$this->fk($type) => $jobId];
            DB::table('financerecord')->insert(['id' => 'FIN-'.Str::random(10), 'invoiceId' => $id, ...$paymentSource, 'type' => 'INCOME', 'amount' => $d['amount'], 'description' => $d['description'] ?? 'Pembayaran invoice', 'date' => $d['date'], 'createdAt' => now()]);
            $isPaid = $alreadyPaid + (float) $d['amount'] >= (float) $inv->amount;
            DB::table('invoice')->where('id', $id)->update(['status' => $isPaid ? 'Lunas' : 'DP Bayar', 'updatedAt' => now()]);
            $this->syncLinkedJobInvoiceStatus($inv, $isPaid ? 'Lunas' : 'DP Bayar');
        });

        return back()->with('success', 'Pembayaran dicatat.');
    }

    public function notify(string $id, NotificationGateway $notifications)
    {
        [$invoice, $job] = $this->notificationData($id);

        try {
            $sent = $notifications->notify('invoice', [
                'clientName' => $job->clientName,
                'clientEmail' => $job->clientEmail,
                'clientPhone' => $job->clientPhone,
                'number' => $invoice->invoiceNumber,
                'title' => $job->title,
                'total' => $invoice->amount,
                'dueDate' => $invoice->dueDate,
                'status' => $invoice->status,
                'url' => url('/print/invoice/'.$invoice->id),
            ]);
        } catch (ValidationException $exception) {
            return back()->withErrors($exception->errors());
        } catch (Throwable $exception) {
            return back()->withErrors(['notification' => $exception->getMessage()]);
        }

        return back()->with('success', 'Invoice berhasil dikirim melalui '.implode(' dan ', $sent).'.');
    }

    public function destroy(string $id)
    {
        $invoice = DB::table('invoice')->where('id', $id)->first();
        abort_unless($invoice, 404);
        [$type,$jobId] = $this->invoiceJob($invoice);
        DB::transaction(function () use ($id, $type, $jobId, $invoice) {
            DB::table('financerecord')->where('invoiceId', $id)->delete();
            DB::table('invoice')->where('id', $id)->delete();
            if ($type === 'quotation') {
                DB::table('quotation')->where('id', $jobId)->update(['status' => 'Dikirim', 'updatedAt' => now()]);
            } else {
                DB::table($type)->where('id', $jobId)->update(['invoiceStatus' => 'PENDING', 'updatedAt' => now()]);
            }
            $this->syncLinkedJobInvoiceStatus($invoice, 'Belum Bayar');
        });

        return redirect()->route('invoices.index')->with('success', 'Invoice dihapus.');
    }

    private function invoiceJob(object $invoice): array
    {
        if ($invoice->quotationId ?? null) {
            return ['quotation', $invoice->quotationId];
        }

        return $invoice->badanHukumId ? ['badan_hukum', $invoice->badanHukumId] : ($invoice->nonBadanHukumId ? ['non_badan_hukum', $invoice->nonBadanHukumId] : ['ppat', $invoice->ppatId]);
    }

    private function notificationData(string $id): array
    {
        $invoice = DB::table('invoice')->where('id', $id)->first();
        abort_unless($invoice, 404);
        [$type, $jobId] = $this->invoiceJob($invoice);
        $job = $this->sourceDocument($type, $jobId);
        abort_unless($job, 404);

        return [$invoice, $job];
    }

    private function sourceDocument(string $type, string $id): ?object
    {
        if ($type === 'quotation') {
            $quotation = DB::table('quotation as q')
                ->leftJoin('client as c', 'c.id', '=', 'q.clientId')
                ->select('q.id', 'q.clientId', 'q.subject as title', 'q.quotationNumber as trackingCode', 'q.clientName', 'q.clientPhone', 'q.clientEmail', 'q.clientAddress', 'c.name as legacyClientName', 'c.phone as legacyClientPhone', 'c.email as legacyClientEmail', 'c.address as legacyClientAddress')
                ->where('q.id', $id)
                ->first();
            if ($quotation) {
                $quotation->clientName = $quotation->clientName ?: $quotation->legacyClientName;
                $quotation->clientPhone = $quotation->clientPhone ?: $quotation->legacyClientPhone;
                $quotation->clientEmail = $quotation->clientEmail ?: $quotation->legacyClientEmail;
                $quotation->clientAddress = $quotation->clientAddress ?: $quotation->legacyClientAddress;
            }

            return $quotation;
        }

        return DB::table($type.' as j')
            ->leftJoin('client as c', 'c.id', '=', 'j.clientId')
            ->select('j.id', 'j.title', 'j.trackingCode', 'c.name as clientName', 'c.phone as clientPhone', 'c.email as clientEmail', 'c.address as clientAddress')
            ->where('j.id', $id)
            ->first();
    }

    private function fk(string $t): string
    {
        return $t === 'badan_hukum' ? 'badanHukumId' : ($t === 'non_badan_hukum' ? 'nonBadanHukumId' : 'ppatId');
    }

    private function itemsTotal(array $items): float
    {
        return round(collect($items)->sum(
            fn (array $item) => (float) $item['quantity'] * (float) $item['unitPrice']
        ), 2);
    }

    private function storeItems(string $invoiceId, array $items): void
    {
        $now = now();
        DB::table('invoice_item')->insert(array_map(
            fn (array $item, int $index) => [
                'id' => 'invi-'.Str::random(12),
                'invoiceId' => $invoiceId,
                'description' => $item['description'],
                'quantity' => $item['quantity'],
                'unit' => $item['unit'],
                'unitPrice' => $item['unitPrice'],
                'total' => round((float) $item['quantity'] * (float) $item['unitPrice'], 2),
                'sortOrder' => $index,
                'createdAt' => $now,
                'updatedAt' => $now,
            ],
            $items,
            array_keys($items)
        ));
    }

    private function syncLinkedJobInvoiceStatus(object $invoice, string $status): void
    {
        $invoiceStatus = match ($status) {
            'Lunas' => 'LUNAS',
            'DP Bayar' => 'DP',
            default => 'PENDING',
        };

        foreach ([
            'badanHukumId' => 'badan_hukum',
            'nonBadanHukumId' => 'non_badan_hukum',
            'ppatId' => 'ppat',
        ] as $foreignKey => $table) {
            if ($invoice->{$foreignKey} ?? null) {
                DB::table($table)->where('id', $invoice->{$foreignKey})->update([
                    'invoiceStatus' => $invoiceStatus,
                    'updatedAt' => now(),
                ]);
            }
        }
    }
}
