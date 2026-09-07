<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class AdminAuthenticate
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->session()->get('auth_user');

        if (! is_array($user) || ($user['role'] ?? null) !== 'ADMINISTRATOR') {
            return redirect()->route('admin.login')
                ->withErrors(['username' => 'Silakan masuk menggunakan akun Administrator.']);
        }

        $source = in_array($user['source'] ?? null, ['admin', 'user'], true)
            ? $user['source']
            : null;

        $active = $source && DB::table($source)
            ->where('id', $user['id'] ?? '')
            ->where('role', 'ADMINISTRATOR')
            ->where('isActive', true)
            ->exists();

        if (! $active) {
            $request->session()->forget('auth_user');

            return redirect()->route('admin.login')
                ->withErrors(['username' => 'Sesi Administrator tidak lagi aktif.']);
        }

        return $next($request);
    }
}
