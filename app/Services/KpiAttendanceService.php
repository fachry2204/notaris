<?php

namespace App\Services;

use Carbon\Carbon;

class KpiAttendanceService
{
    public function startTime(): string
    {
        $settings = app(AttendanceSettingsService::class)->read();
        $time = $settings['start_time'] ?? '08:00';
        return is_string($time) && preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/', $time) ? $time : '08:00';
    }

    public function enrich(object $record, string $startTime, int $approvedOvertime = 0): object
    {
        $parse = function ($value) use ($record) {
            if (! $value) return null;
            try {
                return Carbon::parse(preg_match('/^\d{2}:\d{2}/', (string) $value) ? substr($record->date, 0, 10).' '.$value : $value);
            } catch (\Throwable) { return null; }
        };
        $in = $parse($record->checkIn);
        $out = $parse($record->checkOut);
        $scheduled = Carbon::parse(substr($record->date, 0, 10).' '.$startTime);
        $record->lateMinutes = $in ? max(0, (int) floor($scheduled->diffInMinutes($in, false))) : null;
        $record->workMinutes = $in && $out && $out->gte($in) ? (int) floor($in->diffInMinutes($out)) : null;
        $record->invalidInterval = $in && $out && $out->lt($in);
        $record->overtimeMinutes = $approvedOvertime;
        return $record;
    }
}
