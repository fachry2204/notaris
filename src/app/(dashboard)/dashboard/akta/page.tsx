"use client";

import React from "react";
import { AktaTable } from "@/components/jobs/AktaTable";

export default function DaftarAktaPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold tracking-tight">Daftar Akta</h1>
          <p className="text-muted-foreground text-sm">
            Daftar seluruh akta dan pekerjaan beserta filternya.
          </p>
        </div>
      </div>
      
      <AktaTable />
    </div>
  );
}
