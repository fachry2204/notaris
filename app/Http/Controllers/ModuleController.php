<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ModuleController extends Controller
{
    public function audit()
    {
        return Inertia::render('Modules/Table', [
            'title' => 'Audit Log',
            'columns' => ['userName', 'activity', 'details', 'ipAddress', 'device', 'createdAt'],
            'rows' => DB::table('activitylog as a')->leftJoin('user as u', function ($join) {
                $join->on(DB::raw('u.id COLLATE utf8mb4_unicode_ci'), '=', DB::raw('a.userId COLLATE utf8mb4_unicode_ci'));
            })->leftJoin('admin as ad', function ($join) {
                $join->on(DB::raw('ad.id COLLATE utf8mb4_unicode_ci'), '=', DB::raw('a.userId COLLATE utf8mb4_unicode_ci'));
            })->select('a.*')->selectRaw('COALESCE(u.fullName, ad.fullName) as userName')->orderByDesc('a.createdAt')->paginate(30),
        ]);
    }

    public function stats()
    {
        $stats = ['total'=>0,'PENDING'=>0,'PROSES'=>0,'REVISI'=>0,'VERIFIKASI'=>0,'SELESAI'=>0];
        $months = collect(range(5, 0))->map(fn ($i) => now()->subMonths($i)->startOfMonth())->map(fn ($date) => ['key'=>$date->format('Y-m'),'name'=>$date->translatedFormat('M'),'total'=>0,'completed'=>0])->keyBy('key');
        $deadlines = collect();
        foreach (['badan_hukum','non_badan_hukum','ppat'] as $table) {
            foreach (DB::table($table)->select('status',DB::raw('COUNT(*) total'))->groupBy('status')->get() as $row) {
                $stats['total'] += (int) $row->total;
                $key = in_array($row->status, ['REVISI','REVISI_PROSES']) ? 'REVISI' : $row->status;
                if (isset($stats[$key])) $stats[$key] += (int) $row->total;
            }
            foreach (DB::table($table)->where('createdAt','>=',now()->subMonths(5)->startOfMonth())->select('createdAt','updatedAt','status')->get() as $job) {
                $created = substr((string)$job->createdAt,0,7); if ($months->has($created)) {$row=$months->get($created);$row['total']++;$months->put($created,$row);}
                $updated = substr((string)$job->updatedAt,0,7); if ($job->status==='SELESAI' && $months->has($updated)) {$row=$months->get($updated);$row['completed']++;$months->put($updated,$row);}
            }
            $deadlines = $deadlines->concat(DB::table($table.' as j')->leftJoin('client as c','c.id','=','j.clientId')->whereNot('j.status','SELESAI')->whereBetween('j.deadline',[now(),now()->addDays(7)])->select('j.id','j.trackingCode','j.title','j.deadline','j.status','c.name as clientName')->get());
        }
        return Inertia::render('Modules/Stats',['stats'=>$stats,'months'=>$months->values(),'deadlines'=>$deadlines->sortBy('deadline')->take(5)->values()]);
    }

    public function productivity()
    {
        $staff = DB::table('user')->select('id','fullName','username','role')->whereIn('role',['STAFFADMIN','OB','ADMINISTRATOR','PIMPINAN'])->get()->keyBy('id')->map(fn($u)=>[...(array)$u,'completed'=>0,'processing'=>0]);
        foreach (['badan_hukum','non_badan_hukum','ppat'] as $table) foreach(DB::table($table)->whereNotNull('staffId')->select('staffId','status')->get() as $job) if($staff->has($job->staffId)) {$row=$staff[$job->staffId];$job->status==='SELESAI'?$row['completed']++:($job->status!=='CANCELLED'?$row['processing']++:0);$staff[$job->staffId]=$row;}
        return Inertia::render('Modules/Productivity',['staff'=>$staff->sortByDesc('completed')->values()]);
    }

    public function deeds(Request $request)
    {
        return Inertia::render('Modules/Deeds',['jobs'=>$this->jobs($request)->paginate(30)->withQueryString(),'staff'=>DB::table('user')->select('id','fullName')->orderBy('fullName')->get(),'filters'=>$request->only('from','to','staff','witness')]);
    }

    public function witnesses(Request $request)
    {
        $rows=$this->jobs($request)->whereNotNull('saksi')->where('saksi','<>','')->get();$grouped=collect();foreach($rows as $job)foreach(array_filter(array_map('trim',explode(',',$job->saksi))) as $name)$grouped->push(['name'=>$name,'job'=>$job]);
        return Inertia::render('Modules/Witnesses',['rows'=>$grouped->sortBy('name')->values(),'search'=>(string)$request->query('search')]);
    }

    private function jobs(Request $request)
    {
        $parts=collect(['badan_hukum'=>'Badan Hukum/Usaha','non_badan_hukum'=>'Non Badan Hukum','ppat'=>'PPAT'])->map(fn($category,$table)=>DB::table($table.' as j')->leftJoin('client as c','c.id','=','j.clientId')->leftJoin('user as u','u.id','=','j.staffId')->select('j.id','j.trackingCode','j.title','j.status','j.invoiceStatus','j.saksi','j.createdAt','j.staffId','c.name as clientName','u.fullName as staffName')->selectRaw('? as category, ? as jobType',[$category,$table]));
        $union=$parts->shift();foreach($parts as $part)$union->unionAll($part);$q=DB::query()->fromSub($union,'jobs')->orderByDesc('createdAt');
        return $q->when($request->query('from'),fn($x,$v)=>$x->whereDate('createdAt','>=',$v))->when($request->query('to'),fn($x,$v)=>$x->whereDate('createdAt','<=',$v))->when($request->query('staff'),fn($x,$v)=>$x->where('staffId',$v))->when($request->query('witness'),fn($x,$v)=>$x->where('saksi','like',"%{$v}%"))->when($request->query('search'),fn($x,$v)=>$x->where(fn($x)=>$x->where('saksi','like',"%{$v}%")->orWhere('trackingCode','like',"%{$v}%")));
    }
}
