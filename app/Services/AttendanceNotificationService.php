<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AttendanceNotificationService
{
    public function __construct(private readonly NotificationGateway $gateway) {}

    public function send(string $userId, string $action, array $evidence): string
    {
        try {
            if (!$this->gateway->whatsappCategoryEnabled('attendance')) return 'disabled';
            // Read the actor's account, never a phone number submitted by the browser.
            $employee = DB::table('user')->where('id', $userId)->where('isActive', true)->first(['fullName','phone','role']);
            if (!$employee || !NotificationGateway::normalizeIndonesianPhone((string)$employee->phone)) return 'missing';
            $time = Carbon::parse($evidence['submittedAt']);
            $this->gateway->sendWhatsapp('attendance', [
                'clientPhone'=>$employee->phone,
                'employeeName'=>$employee->fullName,
                'recipientRole'=>$employee->role,
                'attendanceType'=>match($action) { 'checkout'=>'Absen pulang', 'overtime-start'=>'Absen mulai lembur', 'overtime-finish'=>'Absen selesai lembur', default=>'Absen masuk' },
                'attendanceDate'=>$time->format('d-m-Y'),
                'attendanceTime'=>$time->format('H:i:s'),
                'workLocationType'=>$evidence['workLocationType'],
                'locationLabel'=>$evidence['locationLabel'],
            ]);
            return 'sent';
        } catch (\Throwable $exception) {
            Log::warning('Attendance WhatsApp delivery failed; attendance remains saved.', ['user_id'=>$userId,'action'=>$action,'exception'=>get_class($exception)]);
            return 'failed';
        }
    }
}
