"use client";

import React, { useState } from "react";
import { ClientList } from "@/components/clients/ClientList";
import { ClientStatsCards } from "@/components/clients/ClientStatsCards";

export type ClientFilterType = "all" | "individual" | "corporate";

export default function ClientsPage() {
  const [filter, setFilter] = useState<ClientFilterType>("all");

  return (
    <div className="space-y-6 p-4 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-0.5">
        <h1 className="text-2xl font-black tracking-tight text-foreground">Data Client</h1>
        <p className="text-muted-foreground text-sm font-medium">
          Kelola informasi lengkap client dan riwayat kerjasamanya.
        </p>
      </div>

      <ClientStatsCards activeFilter={filter} onFilterChange={setFilter} />

      <ClientList filterType={filter} />
    </div>
  );
}
