"use client";
 
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Download, 
  FileText, 
  Clock, 
  User, 
  Building2, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  MoreVertical,
  ChevronRight,
  History,
  Paperclip,
  ChevronDown,
  Edit3,
  Trash2,
  Phone,
  Mail
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getJobById } from "@/lib/actions/jobs";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteJob, updateJob } from "@/lib/actions/jobs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
 
const formatDate = (date: any) => {
  if (!date) return "-";
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

const statusConfig = {
  PENDING: { label: "Pending", color: "bg-amber-500/10 text-amber-500 border-amber-500/20", progress: 0 },
  PROSES: { label: "Proses", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", progress: 40 },
  REVISI: { label: "Revisi", color: "bg-rose-500/10 text-rose-500 border-rose-500/20", progress: 20 },
  REVISI_PROSES: { label: "Revisi Proses", color: "bg-orange-500/10 text-orange-500 border-orange-500/20", progress: 60 },
  VERIFIKASI: { label: "Menunggu verifikasi", color: "bg-purple-500/10 text-purple-500 border-purple-500/20", progress: 85 },
  SELESAI: { label: "Selesai", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", progress: 100 },
  CANCELLED: { label: "Dibatalkan", color: "bg-slate-500/10 text-slate-500 border-slate-500/20", progress: 0 },
};
 
export default function JobDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUpdateStatusOpen, setIsUpdateStatusOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
 
  useEffect(() => {
    if (!id) return;
    const fetchJob = async () => {
      try {
        const result = await getJobById(id as string);
        if (result.success) {
          setJob(result.data);
        } else {
          toast.error(result.error);
          router.push("/dashboard/jobs");
        }
      } catch (error) {
        console.error("Error in fetchJob:", error);
        toast.error("Terjadi kesalahan saat mengambil data");
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id, router]);

  const handleDelete = async () => {
    const result = await deleteJob(id as string, job.category || "");
    if (result.success) {
      toast.success("Pekerjaan berhasil dihapus");
      router.push("/dashboard/jobs/inbound");
    } else {
      toast.error(result.error);
    }
    setIsDeleteDialogOpen(false);
  };
 
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-pink-500 border-t-transparent"></div>
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Memuat detail berkas...</p>
      </div>
    );
  }
 
  if (!job) return null;
 
  return (
    <>
      <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-8">
        {/* Header Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full hover:bg-pink-500/10 hover:text-pink-500 transition-all"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
                <span>Data Berkas</span>
                <ChevronRight className="h-3 w-3" />
                <span className="text-pink-600">{job.trackingCode}</span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-foreground leading-none">{job.title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Badge className={cn("rounded-full px-3 py-1.5 border-none font-black text-[9px] uppercase tracking-widest shadow-sm", (statusConfig[job.status as keyof typeof statusConfig] || statusConfig.PENDING).color)}>
                {(statusConfig[job.status as keyof typeof statusConfig] || { label: job.status }).label}
              </Badge>
              <span className="text-[10px] font-black text-pink-600 bg-pink-50 px-2 py-1 rounded-lg border border-pink-100">{job.progress || 0}%</span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger 
                className="h-8 px-3 rounded-xl border border-muted hover:bg-muted text-foreground transition-all flex items-center gap-2 font-bold text-xs"
              >
                <FileText className="h-3.5 w-3.5" />
                Cetak
                <ChevronDown className="h-3 w-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl border-none shadow-2xl min-w-[150px] p-1.5">
                <DropdownMenuItem onClick={() => toast.info("Mencetak Penyerahan...")} className="rounded-lg px-2 py-2 gap-2 cursor-pointer text-xs">
                  <FileText className="h-3.5 w-3.5 text-blue-500" />
                  Penyerahan Berkas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.info("Mencetak Pengambilan...")} className="rounded-lg px-2 py-2 gap-2 cursor-pointer text-xs">
                  <FileText className="h-3.5 w-3.5 text-emerald-500" />
                  Ambil Berkas
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button 
              variant="outline"
              size="sm"
              className="rounded-xl gap-2 font-bold border-muted text-purple-600 hover:bg-purple-50 h-8 text-xs"
              onClick={() => router.push(`/dashboard/jobs/${job.id}/invoice`)}
            >
              <FileText className="h-3.5 w-3.5" />
              Invoice
            </Button>

            <Button 
              size="sm"
              onClick={() => router.push(`/dashboard/jobs/${job.id}/edit`)}
              className="rounded-xl gap-2 font-bold bg-pink-500 hover:bg-pink-600 shadow-lg shadow-pink-500/10 h-8 text-xs"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Edit
            </Button>

            <Button 
              size="sm"
              onClick={() => setIsUpdateStatusOpen(true)}
              variant="outline"
              className="rounded-xl gap-2 font-bold border-amber-200 text-amber-600 hover:bg-amber-50 h-10 px-4 text-sm"
            >
              <Clock className="h-4 w-4" />
              Status
            </Button>

            <Button 
              size="sm"
              variant="destructive"
              className="rounded-xl gap-2 font-bold shadow-lg shadow-red-500/5 h-8 text-xs"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Hapus
            </Button>
          </div>
        </div>

        <div className="space-y-3">


          <div className="grid md:grid-cols-3 gap-3">
            <div className="md:col-span-1">
              {/* Client Card */}
              <Card className="h-full border border-muted-foreground/20 shadow-sm rounded-xl bg-card overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase border-b border-muted/10 pb-2 mb-2">
                    <User className="h-3.5 w-3.5 text-pink-500" />
                    Client
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-pink-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-foreground text-base leading-none">{job.client?.company || job.client?.name}</h3>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">{job.client?.type || "CLIENT"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 pt-1">
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Kontak</label>
                      <p className="font-bold text-xs">{job.client?.name}</p>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">HP/WA</label>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-pink-600">{job.client?.phone || "-"}</p>
                        {job.client?.phone && (
                          <a 
                            href={`https://wa.me/${job.client.phone.replace(/[^0-9]/g, '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="h-7 w-7 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/10 hover:scale-110 hover:rotate-6 transition-all"
                          >
                            <Phone className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-0.5 pt-1">
                      <label className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Alamat Lengkap</label>
                      <p className="text-xs text-muted-foreground leading-relaxed italic">
                        {job.client?.address || "-"}
                      </p>
                    </div>

                    {/* Regional Info Grid */}
                    <div className="grid grid-cols-2 gap-x-3 gap-y-2 mt-3 pt-3 border-t border-muted/10">
                      <div className="flex flex-col gap-0.5">
                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Negara</label>
                        <p className="text-[11px] font-bold">{job.client?.country || "-"}</p>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Provinsi</label>
                        <p className="text-[11px] font-bold">{job.client?.province || "-"}</p>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Kota/Kabupaten</label>
                        <p className="text-[11px] font-bold">{job.client?.city || "-"}</p>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Kecamatan</label>
                        <p className="text-[11px] font-bold">{job.client?.district || "-"}</p>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Kelurahan</label>
                        <p className="text-[11px] font-bold">{job.client?.village || "-"}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-2">
              {/* Job Details Card */}
              <Card className="h-full border border-muted-foreground/20 shadow-sm rounded-xl bg-card overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase border-b border-muted/10 pb-2 mb-4">
                    <FileText className="h-3.5 w-3.5 text-pink-500" />
                    Detail Pekerjaan
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">No. Berkas</label>
                      <p className="text-sm font-mono font-bold text-pink-600 leading-none">{job.trackingCode}</p>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Nama Kategori</label>
                      <p className="text-sm font-bold leading-none">{job.category}</p>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Jenis Pengurusan</label>
                      <p className="text-sm font-bold leading-none">
                        {job.type === job.category && job.title.includes(' - ') ? job.title.split(' - ')[0] : job.type}
                      </p>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Nama Badan Hukum</label>
                      <p className="text-sm font-bold text-pink-600 leading-none">{job.companyName || "-"}</p>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Pengurusan Untuk</label>
                      <p className="text-sm font-bold leading-none">{job.title.includes(' - ') ? job.title.split(' - ').pop() : job.title}</p>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Deadline</label>
                      <p className="text-sm font-bold text-rose-600 leading-none">{formatDate(job.deadline)}</p>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Prioritas</label>
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <div className={cn(
                          "h-2 w-2 rounded-full",
                          job.priority === "URGENT" ? "bg-rose-500 animate-pulse" :
                          job.priority === "HIGH" ? "bg-orange-500" :
                          job.priority === "MEDIUM" ? "bg-blue-500" : "bg-slate-400"
                        )} />
                        <p className={cn(
                          "text-sm font-bold leading-none",
                          job.priority === "URGENT" ? "text-rose-600" :
                          job.priority === "HIGH" ? "text-orange-600" :
                          job.priority === "MEDIUM" ? "text-blue-600" : "text-muted-foreground"
                        )}>{job.priority}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">PIC Pegawai</label>
                      <p className="text-sm font-bold leading-none">{job.staff?.fullName || "-"}</p>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Nama Saksi</label>
                      <p className="text-sm font-bold text-blue-600 leading-none">{job.saksi || "-"}</p>
                    </div>
                    {/* Integrated Notes Section */}
                    {job.notes && (
                      <div className="flex flex-col gap-1 col-span-full pt-4 border-t border-muted/10 mt-2">
                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Catatan Tambahan</label>
                        <div className="p-3 rounded-xl bg-muted/30 border border-muted/20 min-h-[40px]">
                          <p className="text-sm text-muted-foreground leading-relaxed italic">
                            {job.notes}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>


          {job.founders && job.founders.length > 0 && (
            <Card className="border-none shadow-sm rounded-xl bg-card overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase border-b border-muted/10 pb-3 mb-6">
                  <Building2 className="h-4 w-4 text-amber-500" />
                  Pendiri / Rekan
                </div>
                
                <div className="space-y-3">
                  {/* Header labels */}
                  <div className="grid grid-cols-12 px-4 py-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    <div className="col-span-4">Nama</div>
                    <div className="col-span-4 px-2">Email</div>
                    <div className="col-span-4 px-2">Handphone</div>
                  </div>

                  {job.founders.map((founder: any) => (
                    <div key={founder.id} className="grid grid-cols-12 items-center p-2.5 px-4 rounded-xl border border-muted-foreground/30 bg-muted/5 hover:bg-muted/10 transition-all group shadow-sm">
                      {/* Name Column */}
                      <div className="col-span-4 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-500 group-hover:scale-105 transition-transform">
                          <User className="h-4 w-4" />
                        </div>
                        <span className="font-bold text-sm text-foreground">{founder.name}</span>
                      </div>

                      {/* Email Column */}
                      <div className="col-span-4 px-2 flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-blue-500/5 flex items-center justify-center text-blue-400">
                          <Mail className="h-3 w-3" />
                        </div>
                        <span className="text-xs text-muted-foreground truncate pr-4">
                          {founder.email || "-"}
                        </span>
                      </div>

                      {/* Phone/WA Column */}
                      <div className="col-span-4 px-2 flex items-center">
                        {founder.phone ? (
                          <a 
                            href={`https://wa.me/${founder.phone.replace(/[^0-9]/g, '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500/10 transition-all group/wa"
                          >
                            <span className="font-bold text-xs">{founder.phone}</span>
                            <div className="h-6 w-6 rounded-md bg-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/10 group-hover/wa:rotate-6 transition-transform">
                              <Phone className="h-3 w-3" />
                            </div>
                          </a>
                        ) : (
                          <span className="font-bold text-xs text-muted-foreground px-4">-</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid md:grid-cols-2 gap-3">
            {/* Attachments Card */}
            <Card className="border-none shadow-sm rounded-xl bg-card overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase border-b border-muted/10 pb-3 mb-4">
                  <Paperclip className="h-4 w-4 text-blue-500" />
                  Lampiran ({job.attachments?.length || 0})
                </div>
                <div className="space-y-3">
                  {job.attachments && job.attachments.length > 0 ? (
                    job.attachments.map((file: any) => (
                      <div key={file.id} className="p-2.5 px-4 rounded-xl border border-muted-foreground/30 flex items-center justify-between hover:bg-muted/5 transition-colors group shadow-sm bg-muted/5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm line-clamp-1">
                              {file.fileName}
                            </span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{formatDate(file.createdAt)}</span>
                          </div>
                        </div>
                        <a 
                          href={file.filePath} 
                          download 
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 opacity-0 group-hover:opacity-100 transition-all font-bold text-xs border border-blue-100"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download
                        </a>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-[10px] text-muted-foreground opacity-50 italic">Tidak ada lampiran</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Activity Card */}
            <Card className="border-none shadow-sm rounded-xl bg-card overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase border-b border-muted/10 pb-3 mb-6">
                  <History className="h-4 w-4 text-muted-foreground" />
                  Aktivitas Berkas
                </div>
                <div className="relative space-y-4 before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-pink-500/50 before:to-transparent">
                  {job.progressHistory && job.progressHistory.length > 0 ? (
                    job.progressHistory.map((item: any, idx: number) => (
                      <div key={idx} className="relative flex flex-col gap-1 pl-8">
                        <div className="absolute left-0 h-6 w-6 rounded-full border-2 border-card bg-pink-500 flex items-center justify-center shadow-sm">
                          <CheckCircle2 className="h-3 w-3 text-white" />
                        </div>
                        <p className="text-sm font-bold text-foreground leading-tight">{item.description}</p>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                          {formatDate(item.createdAt)} • {new Date(item.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="relative flex flex-col gap-1 pl-8">
                      <div className="absolute left-0 h-6 w-6 rounded-full border-2 border-card bg-pink-500 flex items-center justify-center shadow-sm">
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      </div>
                      <p className="text-sm font-bold text-foreground">Registrasi Awal</p>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{formatDate(job.createdAt)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-[1.5rem] border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Hapus Pekerjaan Ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Seluruh data berkas, progress, dan lampiran akan dihapus secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl font-bold">
              Ya, Hapus Permanen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isUpdateStatusOpen} onOpenChange={setIsUpdateStatusOpen}>
        <DialogContent className="max-w-md rounded-[1.5rem] border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Update Progress</DialogTitle>
            <DialogDescription>
              Perbarui status dan persentase pengerjaan berkas.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={async (e) => {
            e.preventDefault();
            setIsUpdating(true);
            const formData = new FormData(e.currentTarget);
            const status = formData.get("status") as keyof typeof statusConfig;
            const invoiceStatus = formData.get("invoiceStatus");
            const description = formData.get("description") as string;
            const progress = statusConfig[status]?.progress || 0;
            const result = await updateJob(job.id, {
              status,
              progress,
              invoiceStatus,
              description,
              title: job.title,
              category: job.category,
              type: job.type,
              companyName: job.companyName,
              clientId: job.clientId,
              staffId: job.staffId,
              priority: job.priority,
              deadline: job.deadline,
              notes: job.notes,
            });
            if (result.success) {
              toast.success("Progress berhasil diperbarui");
              // Refresh job data
              const refreshed = await getJobById(job.id);
              if (refreshed.success) setJob(refreshed.data);
              setIsUpdateStatusOpen(false);
            } else {
              toast.error(result.error);
            }
            setIsUpdating(false);
          }} className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status Pekerjaan</Label>
              <Select name="status" defaultValue={job.status || "PENDING"}>
                <SelectTrigger className="h-12 rounded-xl border-muted-foreground/20">
                  <SelectValue placeholder="Pilih Status" />
                </SelectTrigger>
                <SelectContent sideOffset={5} className="rounded-xl border-none shadow-2xl">
                  {Object.entries(statusConfig).map(([key, value]) => (
                    <SelectItem key={key} value={key} className="rounded-lg font-bold">
                      {value.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoiceStatus">Status Invoice</Label>
              <Select name="invoiceStatus" defaultValue={job.invoiceStatus || "PENDING"}>
                <SelectTrigger className="h-12 rounded-xl border-muted-foreground/20">
                  <SelectValue placeholder="Pilih Status Invoice" />
                </SelectTrigger>
                <SelectContent sideOffset={5} className="rounded-xl border-none shadow-2xl">
                  <SelectItem value="PENDING" className="rounded-lg font-bold">Pending</SelectItem>
                  <SelectItem value="DP" className="rounded-lg font-bold">DP</SelectItem>
                  <SelectItem value="PAYMENT" className="rounded-lg font-bold">Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Keterangan</Label>
              <textarea 
                name="description" 
                rows={3}
                placeholder="Masukkan catatan perkembangan berkas..." 
                className="w-full rounded-xl border border-muted-foreground/20 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" type="button" onClick={() => setIsUpdateStatusOpen(false)} className="rounded-xl font-bold">
                Batal
              </Button>
              <Button type="submit" disabled={isUpdating} className="bg-pink-500 hover:bg-pink-600 rounded-xl px-8 shadow-lg shadow-pink-500/20 font-bold">
                {isUpdating ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
