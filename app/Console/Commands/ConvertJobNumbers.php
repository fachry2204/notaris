<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ConvertJobNumbers extends Command
{
    protected $signature = 'documents:convert-job-numbers {--apply : Simpan perubahan setelah hasil diperiksa}';

    protected $description = 'Tinjau atau ubah nomor berkas lama yang menggunakan format otomatis';

    public function handle(): int
    {
        return DB::transaction(function () {
            $changes = [];
            $problems = [];
            $skipped = [];
            $targets = [];
            $months = [1 => 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
            foreach (['badan_hukum', 'non_badan_hukum', 'ppat'] as $table) {
                $records = DB::table($table)->select('id', 'trackingCode', 'createdAt')->lockForUpdate()->get();
                foreach ($records as $record) {
                    $old = (string) $record->trackingCode;
                    $target = $old;
                    if (preg_match('/^([A-Za-z]+)\/(\d{8})\/(\d+)$/', $old, $match) || preg_match('/^([A-Za-z]+)-(\d{4})-(\d+)$/', $old, $match)) {
                        $date = substr((string) $record->createdAt, 0, 10);
                        if (! preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $date, $parts) || ! checkdate((int) $parts[2], (int) $parts[3], (int) $parts[1])) {
                            $problems[] = "$table $old: tanggal berkas tidak valid";
                            continue;
                        }
                        if (strlen($match[2]) === 4 && $match[2] !== $parts[1]) {
                            $problems[] = "$table $old: tahun nomor berbeda dari tanggal berkas $date";
                            continue;
                        }
                        if (strlen($match[2]) === 8 && $match[2] !== $parts[3].$parts[2].$parts[1]) {
                            $problems[] = "$table $old: tanggal nomor berbeda dari tanggal berkas $date";
                            continue;
                        }
                        $target = sprintf('%04d/%s/%s/%s', (int) $match[3], strtoupper($match[1]), $months[(int) $parts[2]], $parts[1]);
                        $changes[] = [$table, $record->id, $old, $target];
                    } elseif (! preg_match('/^\d+\/[A-Za-z]+\/(I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII)\/\d{4}$/', $old)) {
                        $skipped[] = "$table: $old";
                    }
                    $key = strtolower($target);
                    if (isset($targets[$key])) { $problems[] = "Nomor tujuan duplikat $target ($table dan {$targets[$key]})"; }
                    $targets[$key] = $table;
                }
            }
            $this->table(['Jenis', 'ID', 'Nomor lama', 'Nomor baru'], $changes);
            foreach ($skipped as $number) { $this->warn("Dilewati, nomor manual atau format tidak dikenal: $number"); }
            if ($problems) {
                foreach ($problems as $problem) { $this->error($problem); }
                $this->error('Tidak ada nomor yang diubah.');
                return self::FAILURE;
            }
            if (! $this->option('apply')) {
                $this->info('Pratinjau saja; tidak ada data yang diubah.');
                return self::SUCCESS;
            }
            foreach ($changes as [$table, $id, $old, $target]) {
                DB::table($table)->where('id', $id)->where('trackingCode', $old)->update(['trackingCode' => $target]);
            }
            $this->info(count($changes).' nomor berkas diperbarui.');
            return self::SUCCESS;
        });
    }
}
