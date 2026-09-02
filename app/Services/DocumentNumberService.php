<?php

namespace App\Services;

use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DocumentNumberService
{
    private const SETTINGS_KEY = 'GLOBAL_APP_SETTINGS';

    private const TYPES = [
        'quotation' => ['prefix' => 'QUO', 'sequence' => 'QUOTATION'],
        'invoice' => ['prefix' => 'INV', 'sequence' => 'INVOICE'],
        'badan_hukum' => ['prefix' => 'BHM', 'sequence' => 'Badan Hukum/Usaha'],
        'non_badan_hukum' => ['prefix' => 'NBH', 'sequence' => 'Non Badan Hukum'],
        'ppat' => ['prefix' => 'PPAT', 'sequence' => 'PPAT'],
    ];

    public function next(string $type, CarbonInterface|string|null $documentDate = null): string
    {
        abort_unless(isset(self::TYPES[$type]), 500, 'Jenis nomor dokumen tidak dikenal.');

        $date = $documentDate instanceof CarbonInterface
            ? $documentDate
            : Carbon::parse($documentDate ?: now());
        $definition = self::TYPES[$type];
        $year = (int) $date->format('Y');
        $sequence = DB::table('sequence')
            ->where(['category' => $definition['sequence'], 'year' => $year])
            ->lockForUpdate()
            ->first();
        $number = $sequence ? (int) $sequence->lastNum + 1 : 1;

        if ($sequence) {
            DB::table('sequence')->where('id', $sequence->id)->update([
                'lastNum' => $number,
                'updatedAt' => now(),
            ]);
        } else {
            DB::table('sequence')->insert([
                'id' => 'seq-'.Str::lower(Str::random(12)),
                'category' => $definition['sequence'],
                'year' => $year,
                'lastNum' => 1,
                'updatedAt' => now(),
            ]);
        }

        return sprintf(
            '%s/%s/%04d',
            $this->prefixes()[$type],
            $date->format('dmY'),
            $number,
        );
    }

    public function prefixes(): array
    {
        $defaults = collect(self::TYPES)
            ->mapWithKeys(fn (array $definition, string $type) => [$type => $definition['prefix']])
            ->all();
        $row = DB::table('app_settings')->where('settings_key', self::SETTINGS_KEY)->first();
        $settings = $row ? json_decode($row->settings_value, true) : [];
        $configured = is_array($settings['documentNumbers'] ?? null)
            ? $settings['documentNumbers']
            : [];

        return collect($defaults)->mapWithKeys(function (string $default, string $type) use ($configured) {
            $prefix = strtoupper(trim((string) ($configured[$type] ?? $default)));

            return [$type => preg_match('/^[A-Z]+$/', $prefix) ? $prefix : $default];
        })->all();
    }
}
