 "use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonVariants, Button } from "@/components/ui/button";
import { UserCheck, Calendar, Loader2, Clock3, MapPin, Eye, Edit, Trash2, AlertTriangle, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getAbsensiDashboardData, deleteAttendance } from "@/lib/actions/attendance";
import { toast } from "sonner";
import { FilterCepat } from "@/components/dashboard/FilterCepat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { editAttendance } from "@/lib/actions/attendance";

export default function AbsensiPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [role, setRole] = useState<string | null>(null);
  const [allStaffAttendance, setAllStaffAttendance] = useState<any[]>([]);
  const [myHistory, setMyHistory] = useState<any[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [detailItem, setDetailItem] = useState<any>(null);
  const [editItem, setEditItem] = useState<any>(null);
  const [editCheckIn, setEditCheckIn] = useState("");
  const [editCheckOut, setEditCheckOut] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const todayLabel = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  useEffect(() => {
    const media = window.matchMedia("(max-width: 768px)");
    const apply = () => setIsMobile(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  const loadAttendance = async (start?: Date, end?: Date) => {
    setLoadingAttendance(true);
    const result = await getAbsensiDashboardData(start, end);

    if (result.success) {
      setRole(result.role || null);
      if (result.role === "ADMINISTRATOR" || result.role === "PIMPINAN") {
        setAllStaffAttendance((result.data as any[]) || []);
      } else {
        setTodayAttendance((result.data as any)?.today?.attendance || null);
        setMyHistory((result.data as any)?.history || []);
      }
    } else {
      toast.error(result.error);
    }

    setLoadingAttendance(false);
  };

  useEffect(() => {
    loadAttendance();
  }, []);

  const handleFilterChange = (start: Date | null, end: Date | null, type: string) => {
    toast.info(`Filter ${type} diterapkan`);
    loadAttendance(start || undefined, end || undefined);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    const result = await deleteAttendance(deleteId);
    if (result.success) {
      toast.success(result.message);
      setDeleteId(null);
      // Reload current filter
      loadAttendance();
    } else {
      toast.error(result.error);
    }
    setIsDeleting(false);
  };

  const openEditModal = (item: any) => {
    setEditItem(item);
    // Format to datetime-local expected format: YYYY-MM-DDTHH:mm
    if (item.checkIn) {
      const d = new Date(item.checkIn);
      setEditCheckIn(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
    } else {
      setEditCheckIn("");
    }
    if (item.checkOut) {
      const d = new Date(item.checkOut);
      setEditCheckOut(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
    } else {
      setEditCheckOut("");
    }
  };

  const handleEditSave = async () => {
    if (!editItem) return;
    setIsEditing(true);
    const cIn = editCheckIn ? new Date(editCheckIn) : null;
    const cOut = editCheckOut ? new Date(editCheckOut) : null;
    
    const result = await editAttendance(editItem.id, cIn, cOut);
    if (result.success) {
      toast.success(result.message);
      setEditItem(null);
      loadAttendance();
    } else {
      toast.error(result.error);
    }
    setIsEditing(false);
  };

  if (role === null) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getLateMinutes = (dateStr: any) => {
    if (!dateStr) return 0;
    const d = new Date(dateStr);
    const totalMins = d.getHours() * 60 + d.getMinutes();
    const targetMins = 9 * 60;
    return totalMins > targetMins ? totalMins - targetMins : 0;
  };

  const getOvertimeMinutes = (dateStr: any) => {
    if (!dateStr) return 0;
    const d = new Date(dateStr);
    const totalMins = d.getHours() * 60 + d.getMinutes();
    const targetMins = 18 * 60;
    return totalMins > targetMins ? totalMins - targetMins : 0;
  };

  const formatMinutesAsTime = (totalMinutes: number) => {
    if (totalMinutes <= 0) return "-";
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  };

  const getWorkHours = (checkInStr: any, checkOutStr: any) => {
    if (!checkInStr || !checkOutStr) return "-";
    const t1 = new Date(checkInStr).getTime();
    const t2 = new Date(checkOutStr).getTime();
    const diffMins = Math.floor((t2 - t1) / (1000 * 60));
    if (diffMins <= 0) return "-";
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  };

  if (role === "ADMINISTRATOR" || role === "PIMPINAN") {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Absensi Pegawai</h1>
            <p className="text-sm text-muted-foreground mt-1">Pantau kehadiran seluruh pegawai secara real-time hari ini.</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Cari nama pegawai..." 
                className="pl-9 h-10 rounded-xl bg-background border-muted"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <FilterCepat onFilterChange={handleFilterChange} defaultFilter="Bulan Ini" />
          </div>
        </div>

        <Card className="border-none bg-card/60 backdrop-blur-xl shadow-2xl shadow-primary/5 rounded-3xl overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[10px] uppercase tracking-widest text-muted-foreground bg-muted/40 font-black">
                  <tr>
                    <th className="px-6 py-4 whitespace-nowrap">Tanggal</th>
                    <th className="px-6 py-4 whitespace-nowrap">Pegawai</th>
                    <th className="px-6 py-4 whitespace-nowrap text-center">Check In</th>
                    <th className="px-6 py-4 whitespace-nowrap text-center">Check Out</th>
                    <th className="px-6 py-4 whitespace-nowrap text-center">Jam Kerja</th>
                    <th className="px-6 py-4 whitespace-nowrap text-center">Telat</th>
                    <th className="px-6 py-4 whitespace-nowrap text-center">Lembur</th>
                    <th className="px-6 py-4 whitespace-nowrap">Lokasi</th>
                    <th className="px-6 py-4 whitespace-nowrap text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {loadingAttendance ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                          <h3 className="font-bold text-lg mb-1">Memuat Data...</h3>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <>
                      {allStaffAttendance
                        .filter((item) => item.staffName?.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((item: any) => {
                          const parsedNotes = item.notes ? JSON.parse(item.notes) : {};
                      return (
                        <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                          <td className="px-6 py-3 text-xs font-semibold text-foreground whitespace-nowrap">
                            {item.date ? new Date(item.date).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric"
                            }) : "-"}
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold text-foreground">{item.staffName}</span>
                              <span className="text-[9px] font-bold tracking-widest text-primary uppercase mt-0.5">
                                {item.staffRole || "PEGAWAI"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-center">
                            <span className={cn("text-xs font-bold", item.checkIn ? "text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded" : "text-muted-foreground")}>
                              {item.checkIn ? new Date(item.checkIn).toLocaleTimeString("id-ID") : "-"}
                            </span>
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-center">
                            <span className={cn("text-xs font-bold", item.checkOut ? "text-blue-600 bg-blue-50 px-2 py-0.5 rounded" : "text-muted-foreground")}>
                              {item.checkOut ? new Date(item.checkOut).toLocaleTimeString("id-ID") : "-"}
                            </span>
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-center">
                            <span className={cn("text-xs font-bold", item.checkOut ? "text-purple-600 bg-purple-50 px-2 py-0.5 rounded" : "text-muted-foreground")}>
                              {getWorkHours(item.checkIn, item.checkOut)}
                            </span>
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-center">
                            <span className={cn("text-xs font-bold", getLateMinutes(item.checkIn) > 0 ? "text-rose-600 bg-rose-50 px-2 py-0.5 rounded" : "text-muted-foreground")}>
                              {formatMinutesAsTime(getLateMinutes(item.checkIn))}
                            </span>
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-center">
                            <span className={cn("text-xs font-bold", getOvertimeMinutes(item.checkOut) > 0 ? "text-amber-600 bg-amber-50 px-2 py-0.5 rounded" : "text-muted-foreground")}>
                              {formatMinutesAsTime(getOvertimeMinutes(item.checkOut))}
                            </span>
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                              <span className="truncate max-w-[200px]">
                                {parsedNotes?.checkIn?.locationLabel || parsedNotes?.locationLabel || "Lokasi tidak diketahui"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button variant="outline" size="icon" className="h-7 w-7 rounded-md text-blue-500 hover:text-blue-600 hover:bg-blue-50" title="Detail" onClick={() => setDetailItem({ ...item, parsedNotes })}>
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="outline" size="icon" className="h-7 w-7 rounded-md text-amber-500 hover:text-amber-600 hover:bg-amber-50" title="Edit" onClick={() => openEditModal(item)}>
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="outline" size="icon" className="h-7 w-7 rounded-md text-rose-500 hover:text-rose-600 hover:bg-rose-50" title="Hapus" onClick={() => setDeleteId(item.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  
                  {allStaffAttendance.filter((item) => item.staffName?.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="h-16 w-16 bg-muted/20 rounded-full flex items-center justify-center text-muted-foreground mb-4">
                            <Search className="h-8 w-8" />
                          </div>
                          <h3 className="font-bold text-lg mb-1">Data tidak ditemukan</h3>
                          <p className="text-muted-foreground text-sm max-w-sm">
                            Tidak ada data absensi pegawai yang cocok dengan pencarian Anda.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                  </>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent className="rounded-3xl p-6 sm:max-w-[400px]">
            <AlertDialogHeader>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 mb-4">
                <AlertTriangle className="h-6 w-6 text-rose-600" />
              </div>
              <AlertDialogTitle className="text-center font-bold text-xl">Hapus Data Absensi?</AlertDialogTitle>
              <AlertDialogDescription className="text-center text-muted-foreground mt-2">
                Tindakan ini tidak dapat dibatalkan. Data absensi pegawai ini akan dihapus secara permanen dari sistem.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-6">
              <AlertDialogCancel disabled={isDeleting} className="w-full sm:w-1/2 rounded-xl border-border hover:bg-muted font-bold h-11 m-0">
                Batal
              </AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full sm:w-1/2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold h-11 m-0"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Ya, Hapus
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Detail Modal */}
        <Dialog open={!!detailItem} onOpenChange={(open) => !open && setDetailItem(null)}>
          <DialogContent className="rounded-3xl p-0 sm:max-w-[500px] max-h-[90vh] flex flex-col overflow-hidden border-none shadow-2xl">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 text-white shrink-0">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tight text-white">Detail Absensi</DialogTitle>
                <DialogDescription className="text-blue-100 font-medium">
                  Informasi lengkap catatan kehadiran pegawai.
                </DialogDescription>
              </DialogHeader>
            </div>
            
            <div className="p-6 space-y-5 bg-background overflow-y-auto flex-1">
              {detailItem && (
                <>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                      {detailItem.staffName?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-lg leading-tight">{detailItem.staffName}</p>
                      <p className="text-xs font-black tracking-widest text-primary uppercase">{detailItem.staffRole}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Check In</p>
                      <p className="font-bold text-emerald-600">{detailItem.checkIn ? new Date(detailItem.checkIn).toLocaleString("id-ID") : "-"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Check Out</p>
                      <p className="font-bold text-blue-600">{detailItem.checkOut ? new Date(detailItem.checkOut).toLocaleString("id-ID") : "-"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Jam Kerja</p>
                      <p className="font-bold text-purple-600">{getWorkHours(detailItem.checkIn, detailItem.checkOut)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Keterlambatan</p>
                      <p className="font-bold text-rose-600">{getLateMinutes(detailItem.checkIn) > 0 ? formatMinutesAsTime(getLateMinutes(detailItem.checkIn)) : "-"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Waktu Lembur</p>
                      <p className="font-bold text-amber-600">{getOvertimeMinutes(detailItem.checkOut) > 0 ? formatMinutesAsTime(getOvertimeMinutes(detailItem.checkOut)) : "-"}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/50">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Lokasi Check In</p>
                    <div className="flex items-start gap-2 bg-muted/30 p-3 rounded-xl">
                      <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <p className="text-sm font-medium">{detailItem.parsedNotes?.checkIn?.locationLabel || detailItem.parsedNotes?.locationLabel || "Tidak diketahui"}</p>
                    </div>
                  </div>

                  {(detailItem.parsedNotes?.checkIn?.photoPath || detailItem.parsedNotes?.checkOut?.photoPath) && (
                    <div className="pt-4 border-t border-border/50">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Bukti Foto Absensi</p>
                      <div className="grid grid-cols-2 gap-4">
                        {detailItem.parsedNotes?.checkIn?.photoPath && (
                          <div className="space-y-1.5 cursor-pointer group" onClick={() => setSelectedImage(detailItem.parsedNotes.checkIn.photoPath)}>
                            <p className="text-[10px] font-bold text-emerald-600 text-center">Foto Check In</p>
                            <div className="aspect-[3/4] relative rounded-xl overflow-hidden border border-border/50 shadow-sm">
                              <img src={detailItem.parsedNotes.checkIn.photoPath} alt="Check In" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Eye className="h-6 w-6 text-white" />
                              </div>
                            </div>
                          </div>
                        )}
                        {detailItem.parsedNotes?.checkOut?.photoPath && (
                          <div className="space-y-1.5 cursor-pointer group" onClick={() => setSelectedImage(detailItem.parsedNotes.checkOut.photoPath)}>
                            <p className="text-[10px] font-bold text-blue-600 text-center">Foto Check Out</p>
                            <div className="aspect-[3/4] relative rounded-xl overflow-hidden border border-border/50 shadow-sm">
                              <img src={detailItem.parsedNotes.checkOut.photoPath} alt="Check Out" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Eye className="h-6 w-6 text-white" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            <DialogFooter className="p-6 pt-4 bg-background sm:justify-center border-t border-border/50 shrink-0">
              <Button onClick={() => setDetailItem(null)} className="w-full rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold h-11">
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Modal */}
        <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
          <DialogContent className="rounded-3xl p-6 sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Edit className="h-5 w-5 text-amber-500" />
                Edit Data Absensi
              </DialogTitle>
              <DialogDescription>
                Ubah waktu check-in atau check-out untuk pegawai <b>{editItem?.staffName}</b>.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="checkIn" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Check In Time</Label>
                <Input 
                  id="checkIn" 
                  type="datetime-local" 
                  value={editCheckIn} 
                  onChange={(e) => setEditCheckIn(e.target.value)} 
                  className="rounded-xl bg-muted/30 h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkOut" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Check Out Time</Label>
                <Input 
                  id="checkOut" 
                  type="datetime-local" 
                  value={editCheckOut} 
                  onChange={(e) => setEditCheckOut(e.target.value)} 
                  className="rounded-xl bg-muted/30 h-11"
                />
              </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button variant="outline" onClick={() => setEditItem(null)} disabled={isEditing} className="w-full sm:w-1/2 rounded-xl font-bold h-11">
                Batal
              </Button>
              <Button onClick={handleEditSave} disabled={isEditing} className="w-full sm:w-1/2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold h-11">
                {isEditing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Full Image Viewer Modal */}
        <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
          <DialogContent className="max-w-3xl bg-transparent border-none p-0 shadow-none">
            {selectedImage && (
              <div className="relative flex flex-col items-center justify-center">
                <img src={selectedImage} alt="Bukti Absensi" className="max-h-[85vh] w-auto max-w-full rounded-2xl shadow-2xl" />
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setSelectedImage(null)} 
                  className="absolute -top-4 -right-4 h-10 w-10 rounded-full bg-white text-black hover:bg-gray-200 border-none shadow-xl"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

      </div>
    );
  }

  const attendanceActionLabel = todayAttendance?.checkIn && !todayAttendance?.checkOut
      ? "Absen Pulang"
      : "Absen Masuk";

  const attendanceStatusTitle = todayAttendance?.checkIn
      ? "Absensi Hari Ini Sudah Tercatat"
      : "Belum Ada Data Absensi";

  const attendanceStatusDescription = todayAttendance?.checkIn && !todayAttendance?.checkOut
      ? `Anda sudah absen masuk pada ${new Date(todayAttendance.checkIn).toLocaleTimeString("id-ID")}. Silakan lanjutkan absen pulang saat jam kerja selesai.`
      : todayAttendance?.checkIn && todayAttendance?.checkOut
        ? `Absensi masuk tercatat pukul ${new Date(todayAttendance.checkIn).toLocaleTimeString("id-ID")} dan absen pulang pukul ${new Date(todayAttendance.checkOut).toLocaleTimeString("id-ID")}.`
        : "Silakan lakukan absensi kehadiran hari ini untuk mencatat waktu masuk kerja Anda.";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {!isMobile && (
        <Card className="border border-amber-500/30 bg-amber-500/10 rounded-2xl">
          <CardContent className="p-5">
            <p className="text-sm font-bold text-amber-700">Mohon Buka Di Mobile / Aplikasi</p>
            <p className="mt-1 text-xs text-amber-700/80">
              Menu absensi membutuhkan akses kamera dan lokasi GPS. Silakan buka melalui perangkat mobile untuk melakukan absensi.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Rekap Absensi</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">Pegawai</span>
            <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
            <span className="text-xs font-medium text-primary">Riwayat</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <FilterCepat onFilterChange={(start, end, type) => toast.info(`Filter ${type} diterapkan`)} defaultFilter="Bulan Ini" />
          {isMobile ? (
            <Link href="/dashboard/pegawai/absensi/absenku" className={cn(buttonVariants({ size: "sm" }), "h-10 rounded-xl font-semibold gap-2 shadow-lg shadow-primary/20 bg-pink-500 hover:bg-pink-600")}>
              <UserCheck className="h-4 w-4" />
              {attendanceActionLabel}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => toast.info("Mohon buka menu absensi melalui perangkat mobile.")}
              className={cn(buttonVariants({ size: "sm" }), "h-10 rounded-xl font-semibold gap-2 shadow-lg shadow-primary/20 bg-pink-500 opacity-60")}
            >
              <UserCheck className="h-4 w-4" />
              {attendanceActionLabel}
            </button>
          )}
        </div>
      </div>

      <Card className="border-none bg-card/60 backdrop-blur-xl shadow-2xl shadow-primary/5 rounded-3xl overflow-hidden">
        <CardHeader className="border-b border-border/60 pb-4 bg-muted/20">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Clock3 className="h-5 w-5 text-primary" />
            Riwayat Kehadiran Anda
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] uppercase tracking-widest text-muted-foreground bg-muted/40 font-black">
                <tr>
                  <th className="px-6 py-4 whitespace-nowrap">Tanggal</th>
                  <th className="px-6 py-4 whitespace-nowrap">Masuk</th>
                  <th className="px-6 py-4 whitespace-nowrap">Pulang</th>
                  <th className="px-6 py-4 whitespace-nowrap text-center">Jam Kerja</th>
                  <th className="px-6 py-4 whitespace-nowrap text-center">Telat</th>
                  <th className="px-6 py-4 whitespace-nowrap text-center">Lembur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {myHistory.length > 0 ? (
                  myHistory.map((item: any) => (
                    <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4 font-bold text-foreground whitespace-nowrap">
                        {new Date(item.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.checkIn ? (
                          <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                            {new Date(item.checkIn).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        ) : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.checkOut ? (
                          <span className="inline-flex items-center gap-1.5 font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                            {new Date(item.checkOut).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        ) : "-"}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap font-bold text-slate-600 bg-slate-50/50">
                        {getWorkHours(item.checkIn, item.checkOut)}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        {getLateMinutes(item.checkIn) > 0 ? (
                          <span className="font-bold text-rose-500">{formatMinutesAsTime(getLateMinutes(item.checkIn))}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        {getOvertimeMinutes(item.checkOut) > 0 ? (
                          <span className="font-bold text-amber-500">{formatMinutesAsTime(getOvertimeMinutes(item.checkOut))}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      Belum ada riwayat absensi.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
