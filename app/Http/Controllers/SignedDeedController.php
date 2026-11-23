<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class SignedDeedController extends Controller
{
    public function save(Request $request, string $type, string $id)
    {
        abort_unless(in_array($type, ['badan_hukum', 'non_badan_hukum', 'ppat'], true), 404);
        $data = $request->validate(['signed_date' => 'required|date', 'deed_number' => 'nullable|string|max:191', 'notes' => 'nullable|string|max:5000', 'photos' => 'nullable|array|max:10', 'photos.*' => 'required|image|mimes:jpg,jpeg,png,webp|max:5120']);
        $paths = [];
        try {
            DB::transaction(function () use ($request, $type, $id, $data, &$paths) {
                $job = DB::table($type)->where('id', $id)->lockForUpdate()->first();
                abort_unless($job, 404);
                $existing = DB::table('signed_deeds')->where('job_type', $type)->where('job_id', $id)->first();
                $payload = ['signed_date' => $data['signed_date'], 'deed_number' => $data['deed_number'] ?? null, 'notes' => $data['notes'] ?? null, 'recorded_by' => $request->session()->get('auth_user.fullName') ?: $request->session()->get('auth_user.username'), 'updated_at' => now()];
                if ($existing) { DB::table('signed_deeds')->where('id', $existing->id)->update($payload); $deedId = $existing->id; }
                else { $deedId = DB::table('signed_deeds')->insertGetId([...$payload, 'job_type' => $type, 'job_id' => $id, 'created_at' => now()]); }
                $existingCount = DB::table('signed_deed_photos')->where('deed_id', $deedId)->count();
                if ($existingCount + count($data['photos'] ?? []) > 10) { throw \Illuminate\Validation\ValidationException::withMessages(['photos' => 'Maksimal 10 foto per akta.']); }
                foreach ($data['photos'] ?? [] as $photo) {
                    $path = $photo->store('signed-deeds', 'local'); if (! $path) throw new \RuntimeException('Gagal menyimpan foto.');
                    $paths[] = $path;
                    DB::table('signed_deed_photos')->insert(['deed_id' => $deedId, 'file_path' => $path, 'file_name' => Str::limit($photo->getClientOriginalName(), 240, ''), 'created_at' => now()]);
                }
                $fk = match ($type) { 'badan_hukum' => 'badanHukumId', 'non_badan_hukum' => 'nonBadanHukumId', default => 'ppatId' };
                $actorId = $request->session()->get('auth_user.id');
                if (! DB::table('user')->where('id', $actorId)->exists()) { $actorId = $job->staffId; }
                DB::table('jobprogress')->insert(['id' => 'PROG-'.Str::random(12), 'userId' => $actorId, 'statusBefore' => $job->status, 'statusAfter' => $job->status, 'description' => $existing ? 'Data penandatanganan akta diperbarui.' : 'Akta telah ditandatangani.', $fk => $id, 'createdAt' => now()]);
            });
        } catch (Throwable $exception) { Storage::disk('local')->delete($paths); throw $exception; }
        return back()->with('success', 'Data tanda tangan akta berhasil disimpan.');
    }

    public function photo(string $type, string $id, int $photo)
    {
        abort_unless(in_array($type, ['badan_hukum', 'non_badan_hukum', 'ppat'], true), 404);
        $file = DB::table('signed_deed_photos as p')->join('signed_deeds as d', 'd.id', '=', 'p.deed_id')->where('d.job_type', $type)->where('d.job_id', $id)->where('p.id', $photo)->select('p.file_path')->first();
        abort_unless($file && Storage::disk('local')->exists($file->file_path), 404);
        return Storage::disk('local')->response($file->file_path, null, ['Cache-Control' => 'private, no-store', 'X-Content-Type-Options' => 'nosniff']);
    }
}
