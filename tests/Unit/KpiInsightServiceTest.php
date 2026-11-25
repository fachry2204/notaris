<?php

namespace Tests\Unit;

use App\Services\KpiInsightService;
use PHPUnit\Framework\TestCase;

class KpiInsightServiceTest extends TestCase
{
    public function test_insights_use_actual_metrics_and_identify_overdue_work(): void
    {
        $employee = $this->employee(['totalJobs' => 4, 'completed' => 2, 'processing' => 1, 'cancelled' => 1, 'overdue' => 1, 'totalTasks' => 3, 'picTasks' => 2, 'witnessTasks' => 1, 'workingDays' => 5, 'presentDays' => 4, 'lateDays' => 1, 'absentDays' => 1]);
        $insights = (new KpiInsightService)->generate($employee);

        $this->assertStringContainsString('Tingkat penyelesaian 67%', $insights[0]);
        $this->assertStringContainsString('Tinjau prioritas', $insights[1]);
        $this->assertStringContainsString('ketepatan waktu 75%', $insights[3]);
        $this->assertStringContainsString('bukan penilaian otomatis', end($insights));
    }

    public function test_insights_handle_missing_attendance_and_empty_work(): void
    {
        $insights = (new KpiInsightService)->generate($this->employee());

        $this->assertStringContainsString('Tingkat penyelesaian Tidak tersedia', $insights[0]);
        $this->assertStringContainsString('Data kehadiran tidak tersedia', $insights[3]);
    }

    private function employee(array $overrides = []): array
    {
        return array_replace([
            'totalJobs' => 0, 'completed' => 0, 'processing' => 0, 'cancelled' => 0,
            'overdue' => 0, 'totalTasks' => 0, 'picTasks' => 0, 'witnessTasks' => 0,
            'workingDays' => null, 'presentDays' => 0, 'lateDays' => 0, 'absentDays' => null,
        ], $overrides);
    }
}
