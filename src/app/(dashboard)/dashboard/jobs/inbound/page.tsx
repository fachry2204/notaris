import React from "react";
import { JobTable } from "@/components/jobs/JobTable";
import { Button } from "@/components/ui/button";
import { Plus, Filter, LayoutGrid, List } from "lucide-react";
import Link from "next/link";

export default function InboundJobsPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Berkas Masuk</h1>
          <p className="text-muted-foreground">
            Daftar seluruh berkas yang baru masuk dan butuh penanganan awal.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Link href="/dashboard/jobs/new">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Berkas Baru
            </Button>
          </Link>
        </div>
      </div>

      <JobTable />
    </div>
  );
}
