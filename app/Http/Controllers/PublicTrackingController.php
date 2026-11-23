<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class PublicTrackingController extends Controller
{
    private const JOB_TABLES = [
        'badan_hukum' => 'Badan Hukum / Usaha',
        'non_badan_hukum' => 'Non Badan Hukum',
        'ppat' => 'PPAT',
    ];

    public function index()
    {
        return Inertia::render('Public/Tracking', [
            'results' => [],
            'searched' => false,
            'query' => '',
        ]);
    }

    public function search(Request $request)
    {
        $query = trim($request->validate([
            'query' => ['required', 'string', 'max:255'],
        ])['query']);
        $matchingClientIds = $this->matchingClientIds($query);
        $results = collect();

        foreach (self::JOB_TABLES as $table => $category) {
            $jobs = DB::table($table.' as job')
                ->leftJoin('client as client', 'client.id', '=', 'job.clientId')
                ->select([
                    'job.id',
                    'job.trackingCode',
                    'job.title',
                    'job.type',
                    'job.pengurusanUntuk',
                    'job.status',
                    'job.deadline',
                    'job.createdAt',
                    'client.name as clientName',
                ])
                ->where(function ($builder) use ($query, $matchingClientIds) {
                    $builder->where('job.trackingCode', $query);
                    if ($matchingClientIds->isNotEmpty()) {
                        $builder->orWhereIn('job.clientId', $matchingClientIds);
                    }
                })
                ->orderByDesc('job.createdAt')
                ->limit(20)
                ->get();

            $foreignKey = $this->foreignKey($table);
            foreach ($jobs as $job) {
                $progress = DB::table('jobprogress')
                    ->where($foreignKey, $job->id)
                    ->select('statusBefore', 'statusAfter', 'description', 'createdAt')
                    ->orderBy('createdAt')
                    ->get();
                if ($progress->isEmpty()) {
                    $progress->push((object) [
                        'statusBefore' => $job->status,
                        'statusAfter' => $job->status,
                        'createdAt' => $job->createdAt,
                    ]);
                }

                $results->push([
                    'job' => [
                        ...(array) $job,
                        'clientName' => $this->maskedName($job->clientName),
                        'category' => $category,
                    ],
                    'progress' => $progress,
                ]);
            }
        }

        return Inertia::render('Public/Tracking', [
            'results' => $results->sortByDesc(fn ($result) => $result['job']['createdAt'])->values(),
            'searched' => true,
            'query' => $query,
            'error' => $results->isEmpty()
                ? 'Berkas tidak ditemukan. Periksa kembali nomor berkas, nomor HP, atau email Anda.'
                : null,
        ]);
    }

    private function matchingClientIds(string $query)
    {
        $lowerQuery = Str::lower($query);
        $phoneQuery = preg_replace('/\D+/', '', $query);

        return DB::table('client')
            ->select('id', 'email', 'phone')
            ->get()
            ->filter(function ($client) use ($lowerQuery, $phoneQuery) {
                $emailMatches = $client->email && Str::lower(trim((string) $client->email)) === $lowerQuery;
                $storedPhone = preg_replace('/\D+/', '', (string) $client->phone);
                $phoneMatches = strlen($phoneQuery) >= 7 && $storedPhone !== '' && $storedPhone === $phoneQuery;

                return $emailMatches || $phoneMatches;
            })
            ->pluck('id')
            ->values();
    }

    private function maskedName(?string $name): string
    {
        if (! $name) {
            return 'Client';
        }

        return collect(preg_split('/\s+/', trim($name)))
            ->filter()
            ->map(function ($part) {
                $first = Str::substr($part, 0, 1);

                return $first.Str::repeat('•', max(2, Str::length($part) - 1));
            })
            ->join(' ');
    }

    private function foreignKey(string $table): string
    {
        return match ($table) {
            'badan_hukum' => 'badanHukumId',
            'non_badan_hukum' => 'nonBadanHukumId',
            default => 'ppatId',
        };
    }
}
