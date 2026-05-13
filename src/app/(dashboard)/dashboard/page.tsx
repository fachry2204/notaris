import { StatusCards } from "@/components/dashboard/StatusCards";
import { DashboardOverview } from "@/components/dashboard/Overview";
import { Button } from "@/components/ui/button";
import { Plus, Download, Calendar } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard Overview</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">Home</span>
            <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
            <span className="text-xs font-medium text-primary">Dashboard</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="h-10 rounded-xl bg-card border-border/60 font-semibold gap-2">
            <Calendar className="h-4 w-4" />
            May 12, 2026
          </Button>
          <Button variant="outline" size="sm" className="h-10 rounded-xl bg-card border-border/60 font-semibold gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button size="sm" className="h-10 rounded-xl font-semibold gap-2 shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" />
            New Document
          </Button>
        </div>
      </div>

      <StatusCards />

      <div className="space-y-8">
        <DashboardOverview />
      </div>
    </div>
  );
}
