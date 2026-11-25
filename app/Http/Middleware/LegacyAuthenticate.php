<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class LegacyAuthenticate
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->session()->has('auth_user')) {
            return redirect()->route('login');
        }

        if ($request->session()->get('auth_user.role') === 'OB' && $request->is(
            'dashboard/quotation', 'dashboard/quotation/*', 'dashboard/invoice', 'dashboard/invoice/*',
            'dashboard/clients', 'dashboard/clients/*', 'dashboard/jobs', 'dashboard/jobs/*',
            'dashboard/akta', 'dashboard/modules', 'dashboard/modules/*', 'dashboard/attachments/*'
        )) {
            abort(403, 'Menu ini tidak tersedia untuk role OB.');
        }

        return $next($request);
    }
}
