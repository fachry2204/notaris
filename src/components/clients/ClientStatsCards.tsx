"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getClientStats } from "@/lib/actions/clients";
import { 
  Users, 
  User, 
  Building2,
  Check,
  XCircle,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardsProps {
  activeFilter: string;
  onFilterChange: (filter: any) => void;
}

export function ClientStatsCards({ activeFilter, onFilterChange }: StatsCardsProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const result = await getClientStats();
      if (result.success) {
        setStats(result.data);
      }
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-none shadow-sm animate-pulse bg-muted/20 h-24 rounded-2xl"></Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const cardData = [
    {
      id: "all",
      label: "Total Client",
      value: stats.total,
      icon: Users,
      color: "text-pink-600",
      bg: "bg-pink-500/[0.03]",
      border: "border-pink-500"
    },
    {
      id: "individual",
      label: "User Perorangan",
      value: stats.individual,
      icon: User,
      color: "text-purple-600",
      bg: "bg-purple-500/[0.03]",
      border: "border-purple-500"
    },
    {
      id: "corporate",
      label: "User Badan Hukum",
      value: stats.corporate,
      icon: Building2,
      color: "text-blue-600",
      bg: "bg-blue-500/[0.03]",
      border: "border-blue-500"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
      <button 
        onClick={() => onFilterChange("all")}
        className={cn(
          "p-5 rounded-[2rem] text-left transition-all duration-300 relative overflow-hidden group",
          activeFilter === "all" 
            ? "bg-pink-500 text-white shadow-lg shadow-pink-500/20 ring-4 ring-pink-500/10" 
            : "bg-card hover:bg-muted/50 shadow-sm border-none"
        )}
      >
        <div className="relative z-10 space-y-0.5">
          <p className={cn("text-[10px] font-black uppercase tracking-widest", activeFilter === "all" ? "text-white/80" : "text-muted-foreground")}>Total Client</p>
          <h3 className="text-3xl font-black">{stats.total}</h3>
        </div>
        <Users className={cn("absolute -right-2 -bottom-2 h-16 w-16 opacity-10 transition-transform group-hover:scale-110", activeFilter === "all" ? "text-white" : "text-pink-500")} />
      </button>

      <button 
        onClick={() => onFilterChange("individual")}
        className={cn(
          "p-5 rounded-[2rem] text-left transition-all duration-300 relative overflow-hidden group",
          activeFilter === "individual" 
            ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20 ring-4 ring-purple-500/10" 
            : "bg-card hover:bg-muted/50 shadow-sm border-none"
        )}
      >
        <div className="relative z-10 space-y-0.5">
          <p className={cn("text-[10px] font-black uppercase tracking-widest", activeFilter === "individual" ? "text-white/80" : "text-muted-foreground")}>Client Perorangan</p>
          <h3 className="text-3xl font-black">{stats.individual}</h3>
        </div>
        <User className={cn("absolute -right-2 -bottom-2 h-16 w-16 opacity-10 transition-transform group-hover:scale-110", activeFilter === "individual" ? "text-white" : "text-purple-500")} />
      </button>

      <button 
        onClick={() => onFilterChange("corporate")}
        className={cn(
          "p-5 rounded-[2rem] text-left transition-all duration-300 relative overflow-hidden group",
          activeFilter === "corporate" 
            ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20 ring-4 ring-blue-500/10" 
            : "bg-card hover:bg-muted/50 shadow-sm border-none"
        )}
      >
        <div className="relative z-10 space-y-0.5">
          <p className={cn("text-[10px] font-black uppercase tracking-widest", activeFilter === "corporate" ? "text-white/80" : "text-muted-foreground")}>Badan Hukum</p>
          <h3 className="text-3xl font-black">{stats.corporate}</h3>
        </div>
        <Building2 className={cn("absolute -right-2 -bottom-2 h-16 w-16 opacity-10 transition-transform group-hover:scale-110", activeFilter === "corporate" ? "text-white" : "text-blue-500")} />
      </button>
    </div>
  );
}
