<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ClientController extends Controller
{
    public function create(Request $request)
    {
        $invoiceId = (string) $request->query('invoice');
        if (! $invoiceId) {
            return Inertia::render('Clients/Form', ['client' => null, 'prefill' => null, 'sourceInvoiceId' => null]);
        }

        $source = DB::table('invoice as i')
            ->join('quotation as q', 'q.id', '=', 'i.quotationId')
            ->select('i.id as invoiceId', 'q.id as quotationId', 'q.clientId', 'q.clientName', 'q.clientPhone', 'q.clientEmail', 'q.clientAddress')
            ->where('i.id', $invoiceId)
            ->first();
        abort_unless($source, 404);
        if ($source->clientId && DB::table('client')->where('id', $source->clientId)->exists()) {
            return redirect()->route('invoices.show', $invoiceId);
        }

        return Inertia::render('Clients/Form', [
            'client' => null,
            'prefill' => [
                'name' => $source->clientName,
                'phone' => $source->clientPhone,
                'email' => $source->clientEmail,
                'address' => $source->clientAddress,
            ],
            'sourceInvoiceId' => $invoiceId,
        ]);
    }

    public function index(Request $request)
    {
        $search = trim((string) $request->query('search'));
        $clients = DB::table('client')->when($search, fn ($q) => $q->where(fn ($q) => $q
            ->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%")->orWhere('phone', 'like', "%{$search}%")))
            ->orderBy('name')->paginate(20)->withQueryString();
        $stats = [
            'total' => DB::table('client')->count(),
            'individual' => DB::table('client')->where('type', 'individual')->count(),
            'corporate' => DB::table('client')->where('type', 'corporate')->count(),
        ];

        return Inertia::render('Clients/Index', compact('clients', 'search', 'stats'));
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);
        $sourceInvoiceId = $data['sourceInvoiceId'] ?? null;
        unset($data['sourceInvoiceId']);
        $next = ((int) DB::table('client')->max('indexNo')) + 1;
        $clientId = 'client-'.Str::lower(Str::random(12));
        DB::transaction(function () use ($data, $next, $clientId, $sourceInvoiceId) {
            DB::table('client')->insert([...$data, 'indexNo' => $next, 'id' => $clientId, 'createdAt' => now(), 'updatedAt' => now()]);
            if ($sourceInvoiceId) {
                $quotationId = DB::table('invoice')->where('id', $sourceInvoiceId)->value('quotationId');
                abort_unless($quotationId, 422, 'Invoice bukan berasal dari Quotation.');
                DB::table('quotation')->where('id', $quotationId)->update([
                    'clientId' => $clientId,
                    'updatedAt' => now(),
                ]);
            }
        });
        if ($sourceInvoiceId) {
            return redirect()->route('invoices.show', $sourceInvoiceId)->with('success', 'Data client berhasil di-upload. Silakan lanjutkan membuat berkas.');
        }

        return redirect()->route('clients.index')->with('success', 'Client berhasil ditambahkan.');
    }

    public function show(string $id)
    {
        $client = DB::table('client')->where('id', $id)->first();
        abort_unless($client, 404);
        $jobs = collect(['badan_hukum', 'non_badan_hukum', 'ppat'])->flatMap(fn ($table) => DB::table($table)->where('clientId', $id)->select('id', 'trackingCode', 'title', 'status', 'createdAt')->get()->map(fn ($job) => [...(array) $job, 'jobType' => $table]))->sortByDesc('createdAt')->values();

        return Inertia::render('Clients/Show', compact('client', 'jobs'));
    }

    public function edit(string $id)
    {
        $client = DB::table('client')->where('id', $id)->first();
        abort_unless($client, 404);

        return Inertia::render('Clients/Form', compact('client'));
    }

    public function update(Request $request, string $id)
    {
        $data = $this->validated($request);
        unset($data['sourceInvoiceId']);
        DB::table('client')->where('id', $id)->update([...$data, 'updatedAt' => now()]);

        return redirect()->route('clients.show', $id)->with('success', 'Client berhasil diperbarui.');
    }

    public function destroy(string $id)
    {
        foreach (['badan_hukum', 'non_badan_hukum', 'ppat'] as $table) {
            if (DB::table($table)->where('clientId', $id)->exists()) {
                return back()->withErrors(['client' => 'Client tidak dapat dihapus karena masih memiliki berkas.']);
            }
        }
        DB::table('client')->where('id', $id)->delete();

        return back()->with('success', 'Client berhasil dihapus.');
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => 'required|string|max:255', 'email' => 'nullable|email|max:255', 'phone' => 'nullable|string|max:255',
            'type' => 'required|in:individual,corporate', 'address' => 'nullable|string', 'country' => 'nullable|string|max:100',
            'province' => 'nullable|string|max:100', 'city' => 'nullable|string|max:100', 'district' => 'nullable|string|max:100',
            'village' => 'nullable|string|max:100', 'gender' => 'nullable|string|max:30', 'citizenship' => 'nullable|string|max:30',
            'picName' => 'nullable|string|max:255', 'npwp' => 'nullable|string|max:100', 'birthday' => 'nullable|date',
            'sourceInvoiceId' => 'nullable|string|exists:invoice,id',
        ]);
    }
}
