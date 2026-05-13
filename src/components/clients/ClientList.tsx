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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

// Mock data for initial UI
const initialClients = [
  {
    id: "1",
    name: "Budi Santoso",
    email: "budi@example.com",
    phone: "08123456789",
    address: "Jl. Melati No. 12, Jakarta Selatan",
    npwp: "12.345.678.9-012.000",
    birthday: "1985-05-11",
    type: "Perorangan"
  },
  {
    id: "2",
    name: "Siti Aminah",
    email: "siti@example.com",
    phone: "08567891234",
    address: "Jl. Dago No. 45, Bandung",
    npwp: "98.765.432.1-012.000",
    birthday: "1992-08-24",
    type: "Perorangan"
  },
  {
    id: "3",
    name: "Hendra Wijaya",
    email: "hendra@maju-terus.co.id",
    phone: "081122334455",
    address: "Sudirman Central Business District, Jakarta",
    npwp: "01.222.333.4-555.000",
    birthday: "1978-12-05",
    type: "Badan Hukum",
    company: "PT Maju Terus Jaya"
  },
  {
    id: "4",
    name: "Maya Sartika",
    email: "maya@berkah-mandiri.com",
    phone: "087788990011",
    address: "Kawasan Industri Jababeka, Bekasi",
    npwp: "02.333.444.5-666.000",
    birthday: "1988-03-15",
    type: "Badan Hukum",
    company: "CV Berkah Mandiri"
  },
  {
    id: "5",
    name: "Rizky Ramadhan",
    email: "rizky.r@gmail.com",
    phone: "089900112233",
    address: "Perumahan BSD City, Tangerang",
    npwp: "44.555.666.7-888.000",
    birthday: "1995-10-10",
    type: "Perorangan"
  }
];

export function ClientList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [clients, setClients] = useState(initialClients);

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
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
            {filteredClients.map((client) => (
              <TableRow key={client.id} className="group transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                      <AvatarImage src={`https://avatar.vercel.sh/${client.name}.png`} />
                      <AvatarFallback>{client.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-semibold">{client.name}</span>
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
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      {client.email}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" />
                      {client.phone}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <code className="text-xs bg-secondary/50 px-2 py-1 rounded">
                    {client.npwp}
                  </code>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate max-w-[200px]">{client.address}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Opsi Client</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Lihat Detail</DropdownMenuItem>
                      <DropdownMenuItem>Edit Data</DropdownMenuItem>
                      <DropdownMenuItem>Riwayat Berkas</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">Hapus Client</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
