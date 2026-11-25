<?php
namespace Tests\Unit;
use App\Services\KpiCalculationService;
use PHPUnit\Framework\TestCase;
class KpiCalculationServiceTest extends TestCase {
 public function test_score_uses_known_tasks_and_requires_all_components(): void {
  $service = new KpiCalculationService();
  $tasks = collect([(object)['workStatus'=>'SELESAI','targetDate'=>'2026-01-03','completedAt'=>'2026-01-03 12:00:00'], (object)['workStatus'=>'PROSES','targetDate'=>null,'completedAt'=>null], (object)['workStatus'=>null,'targetDate'=>null,'completedAt'=>null], (object)['workStatus'=>'CANCELLED','targetDate'=>null,'completedAt'=>null]]);
  $result = $service->calculate($tasks, ['workingDays'=>20,'presentDays'=>10,'lateDays'=>2]);
  $this->assertSame(74.0, $result['score']); $this->assertSame(1, $result['unknownTasks']);
  $this->assertNull($service->calculate($tasks, ['workingDays'=>null,'presentDays'=>0,'lateDays'=>0])['score']);
 }
}
