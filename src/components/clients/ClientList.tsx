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
  MoreHorizontal, 
  UserPlus, 
  Phone, 
  Mail, 
  MapPin,
  Calendar
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

import { getClients, deleteClient } from "@/lib/actions/clients";
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

export function ClientList() {
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

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
                <TableHead className="w-[300px]">Client</TableHead>
                <TableHead>Kontak</TableHead>
                <TableHead>NPWP</TableHead>
                <TableHead>Alamat</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
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
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                          <AvatarImage src={`https://avatar.vercel.sh/${client.name}.png`} />
                          <AvatarFallback>{client.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-semibold">{client.name}</span>
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
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm">
                        {client.email && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-3.5 w-3.5" />
                            {client.email}
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-3.5 w-3.5" />
                            {client.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-secondary/50 px-2 py-1 rounded">
                        {client.npwp || "-"}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate max-w-[200px]">{client.address || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuGroup>
                            <DropdownMenuLabel>Opsi Client</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/clients/${client.id}`)}>
                              Lihat Detail
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/clients/${client.id}/edit`)}>
                              Edit Data
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => setDeleteId(client.id)}
                            >
                              Hapus Client
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
