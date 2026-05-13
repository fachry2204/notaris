import React from "react";
import { ClientList } from "@/components/clients/ClientList";

export default function ClientsPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Data Client</h1>
        <p className="text-muted-foreground">
          Kelola informasi lengkap client dan riwayat kerjasamanya.
        </p>
      </div>

      <ClientList />
    </div>
  );
}
