<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ConvertDocumentNumbers extends Command
{
    protected $signature = 'documents:convert-numbers {--apply : Simpan perubahan setelah hasil diperiksa}';

    protected $description = 'Tinjau atau ubah nomor invoice dan quotation format lama';

    public function handle(): int
    {
        $apply = (bool) $this->option('apply');
        return DB::transaction(function () use ($apply) {
            $changes = [];
            $problems = [];
            $months = [1 => 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
            foreach (['invoice' => ['invoiceNumber', 'date'], 'quotation' => ['quotationNumber', 'quotationDate']] as $table => [$column, $dateColumn]) {
                $records = DB::table($table)->select('id', $column, $dateColumn)->lockForUpdate()->get();
                $targets = [];
                foreach ($records as $record) {
                    $old = (string) $record->{$column};
                    $target = $old;
                    if (preg_match('/^([A-Za-z]+)\/(\d{8})\/(\d+)$/', $old, $match)) {
                        $date = substr((string) $record->{$dateColumn}, 0, 10);
                        if (! preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $date, $parts) || ! checkdate((int) $parts[2], (int) $parts[3], (int) $parts[1])) {
                            $problems[] = "$table $old: tanggal tidak valid";
                            continue;
                        }
                        $target = sprintf('%04d/%s/%s/%s', (int) $match[3], strtoupper($match[1]), $months[(int) $parts[2]], $parts[1]);
                        $changes[] = [$table, $record->id, $old, $target, $column];
                    } elseif (! preg_match('/^\d+\/[A-Za-z]+\/(I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII)\/\d{4}$/', $old)) {
                        $problems[] = "$table $old: format tidak dikenal";
                    }
                    $key = strtolower($target);
                    if (isset($targets[$key])) {
                        $problems[] = "$table: nomor tujuan duplikat $target";
                    }
                    $targets[$key] = true;
                }
            }
            $this->table(['Jenis', 'ID', 'Nomor lama', 'Nomor baru'], array_map(fn ($change) => array_slice($change, 0, 4), $changes));
            if ($problems) {
                foreach ($problems as $problem) { $this->error($problem); }
                $this->error('Tidak ada nomor yang diubah.');
                return self::FAILURE;
            }
            if (! $apply) {
                $this->info('Pratinjau saja; tidak ada data yang diubah.');
                return self::SUCCESS;
            }
            foreach ($changes as [$table, $id, $old, $target, $column]) {
                DB::table($table)->where('id', $id)->where($column, $old)->update([$column => $target]);
            }
            $this->info(count($changes).' nomor diperbarui.');
            return self::SUCCESS;
        });
    }
}
