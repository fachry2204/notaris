<?php

use Carbon\CarbonImmutable;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Data absensi lama disimpan sebagai waktu UTC tanpa informasi zona waktu.
     * Ubah sekali ke waktu kantor agar konsisten dengan konfigurasi Asia/Jakarta.
     */
    public function up(): void
    {
        $this->convert('UTC', 'Asia/Jakarta');
    }

    public function down(): void
    {
        $this->convert('Asia/Jakarta', 'UTC');
    }

    private function convert(string $sourceTimezone, string $targetTimezone): void
    {
        if (! Schema::hasTable('attendance')) {
            return;
        }

        DB::table('attendance')
            ->select('id', 'date', 'checkIn', 'checkOut', 'createdAt', 'updatedAt')
            ->orderBy('id')
            ->chunk(500, function ($records) use ($sourceTimezone, $targetTimezone) {
                foreach ($records as $record) {
                    $updates = [];

                    foreach (['date', 'checkIn', 'checkOut', 'createdAt', 'updatedAt'] as $column) {
                        if ($record->{$column}) {
                            $updates[$column] = CarbonImmutable::parse(
                                $record->{$column},
                                $sourceTimezone,
                            )->setTimezone($targetTimezone)->format('Y-m-d H:i:s');
                        }
                    }

                    if ($updates !== []) {
                        DB::table('attendance')->where('id', $record->id)->update($updates);
                    }
                }
            });
    }
};
