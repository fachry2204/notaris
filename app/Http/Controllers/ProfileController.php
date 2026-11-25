<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class ProfileController extends Controller
{
    private function account(Request $request): array {
        $source = $request->session()->get('auth_user.source'); $id = $request->session()->get('auth_user.id');
        abort_unless(in_array($source, ['admin','user'], true) && $id, 403);
        $account = DB::table($source)->where('id', $id)->where('isActive', true)->first(); abort_unless($account, 403);
        return [$source, $id, $account];
    }
    public function show(Request $request) {
        [$source, $id, $account] = $this->account($request);
        $photo = $source === 'user' ? DB::table('staff')->where('userId', $id)->value('photoPath') : $account->photoPath;
        return Inertia::render('Profile/Show', ['profile' => ['fullName'=>$account->fullName, 'email'=>$account->email, 'phone'=>$account->phone, 'username'=>$account->username, 'role'=>$account->role, 'photoPath'=>$photo]]);
    }
    public function update(Request $request) {
        [$source, $id, $account] = $this->account($request);
        $data = $request->validate(['fullName'=>'required|string|max:255','email'=>'required|email|max:255','phone'=>'nullable|string|max:30','photo'=>'nullable|image|max:5120','current_password'=>'nullable|string','password'=>'nullable|string|min:8|confirmed']);
        foreach (['admin','user'] as $table) foreach (['email','phone'] as $field) {
            if (!empty($data[$field]) && DB::table($table)->where($field, $data[$field])->when($table === $source, fn($q) => $q->where('id','<>',$id))->exists()) throw ValidationException::withMessages([$field=>'Data sudah digunakan akun lain.']);
        }
        if (!empty($data['password'])) {
            $hash = preg_replace('/^\\$2[ab]\\$/', '$2y$', $account->passwordHash);
            if (empty($data['current_password']) || !password_verify($data['current_password'], $hash)) throw ValidationException::withMessages(['current_password'=>'Password saat ini tidak sesuai.']);
        }
        $photo = $request->hasFile('photo') ? $request->file('photo')->store('uploads/staff','public_root') : null;
        if ($request->hasFile('photo') && ! $photo) throw ValidationException::withMessages(['photo'=>'Foto tidak dapat disimpan.']);
        DB::transaction(function() use($source,$id,$data,$photo) {
            $payload=['fullName'=>$data['fullName'],'email'=>$data['email'],'phone'=>$data['phone']??null,'updatedAt'=>now()];
            if (!empty($data['password'])) $payload['passwordHash']=Hash::make($data['password']);
            if ($photo && $source === 'admin') $payload['photoPath']='/'.$photo;
            DB::table($source)->where('id',$id)->update($payload);
            if ($photo && $source === 'user') {
                $staff=DB::table('staff')->where('userId',$id)->first();
                if ($staff) DB::table('staff')->where('id',$staff->id)->update(['photoPath'=>'/'.$photo,'updatedAt'=>now()]);
                else DB::table('staff')->insert(['id'=>'staff-'.Str::lower(Str::random(12)),'userId'=>$id,'photoPath'=>'/'.$photo,'attendance_enabled'=>false,'payroll_enabled'=>false,'createdAt'=>now(),'updatedAt'=>now()]);
            }
        });
        foreach (['fullName','email'] as $field) $request->session()->put('auth_user.'.$field,$data[$field]);
        return back()->with('success','Profil berhasil diperbarui.');
    }
}
