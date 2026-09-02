<?php

namespace App\Http\Controllers;

use App\Services\DocumentNumberService;
use App\Services\NotificationGateway;
use App\Services\QuotationPublisher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use RuntimeException;

class QuotationController extends Controller
{
    private const STATUSES = ['Draft', 'Dikirim', 'Disetujui', 'Ditolak', 'Kedaluwarsa', 'Dibatalkan', 'Invoice Terbuat'];

    public function __construct(private readonly DocumentNumberService $numbers) {}

    public function index(Request $request)
    {
        $search = trim((string) $request->query('search'));
        $status = (string) $request->query('status');
        $query = DB::table('quotation as q')
            ->leftJoin('client as c', 'c.id', '=', 'q.clientId')
            ->leftJoin('user as u', 'u.id', '=', 'q.picUserId')
            ->select('q.*', 'c.name as legacyClientName', 'u.fullName as picName')
            ->when($search, fn ($builder) => $builder->where(function ($filter) use ($search) {
                $filter->where('q.quotationNumber', 'like', "%{$search}%")
                    ->orWhere('q.subject', 'like', "%{$search}%")
                    ->orWhere('q.clientName', 'like', "%{$search}%")
                    ->orWhere('c.name', 'like', "%{$search}%")
                    ->orWhere('u.fullName', 'like', "%{$search}%");
            }))
            ->when(in_array($status, self::STATUSES, true), fn ($builder) => $builder->where('q.status', $status));

        return Inertia::render('Quotations/Index', [
            'quotations' => $query->orderByDesc('q.quotationDate')->orderByDesc('q.createdAt')->paginate(20)->withQueryString(),
            'search' => $search,
            'status' => $status,
            'stats' => [
                'total' => DB::table('quotation')->count(),
                'pending' => DB::table('quotation')->whereIn('status', ['Draft', 'Dikirim'])->count(),
                'approved' => DB::table('quotation')->whereIn('status', ['Disetujui', 'Invoice Terbuat'])->count(),
                'value' => DB::table('quotation')->whereIn('status', ['Disetujui', 'Invoice Terbuat'])->sum('grandTotal'),
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('Quotations/Form', $this->formData());
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);
        $id = DB::transaction(function () use ($data) {
            $id = 'quo-'.Str::lower(Str::random(16));
            $number = $this->numbers->next('quotation', $data['quotationDate']);
            $totals = $this->totals($data);
            DB::table('quotation')->insert([
                'id' => $id,
                'quotationNumber' => $number,
                ...$this->quotationPayload($data, $totals),
                'createdAt' => now(),
                'updatedAt' => now(),
            ]);
            $this->storeItems($id, $data['items']);

            return $id;
        });

        return redirect()->route('quotations.show', $id)->with('success', 'Quotation berhasil dibuat.');
    }

    public function show(string $id, NotificationGateway $notifications)
    {
        $quotation = $this->findQuotation($id);

        return Inertia::render('Quotations/Show', [
            'quotation' => $quotation,
            'items' => DB::table('quotation_item')->where('quotationId', $id)->orderBy('sortOrder')->get(),
            'publication' => DB::table('quotation_publications')->where('quotationId', $id)->first(),
            'notificationChannels' => $notifications->enabledChannels(),
            'convertedInvoice' => DB::table('invoice')->where('quotationId', $id)->first(),
        ]);
    }

    public function edit(string $id)
    {
        $quotation = $this->findQuotation($id);
        if ($quotation->status === 'Dibatalkan' || DB::table('invoice')->where('quotationId', $id)->exists()) {
            return redirect()
                ->route('quotations.show', $id)
                ->withErrors([
                    'quotation' => 'Quotation terkunci dan tidak dapat diedit karena sudah dibatalkan atau sudah menjadi Invoice.',
                ]);
        }

        return Inertia::render('Quotations/Form', [
            ...$this->formData(),
            'quotation' => $quotation,
            'items' => DB::table('quotation_item')->where('quotationId', $id)->orderBy('sortOrder')->get(),
        ]);
    }

    public function update(Request $request, string $id)
    {
        $quotation = DB::table('quotation')->where('id', $id)->first();
        abort_unless($quotation, 404);
        if ($quotation->status === 'Dibatalkan' || DB::table('invoice')->where('quotationId', $id)->exists()) {
            return redirect()
                ->route('quotations.show', $id)
                ->withErrors([
                    'quotation' => 'Quotation terkunci dan tidak dapat diedit karena sudah dibatalkan atau sudah menjadi Invoice.',
                ]);
        }

        $data = $this->validated($request);
        DB::transaction(function () use ($id, $data) {
            DB::table('quotation')->where('id', $id)->update([
                ...$this->quotationPayload($data, $this->totals($data)),
                'updatedAt' => now(),
            ]);
            DB::table('quotation_item')->where('quotationId', $id)->delete();
            $this->storeItems($id, $data['items']);
        });

        return redirect()->route('quotations.show', $id)->with('success', 'Quotation berhasil diperbarui.');
    }

    public function destroy(string $id)
    {
        abort_unless(DB::table('quotation')->where('id', $id)->exists(), 404);
        if (DB::table('invoice')->where('quotationId', $id)->exists()) {
            return back()->withErrors([
                'delete' => 'Quotation yang sudah menjadi Invoice tidak dapat dihapus.',
            ]);
        }
        DB::transaction(function () use ($id) {
            DB::table('quotation_item')->where('quotationId', $id)->delete();
            DB::table('quotation')->where('id', $id)->delete();
        });

        return redirect()->route('quotations.index')->with('success', 'Quotation berhasil dihapus.');
    }

    public function publish(Request $request, string $id, QuotationPublisher $publisher)
    {
        $quotation = $this->findQuotation($id);
        $data = $request->validate([
            'publishWithoutNotification' => 'required|boolean',
        ]);

        try {
            $message = $publisher->publish($quotation, $data['publishWithoutNotification']);
        } catch (RuntimeException $exception) {
            return back()->withErrors(['publish' => $exception->getMessage()]);
        }

        return back()->with('success', $message);
    }

    public function cancel(Request $request, string $id)
    {
        $quotation = DB::table('quotation')->where('id', $id)->first();
        abort_unless($quotation, 404);
        $data = $request->validate([
            'cancellationReason' => 'required|string|min:3|max:2000',
        ], [
            'cancellationReason.required' => 'Alasan pembatalan wajib diisi.',
            'cancellationReason.min' => 'Alasan pembatalan minimal 3 karakter.',
            'cancellationReason.max' => 'Alasan pembatalan maksimal 2.000 karakter.',
        ]);
        $published = DB::table('quotation_publications')
            ->where('quotationId', $id)
            ->whereNotNull('publishedAt')
            ->exists();
        abort_unless($published, 422, 'Quotation hanya dapat dibatalkan setelah diterbitkan.');

        if (DB::table('invoice')->where('quotationId', $id)->exists()) {
            return back()->withErrors([
                'cancelQuotation' => 'Quotation sudah dikonversi menjadi Invoice dan tidak dapat dibatalkan.',
            ]);
        }

        DB::table('quotation')->where('id', $id)->update([
            'status' => 'Dibatalkan',
            'cancellationReason' => trim($data['cancellationReason']),
            'cancelledAt' => now(),
            'updatedAt' => now(),
        ]);

        return back()->with('success', 'Quotation berhasil dibatalkan.');
    }

    public function print(string $id)
    {
        return Inertia::render('Print/Quotation', [
            'quotation' => $this->findQuotation($id),
            'items' => DB::table('quotation_item')->where('quotationId', $id)->orderBy('sortOrder')->get(),
        ]);
    }

    private function formData(): array
    {
        return [
            'quotation' => null,
            'items' => [],
            'clients' => DB::table('client')->select('id', 'name', 'phone', 'email', 'address')->orderBy('name')->get(),
            'staff' => DB::table('user')->select('id', 'fullName', 'role')->where('isActive', true)->whereIn('role', ['ADMINISTRATOR', 'PIMPINAN', 'STAFFADMIN'])->orderBy('fullName')->get(),
        ];
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'clientMode' => 'required|in:existing,new',
            'clientId' => 'required_if:clientMode,existing|nullable|string|exists:client,id',
            'clientName' => 'required_if:clientMode,new|nullable|string|max:191',
            'clientPhone' => 'nullable|string|max:191',
            'clientEmail' => 'nullable|email|max:191',
            'clientAddress' => 'nullable|string|max:2000',
            'picUserId' => 'required|string|exists:user,id',
            'subject' => 'required|string|max:191',
            'quotationDate' => 'required|date',
            'validUntil' => 'nullable|date|after_or_equal:quotationDate',
            'status' => 'required|in:'.implode(',', self::STATUSES),
            'discount' => 'nullable|numeric|min:0',
            'taxPercent' => 'nullable|numeric|min:0|max:100',
            'notes' => 'nullable|string',
            'terms' => 'nullable|string',
            'items' => 'required|array|min:1|max:100',
            'items.*.description' => 'required|string|max:1000',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit' => 'required|string|max:50',
            'items.*.unitPrice' => 'required|numeric|min:0',
        ]);
    }

    private function totals(array $data): array
    {
        $subtotal = collect($data['items'])->sum(fn ($item) => round((float) $item['quantity'] * (float) $item['unitPrice'], 2));
        $discount = min((float) ($data['discount'] ?? 0), $subtotal);
        $taxable = max(0, $subtotal - $discount);
        $taxAmount = round($taxable * ((float) ($data['taxPercent'] ?? 0) / 100), 2);

        return compact('subtotal', 'discount', 'taxAmount') + ['grandTotal' => $taxable + $taxAmount];
    }

    private function quotationPayload(array $data, array $totals): array
    {
        $client = $data['clientMode'] === 'existing'
            ? DB::table('client')->where('id', $data['clientId'])->first()
            : null;

        return [
            'clientId' => $client?->id,
            'clientName' => $client?->name ?? $data['clientName'],
            'clientPhone' => $client?->phone ?? ($data['clientPhone'] ?? null),
            'clientEmail' => $client?->email ?? ($data['clientEmail'] ?? null),
            'clientAddress' => $client?->address ?? ($data['clientAddress'] ?? null),
            'picUserId' => $data['picUserId'],
            'subject' => $data['subject'],
            'quotationDate' => $data['quotationDate'],
            'validUntil' => $data['validUntil'] ?? null,
            'status' => $data['status'],
            'subtotal' => $totals['subtotal'],
            'discount' => $totals['discount'],
            'taxPercent' => (float) ($data['taxPercent'] ?? 0),
            'taxAmount' => $totals['taxAmount'],
            'grandTotal' => $totals['grandTotal'],
            'notes' => $data['notes'] ?? null,
            'terms' => $data['terms'] ?? null,
        ];
    }

    private function storeItems(string $quotationId, array $items): void
    {
        $now = now();
        DB::table('quotation_item')->insert(collect($items)->values()->map(fn ($item, $index) => [
            'id' => 'qitem-'.Str::lower(Str::random(16)),
            'quotationId' => $quotationId,
            'description' => $item['description'],
            'quantity' => $item['quantity'],
            'unit' => $item['unit'],
            'unitPrice' => $item['unitPrice'],
            'total' => round((float) $item['quantity'] * (float) $item['unitPrice'], 2),
            'sortOrder' => $index,
            'createdAt' => $now,
            'updatedAt' => $now,
        ])->all());
    }

    private function findQuotation(string $id): object
    {
        $quotation = DB::table('quotation as q')
            ->leftJoin('client as c', 'c.id', '=', 'q.clientId')
            ->leftJoin('user as u', 'u.id', '=', 'q.picUserId')
            ->select('q.*', 'c.name as legacyClientName', 'c.phone as legacyClientPhone', 'c.email as legacyClientEmail', 'c.address as legacyClientAddress', 'u.fullName as picName', 'u.phone as picPhone', 'u.email as picEmail')
            ->where('q.id', $id)->first();
        abort_unless($quotation, 404);

        $quotation->clientName = $quotation->clientName ?: $quotation->legacyClientName;
        $quotation->clientPhone = $quotation->clientPhone ?: $quotation->legacyClientPhone;
        $quotation->clientEmail = $quotation->clientEmail ?: $quotation->legacyClientEmail;
        $quotation->clientAddress = $quotation->clientAddress ?: $quotation->legacyClientAddress;

        return $quotation;
    }
}
