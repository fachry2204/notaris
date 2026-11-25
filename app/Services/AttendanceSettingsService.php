<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class AttendanceSettingsService
{
    public const KEY = 'ATTENDANCE_SETTINGS';

    public function read(): array
    {
        $legacy = json_decode(DB::table('app_settings')->where('settings_key', 'PAYROLL_SETTINGS')->value('settings_value') ?: '{}', true);
        $saved = json_decode(DB::table('app_settings')->where('settings_key', self::KEY)->value('settings_value') ?: '{}', true);
        return array_replace(['start_time'=>'08:00','end_time'=>null,'grace_minutes'=>0,'annual_leave_days'=>12,'office_latitude'=>null,'office_longitude'=>null,'office_radius_meters'=>10],
            array_intersect_key(is_array($legacy) ? $legacy : [], array_flip(['start_time','end_time','grace_minutes'])), is_array($saved) ? $saved : []);
    }

    public function lateThresholdSeconds(): int
    {
        $settings = $this->read();
        [$h,$m] = array_map('intval', explode(':', $settings['start_time']));
        return $h*3600 + $m*60 + (int) $settings['grace_minutes']*60;
    }

    public function distance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $a = sin(deg2rad($lat2-$lat1)/2)**2 + cos(deg2rad($lat1))*cos(deg2rad($lat2))*sin(deg2rad($lon2-$lon1)/2)**2;
        return 6371000 * 2 * asin(sqrt(max(0,min(1,$a))));
    }

    public function officeDistance(array $settings, float $latitude, float $longitude): ?float
    {
        if ($settings['office_latitude'] === null || $settings['office_longitude'] === null) return null;
        return $this->distance((float) $settings['office_latitude'], (float) $settings['office_longitude'], $latitude, $longitude);
    }
}
