<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class UploadedReceiptController extends Controller
{
    private function ensureJob(string $type, string $id): void
    {
        abort_unless(in_array($type, ['badan_hukum', 'non_badan_hukum', 'ppat'], true), 404);
        abort_unless(DB::table($type)->where('id', $id)->exists(), 404);
    }

    public function store(Request $request, string $type, string $id)
    {
        $this->ensureJob($type, $id);
        $data = $request->validate([
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png,webp|max:10240',
            'document_date' => 'required|date',
            'receiver' => 'required|string|max:191',
            'submitter' => 'required|string|max:191',
        ]);
        $path = $data['file']->store('job-receipts', 'local');
        if (! $path) { throw new \RuntimeException('Gagal menyimpan tanda terima.'); }
        try {
            DB::table('uploaded_job_receipts')->insert([
                'job_type' => $type, 'job_id' => $id, 'file_path' => $path,
                'file_name' => Str::limit($data['file']->getClientOriginalName(), 240, ''),
                'document_date' => $data['document_date'], 'receiver' => $data['receiver'], 'submitter' => $data['submitter'],
                'uploaded_by' => $request->session()->get('auth_user.fullName') ?: $request->session()->get('auth_user.username'),
                'created_at' => now(),
            ]);
        } catch (Throwable $exception) {
            Storage::disk('local')->delete($path);
            throw $exception;
        }
        return back()->with('success', 'Tanda terima berhasil diunggah.');
    }

    public function show(string $type, string $id, int $receipt)
    {
        $this->ensureJob($type, $id);
        $file = DB::table('uploaded_job_receipts')->where('job_type', $type)->where('job_id', $id)->where('id', $receipt)->first();
        abort_unless($file && Storage::disk('local')->exists($file->file_path), 404);
        return Storage::disk('local')->response($file->file_path, null, ['Cache-Control' => 'private, no-store', 'X-Content-Type-Options' => 'nosniff']);
    }
}
