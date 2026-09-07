<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class AuthController extends Controller
{
    public function create()
    {
        return Inertia::render('Auth/Login', [
            'adminMode' => false,
            'loginAction' => route('login.store'),
        ]);
    }

    public function createAdmin(Request $request)
    {
        if (($request->session()->get('auth_user.role')) === 'ADMINISTRATOR') {
            return redirect()->route('admin.frontend');
        }

        return Inertia::render('Auth/Login', [
            'adminMode' => true,
            'loginAction' => route('admin.login.store'),
        ]);
    }

    public function store(Request $request)
    {
        return $this->authenticate($request, false);
    }

    public function storeAdmin(Request $request)
    {
        return $this->authenticate($request, true);
    }

    private function authenticate(Request $request, bool $adminOnly)
    {
        $credentials = $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $account = DB::table('admin')->where('username', $credentials['username'])->where('isActive', true)->first();
        $source = 'admin';
        if (!$account) {
            $account = DB::table('user')->where('username', $credentials['username'])->where('isActive', true)->first();
            $source = 'user';
        }

        if (
            ! $account
            || ($adminOnly && $account->role !== 'ADMINISTRATOR')
            || ! $this->passwordMatches($credentials['password'], $account->passwordHash)
        ) {
            $message = $adminOnly
                ? 'Akun Administrator atau password tidak valid.'
                : 'Username atau password tidak valid.';

            return back()->withErrors(['username' => $message])->onlyInput('username');
        }

        // bcryptjs writes the valid bcrypt prefix $2b$, while PHP/Laravel
        // generates $2y$. Re-hash after the first successful legacy login so
        // subsequent checks use Laravel's native format and cost settings.
        if (!str_starts_with($account->passwordHash, '$2y$') || Hash::needsRehash($account->passwordHash)) {
            DB::table($source)->where('id', $account->id)->update([
                'passwordHash' => Hash::make($credentials['password']),
                'updatedAt' => now(),
            ]);
        }

        $request->session()->regenerate();
        $request->session()->put('auth_user', [
            'id' => $account->id,
            'username' => $account->username,
            'fullName' => $account->fullName,
            'email' => $account->email,
            'role' => $account->role,
            'source' => $source,
        ]);

        return redirect()->intended($adminOnly ? route('admin.frontend') : route('dashboard'));
    }

    public function destroy(Request $request)
    {
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect()->route('login');
    }

    private function passwordMatches(string $plainPassword, string $storedHash): bool
    {
        if (preg_match('/^\$2[ab]\$/', $storedHash)) {
            $phpCompatibleHash = '$2y$'.substr($storedHash, 4);
            return password_verify($plainPassword, $phpCompatibleHash);
        }

        if (str_starts_with($storedHash, '$2y$')) {
            return password_verify($plainPassword, $storedHash);
        }

        if (str_starts_with($storedHash, '$argon2')) {
            return password_verify($plainPassword, $storedHash);
        }

        return false;
    }
}
