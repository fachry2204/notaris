<?php

namespace App\Http\Controllers;

use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class UserLoginController extends Controller
{
    private const SOURCES = ['admin', 'user'];

    private const ROLES = ['ADMINISTRATOR', 'PIMPINAN', 'STAFFADMIN', 'OB'];

    public function index(Request $request)
    {
        $this->authorizeManagement($request);

        $search = trim((string) $request->query('search'));
        $status = (string) $request->query('status', 'all');
        $role = (string) $request->query('role', 'all');

        $adminAccounts = DB::table('admin')->select([
            'id', 'username', 'email', 'phone', 'fullName', 'role', 'isActive', 'createdAt', 'updatedAt',
        ])->get()->map(function ($account) {
            $account->source = 'admin';

            return $account;
        });
        $userAccounts = DB::table('user')->select([
            'id', 'username', 'email', 'phone', 'fullName', 'role', 'isActive', 'createdAt', 'updatedAt',
        ])->get()->map(function ($account) {
            $account->source = 'user';

            return $account;
        });

        $filteredAccounts = $adminAccounts
            ->merge($userAccounts)
            ->when($search !== '', fn ($accounts) => $accounts->filter(function ($account) use ($search) {
                $needle = Str::lower($search);

                return Str::contains(Str::lower((string) $account->fullName), $needle)
                    || Str::contains(Str::lower((string) $account->username), $needle)
                    || Str::contains(Str::lower((string) $account->email), $needle);
            }))
            ->when($status === 'active', fn ($accounts) => $accounts->filter(fn ($account) => (bool) $account->isActive))
            ->when($status === 'inactive', fn ($accounts) => $accounts->reject(fn ($account) => (bool) $account->isActive))
            ->when(in_array($role, self::ROLES, true), fn ($accounts) => $accounts->where('role', $role))
            ->sortBy(fn ($account) => Str::lower((string) $account->fullName))
            ->values();
        $page = LengthAwarePaginator::resolveCurrentPage();
        $accounts = new LengthAwarePaginator(
            $filteredAccounts->forPage($page, 20)->values(),
            $filteredAccounts->count(),
            20,
            $page,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        return Inertia::render('UserLogins/Index', [
            'accounts' => $accounts,
            'filters' => compact('search', 'status', 'role'),
            'stats' => [
                'total' => DB::table('admin')->count() + DB::table('user')->count(),
                'active' => DB::table('admin')->where('isActive', true)->count() + DB::table('user')->where('isActive', true)->count(),
                'inactive' => DB::table('admin')->where('isActive', false)->count() + DB::table('user')->where('isActive', false)->count(),
            ],
            'currentAccount' => [
                'id' => $request->session()->get('auth_user.id'),
                'source' => $request->session()->get('auth_user.source'),
            ],
        ]);
    }

    public function create(Request $request)
    {
        $this->authorizeManagement($request);

        return Inertia::render('UserLogins/Form', ['account' => null]);
    }

    public function store(Request $request)
    {
        $this->authorizeManagement($request);
        $data = $this->validated($request, null, null, true);
        $this->ensureUniqueAcrossSources($data);

        DB::transaction(function () use ($data) {
            $id = 'user-'.Str::lower(Str::random(12));
            DB::table('user')->insert([
                'id' => $id,
                'username' => $data['username'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?: null,
                'passwordHash' => Hash::make($data['password']),
                'fullName' => $data['fullName'],
                'role' => $data['role'],
                'isActive' => $data['isActive'],
                'birthday' => null,
                'createdAt' => now(),
                'updatedAt' => now(),
            ]);
            DB::table('staff')->insert([
                'id' => 'staff-'.Str::lower(Str::random(12)),
                'userId' => $id,
                'photoPath' => null,
                'ktpPath' => null,
                'createdAt' => now(),
                'updatedAt' => now(),
            ]);
        });

        return redirect()->route('user-logins.index')->with('success', 'User login berhasil ditambahkan.');
    }

    public function edit(Request $request, string $source, string $id)
    {
        $this->authorizeManagement($request);
        $table = $this->sourceTable($source);
        $account = DB::table($table)->where('id', $id)->first();
        abort_unless($account, 404);
        $account->source = $source;

        return Inertia::render('UserLogins/Form', compact('account'));
    }

    public function update(Request $request, string $source, string $id)
    {
        $this->authorizeManagement($request);
        $table = $this->sourceTable($source);
        $account = DB::table($table)->where('id', $id)->first();
        abort_unless($account, 404);

        $data = $this->validated($request, $source, $id, false);
        $this->ensureUniqueAcrossSources($data, $source, $id);
        $this->guardSelfStatus($request, $source, $id, (bool) $data['isActive']);
        $this->guardLastAdministrator($account, (bool) $data['isActive'], $data['role']);

        $payload = [
            'username' => $data['username'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?: null,
            'fullName' => $data['fullName'],
            'role' => $data['role'],
            'isActive' => $data['isActive'],
            'updatedAt' => now(),
        ];
        if (! empty($data['password'])) {
            $payload['passwordHash'] = Hash::make($data['password']);
        }

        DB::table($table)->where('id', $id)->update($payload);

        if ($this->isCurrentAccount($request, $source, $id)) {
            $request->session()->put('auth_user.username', $data['username']);
            $request->session()->put('auth_user.fullName', $data['fullName']);
            $request->session()->put('auth_user.email', $data['email']);
            $request->session()->put('auth_user.role', $data['role']);
        }

        return redirect()->route('user-logins.index')->with('success', 'User login berhasil diperbarui.');
    }

    public function toggleStatus(Request $request, string $source, string $id)
    {
        $this->authorizeManagement($request);
        $table = $this->sourceTable($source);
        $account = DB::table($table)->where('id', $id)->first();
        abort_unless($account, 404);
        abort_if($this->isCurrentAccount($request, $source, $id), 422, 'Akun yang sedang digunakan tidak dapat dinonaktifkan.');
        if ($account->isActive) {
            $this->guardLastAdministrator($account, false, $account->role);
        }

        DB::table($table)->where('id', $id)->update([
            'isActive' => ! $account->isActive,
            'updatedAt' => now(),
        ]);

        return back()->with('success', 'Status user login berhasil diperbarui.');
    }

    public function destroy(Request $request, string $source, string $id)
    {
        $this->authorizeManagement($request);
        $table = $this->sourceTable($source);
        abort_if($this->isCurrentAccount($request, $source, $id), 422, 'Akun yang sedang digunakan tidak dapat dihapus.');
        $account = DB::table($table)->where('id', $id)->first();
        abort_unless($account, 404);
        $this->guardLastAdministrator($account, false, $account->role);

        if ($source === 'user' && $this->hasOperationalHistory($id)) {
            throw ValidationException::withMessages([
                'account' => 'Akun memiliki riwayat operasional dan tidak dapat dihapus. Nonaktifkan akun agar data kantor tetap utuh.',
            ]);
        }

        try {
            DB::table($table)->where('id', $id)->delete();
        } catch (QueryException) {
            throw ValidationException::withMessages([
                'account' => 'Akun masih digunakan oleh data lain. Nonaktifkan akun sebagai gantinya.',
            ]);
        }

        return back()->with('success', 'User login berhasil dihapus.');
    }

    private function validated(Request $request, ?string $source, ?string $id, bool $creating): array
    {
        $roles = $source === 'admin' ? ['ADMINISTRATOR', 'PIMPINAN'] : self::ROLES;

        return $request->validate([
            'fullName' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'role' => ['required', 'in:'.implode(',', $roles)],
            'isActive' => ['required', 'boolean'],
            'password' => [$creating ? 'required' : 'nullable', 'string', 'min:4'],
        ]);
    }

    private function ensureUniqueAcrossSources(array $data, ?string $currentSource = null, ?string $currentId = null): void
    {
        $errors = [];
        foreach (['username', 'email', 'phone'] as $field) {
            if (empty($data[$field])) {
                continue;
            }
            foreach (self::SOURCES as $source) {
                $exists = DB::table($source)
                    ->where($field, $data[$field])
                    ->when($source === $currentSource && $currentId, fn ($query) => $query->where('id', '<>', $currentId))
                    ->exists();
                if ($exists) {
                    $errors[$field] = ucfirst($field).' sudah digunakan oleh akun lain.';
                    break;
                }
            }
        }

        if ($errors) {
            throw ValidationException::withMessages($errors);
        }
    }

    private function hasOperationalHistory(string $userId): bool
    {
        $references = [
            ['attachment', 'userId'],
            ['jobprogress', 'userId'],
            ['notification', 'userId'],
            ['reminder', 'userId'],
            ['job_employee_task', 'userId'],
            ['badan_hukum', 'staffId'],
            ['non_badan_hukum', 'staffId'],
            ['ppat', 'staffId'],
        ];
        foreach ($references as [$table, $column]) {
            if (Schema::hasTable($table) && Schema::hasColumn($table, $column) && DB::table($table)->where($column, $userId)->exists()) {
                return true;
            }
        }

        $staffId = Schema::hasTable('staff') ? DB::table('staff')->where('userId', $userId)->value('id') : null;

        return $staffId && Schema::hasTable('attendance') && DB::table('attendance')->where('staffId', $staffId)->exists();
    }

    private function guardSelfStatus(Request $request, string $source, string $id, bool $isActive): void
    {
        abort_if(! $isActive && $this->isCurrentAccount($request, $source, $id), 422, 'Akun yang sedang digunakan tidak dapat dinonaktifkan.');
    }

    private function guardLastAdministrator(object $account, bool $willBeActive, string $newRole): void
    {
        if ($account->role !== 'ADMINISTRATOR' || ! $account->isActive) {
            return;
        }
        if ($willBeActive && $newRole === 'ADMINISTRATOR') {
            return;
        }

        $activeAdministrators = DB::table('admin')->where('role', 'ADMINISTRATOR')->where('isActive', true)->count()
            + DB::table('user')->where('role', 'ADMINISTRATOR')->where('isActive', true)->count();

        if ($activeAdministrators <= 1) {
            throw ValidationException::withMessages([
                'account' => 'Administrator aktif terakhir tidak dapat dinonaktifkan, diubah perannya, atau dihapus.',
            ]);
        }
    }

    private function isCurrentAccount(Request $request, string $source, string $id): bool
    {
        return $request->session()->get('auth_user.id') === $id
            && $request->session()->get('auth_user.source') === $source;
    }

    private function sourceTable(string $source): string
    {
        abort_unless(in_array($source, self::SOURCES, true), 404);

        return $source;
    }

    private function authorizeManagement(Request $request): void
    {
        abort_unless(in_array($request->session()->get('auth_user.role'), ['ADMINISTRATOR', 'PIMPINAN'], true), 403);
    }
}
