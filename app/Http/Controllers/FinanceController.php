<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class FinanceController extends Controller
{
    public function index(Request $request)
    {
        $from = $request->query('from', now()->startOfMonth()->toDateString());
        $to = $request->query('to', now()->toDateString());
        $entryTypeFilter = $request->query('entryType', 'ALL');

        $income = (float) DB::table('financerecord')
            ->where('type', 'INCOME')
            ->whereBetween('date', [$from, $to.' 23:59:59'])
            ->sum('amount');

        $expense = (float) DB::table('expense')
            ->whereBetween('expenseDate', [$from, $to.' 23:59:59'])
            ->sum('amount');

        $monthStart = now()->subMonths(5)->startOfMonth();

        $incomeByMonth = DB::table('financerecord')
            ->where('type', 'INCOME')
            ->where('date', '>=', $monthStart)
            ->selectRaw("DATE_FORMAT(date, '%Y-%m') month_key, SUM(amount) total")
            ->groupBy('month_key')
            ->pluck('total', 'month_key');

        $expenseByMonth = DB::table('expense')
            ->where('expenseDate', '>=', $monthStart)
            ->selectRaw("DATE_FORMAT(expenseDate, '%Y-%m') month_key, SUM(amount) total")
            ->groupBy('month_key')
            ->pluck('total', 'month_key');

        $months = collect(range(5, 0))->map(function ($offset) use ($incomeByMonth, $expenseByMonth) {
            $date = now()->subMonths($offset);
            $key = $date->format('Y-m');

            return [
                'key' => $key,
                'label' => $date->translatedFormat('M'),
                'income' => (float) ($incomeByMonth[$key] ?? 0),
                'expense' => (float) ($expenseByMonth[$key] ?? 0),
            ];
        });

        // Construct Cash Journal Queries (Uang Masuk & Uang Keluar)
        $incomesQuery = DB::table('financerecord')
            ->where('type', 'INCOME')
            ->whereBetween('date', [$from, $to.' 23:59:59'])
            ->select(
                'id',
                DB::raw("'INCOME' as entryType"),
                DB::raw("COALESCE(description, 'Pemasukan Invoice / Manual') as category"),
                'amount',
                'description',
                DB::raw("DATE_FORMAT(date, '%Y-%m-%d') as entryDate"),
                'createdAt'
            );

        $expensesQuery = DB::table('expense')
            ->whereBetween('expenseDate', [$from, $to.' 23:59:59'])
            ->select(
                'id',
                DB::raw("'EXPENSE' as entryType"),
                'category',
                'amount',
                'description',
                DB::raw("DATE_FORMAT(expenseDate, '%Y-%m-%d') as entryDate"),
                'createdAt'
            );

        if ($entryTypeFilter === 'INCOME') {
            $journalQuery = $incomesQuery;
        } elseif ($entryTypeFilter === 'EXPENSE') {
            $journalQuery = $expensesQuery;
        } else {
            $journalQuery = $incomesQuery->unionAll($expensesQuery);
        }

        $journal = DB::query()
            ->fromSub($journalQuery, 'jurnal')
            ->orderByDesc('entryDate')
            ->orderByDesc('createdAt')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Finance/Index', [
            'income' => $income,
            'expense' => $expense,
            'balance' => $income - $expense,
            'months' => $months,
            'journal' => $journal,
            'from' => $from,
            'to' => $to,
            'entryTypeFilter' => $entryTypeFilter,
        ]);
    }

    public function storeIncome(Request $request)
    {
        $data = $request->validate([
            'category' => 'nullable|string|max:255',
            'amount' => 'required|numeric|min:1',
            'date' => 'required|date',
            'description' => 'nullable|string',
        ]);

        DB::table('financerecord')->insert([
            'id' => 'FIN-'.Str::lower(Str::random(10)),
            'type' => 'INCOME',
            'amount' => (float) $data['amount'],
            'description' => $data['description'] ?: ($data['category'] ?? 'Pemasukan Manual'),
            'date' => $data['date'],
            'createdAt' => now(),
        ]);

        return back()->with('success', 'Catatan Uang Masuk berhasil disimpan.');
    }

    public function storeExpense(Request $request)
    {
        $data = $request->validate([
            'category' => 'required|string|max:255',
            'amount' => 'required|numeric|min:1',
            'expenseDate' => 'required|date',
            'description' => 'nullable|string',
        ]);

        DB::table('expense')->insert([
            'id' => 'EXP-'.Str::lower(Str::random(12)),
            'category' => $data['category'],
            'amount' => (float) $data['amount'],
            'description' => $data['description'] ?? null,
            'expenseDate' => $data['expenseDate'],
            'createdAt' => now(),
        ]);

        return back()->with('success', 'Catatan Uang Keluar berhasil disimpan.');
    }

    public function destroy(Request $request, string $type, string $id)
    {
        if (strtoupper($type) === 'INCOME') {
            DB::table('financerecord')->where('id', $id)->delete();
        } else {
            DB::table('expense')->where('id', $id)->delete();
        }

        return back()->with('success', 'Catatan transaksi berhasil dihapus.');
    }
}
