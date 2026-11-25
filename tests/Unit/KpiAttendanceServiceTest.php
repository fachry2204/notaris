<?php

namespace Tests\Unit;

use App\Services\KpiAttendanceService;
use PHPUnit\Framework\TestCase;

class KpiAttendanceServiceTest extends TestCase
{
    public function test_durations_use_actual_timestamps_and_only_explicit_approved_overtime(): void
    {
        $service = new KpiAttendanceService;
        $row = $service->enrich((object) ['date' => '2026-11-02', 'checkIn' => '2026-11-02 08:15:59', 'checkOut' => '2026-11-02 19:30:59'], '08:00', 90);
        $this->assertSame(675, $row->workMinutes);
        $this->assertSame(15, $row->lateMinutes);
        $this->assertSame(90, $row->overtimeMinutes);
        $row = $service->enrich((object) ['date' => '2026-11-02', 'checkIn' => '07:45:00', 'checkOut' => '20:00:00'], '08:00');
        $this->assertSame(735, $row->workMinutes);
        $this->assertSame(0, $row->lateMinutes);
        $this->assertSame(0, $row->overtimeMinutes);
    }

    public function test_incomplete_invalid_and_overnight_records_are_handled_without_inventing_hours(): void
    {
        $service = new KpiAttendanceService;
        $row = $service->enrich((object) ['date' => '2026-11-02', 'checkIn' => '09:10:00', 'checkOut' => null], '09:00');
        $this->assertNull($row->workMinutes);
        $this->assertSame(10, $row->lateMinutes);
        $row = $service->enrich((object) ['date' => '2026-11-02', 'checkIn' => '09:00:00', 'checkOut' => '08:00:00'], '09:00');
        $this->assertNull($row->workMinutes);
        $this->assertTrue($row->invalidInterval);
        $row = $service->enrich((object) ['date' => '2026-11-02', 'checkIn' => '2026-11-02 22:00:00', 'checkOut' => '2026-11-03 02:00:00'], '08:00');
        $this->assertSame(240, $row->workMinutes);
    }
}
