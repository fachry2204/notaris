<?php

namespace App\Http\Controllers;

use App\Services\AttendanceSettingsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AttendanceSettingsController extends Controller
{
    private function authorizeManager(Request $request): void
    {
        abort_unless(in_array($request->session()->get('auth_user.role'), ['ADMINISTRATOR','PIMPINAN'], true), 403);
    }

    public function edit(Request $request, AttendanceSettingsService $settings)
    {
        $this->authorizeManager($request);
        return Inertia::render('Attendance/Settings', ['settings'=>$settings->read()]);
    }

    public function update(Request $request)
    {
        $this->authorizeManager($request);
        $data = $request->validate([
            'start_time'=>'required|date_format:H:i', 'end_time'=>'nullable|date_format:H:i|after:start_time',
            'grace_minutes'=>'required|integer|min:0|max:1440', 'annual_leave_days'=>'required|integer|min:0|max:366',
            'office_latitude'=>'nullable|required_with:office_longitude|numeric|between:-90,90',
            'office_longitude'=>'nullable|required_with:office_latitude|numeric|between:-180,180',
            'office_radius_meters'=>'required|integer|min:1|max:10000',
        ]);
        foreach (['grace_minutes','annual_leave_days','office_radius_meters'] as $key) $data[$key]=(int)$data[$key];
        foreach (['office_latitude','office_longitude'] as $key) $data[$key]=isset($data[$key])?round((float)$data[$key],7):null;
        DB::table('app_settings')->updateOrInsert(['settings_key'=>AttendanceSettingsService::KEY], [
            'id'=>'settings-attendance','settings_value'=>json_encode($data),'updated_at'=>now(),'created_at'=>now(),
        ]);
        return back()->with('success','Pengaturan absensi disimpan.');
    }
}
