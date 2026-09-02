<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;use Illuminate\Support\Facades\DB;use Inertia\Inertia;
class PublicTrackingController extends Controller{
 public function index(){return Inertia::render('Public/Tracking',['result'=>null]);}
 public function search(Request $r){$code=$r->validate(['trackingCode'=>'required|string|max:255'])['trackingCode'];$job=null;$type=null;foreach(['badan_hukum','non_badan_hukum','ppat'] as $table){$job=DB::table($table.' as j')->leftJoin('client as c','c.id','=','j.clientId')->select('j.*','c.name as clientName')->where('j.trackingCode',$code)->first();if($job){$type=$table;break;}}if(!$job)return Inertia::render('Public/Tracking',['result'=>null,'error'=>'Berkas tidak ditemukan.']);$fk=$type==='badan_hukum'?'badanHukumId':($type==='non_badan_hukum'?'nonBadanHukumId':'ppatId');return Inertia::render('Public/Tracking',['result'=>['job'=>$job,'invoices'=>DB::table('invoice')->where($fk,$job->id)->get(),'payments'=>DB::table('financerecord')->where($fk,$job->id)->get()]]);}
}
