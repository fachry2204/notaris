<?php

namespace Tests\Unit;

use App\Services\AttendanceSettingsService;
use PHPUnit\Framework\TestCase;

class OfficeDistanceTest extends TestCase
{
    public function test_radius_calculation_handles_points_just_inside_and_outside_ten_meters(): void
    {
        $service=new AttendanceSettingsService;
        $this->assertSame(0.0,$service->distance(-6.2,106.8,-6.2,106.8));
        $this->assertLessThan(10,$service->distance(0,0,rad2deg(9.99/6371000),0));
        $this->assertGreaterThan(10,$service->distance(0,0,rad2deg(10.01/6371000),0));
        $this->assertNull($service->officeDistance(['office_latitude'=>null,'office_longitude'=>null],0,0));
    }
}
