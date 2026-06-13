"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  UserPlus, 
  Phone, 
  Mail, 
  MapPin,
  Calendar,
  MessageSquare
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Trash2 } from "lucide-react";

import { getClients, deleteClient } from "@/lib/actions/clients";
import { formatClientId } from "@/lib/utils/client";
import { toast } from "sonner";
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

interface ClientListProps {
  filterType?: string;
}

export function ClientList({ filterType = "all" }: ClientListProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchClients = async () => {
    setLoading(true);
    const result = await getClients();
    if (result.success) {
      setClients(result.data || []);
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    
    const result = await deleteClient(deleteId);
    if (result.success) {
      toast.success("Client berhasil dihapus");
      fetchClients();
    } else {
      toast.error(result.error);
    }
    setDeleteId(null);
  };

  const filteredClients = clients.filter(client => {
    // Filter by type from cards
    if (filterType !== "all" && client.type !== filterType) return false;
    
    // Filter by search term
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()));
      
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Cari client..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Link href="/dashboard/clients/new">
          <Button className="gap-2 h-10 px-4 rounded-xl shadow-lg shadow-pink-500/20">
            <UserPlus className="h-4 w-4" />
            Tambah Client
          </Button>
        </Link>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-pink-500 border-t-transparent"></div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[300px] pl-10">Client</TableHead>
                <TableHead>Jenis Client</TableHead>
                <TableHead>Nomor Handphone</TableHead>
                <TableHead>Alamat</TableHead>
                <TableHead className="text-right pr-10">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                    Tidak ada data client.
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
                  <TableRow key={client.id} className="group transition-colors">
                    <TableCell className="pl-10">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">{client.name}</span>
                          <span className="text-[9px] font-black bg-pink-500/10 text-pink-500 px-1.5 py-0.5 rounded border border-pink-500/20 uppercase tracking-wider">
                            {formatClientId(client.indexNo)}
                          </span>
                        </div>
                        {client.birthday && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                            <Calendar className="h-3 w-3" />
                            {new Date(client.birthday).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}
                            {new Date(client.birthday).getMonth() === new Date().getMonth() && 
                             new Date(client.birthday).getDate() === new Date().getDate() && (
                              <Badge variant="outline" className="ml-2 bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] py-0 h-4">
                                HUT 🎂
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`font-bold text-[10px] uppercase tracking-wider py-0.5 px-3 rounded-full ${
                          client.type === "corporate" 
                            ? "bg-blue-500/10 text-blue-600 border-blue-500/20" 
                            : "bg-purple-500/10 text-purple-600 border-purple-500/20"
                        }`}
                      >
                        {client.type === "corporate" ? "Perusahaan" : "Individu"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-secondary/50 px-2 py-1 rounded">
                          {client.phone || "-"}
                        </code>
                        {client.phone && (
                          <a 
                            href={`https://wa.me/${client.phone.replace(/\D/g, '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="h-7 w-7 inline-flex items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                            title="Chat WhatsApp"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate max-w-[200px]">{client.address || "-"}</span>
                      </div>
                    </TableCell>
                     <TableCell className="text-right pr-10">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 rounded-lg border-pink-200 text-pink-600 font-bold text-[10px] uppercase hover:bg-pink-500 hover:text-white transition-all shadow-sm"
                          onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                        >
                          Detail
                        </Button>
                        {(session?.user?.role === "ADMINISTRATOR" || session?.user?.role === "PIMPINAN") && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                            onClick={() => setDeleteId(client.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Ini akan menghapus data client secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
