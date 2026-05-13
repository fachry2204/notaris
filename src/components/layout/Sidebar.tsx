"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FileText,
  FileCheck,
  CreditCard,
  PieChart,
  Settings,
  Bell,
  Search,
  LogOut,
  Calendar,
  History,
  ShieldCheck,
  Menu,
  UserCheck,
  Contact,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { signOut, useSession } from "next-auth/react";


export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const menuSections = [
    {
      title: "Application",
      items: [
        { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
        { title: "Data Client", icon: Users, href: "/dashboard/clients" },
        { title: "Data Berkas", icon: FileText, href: "/dashboard/jobs/inbound" },
        { title: "Berkas Selesai", icon: FileCheck, href: "/dashboard/jobs/completed" },
        { title: "Keuangan", icon: CreditCard, href: "/dashboard/finance" },
      ]
    },
    {
      title: "Pegawai",
      items: [
        { title: "Absensi", icon: UserCheck, href: "/dashboard/pegawai/absensi" },
        { title: "Data Pegawai", icon: Contact, href: "/dashboard/pegawai/data" },
        { title: "Laporan Absensi", icon: ClipboardList, href: "/dashboard/pegawai/laporan" },
      ]
    },
    {
      title: "UI Elements",
      items: [
        { title: "Produktivitas", icon: PieChart, href: "/dashboard/productivity" },
        { title: "Laporan", icon: FileText, href: "/dashboard/reports" },
        { title: "Audit Log", icon: ShieldCheck, href: "/dashboard/audit" },
        { title: "Settings", icon: Settings, href: "/dashboard/settings" },
      ]
    }
  ];

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-sidebar border-sidebar-border">
      <div className="flex h-20 items-center px-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <FileText className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-foreground leading-none">Notaris</span>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mt-1">Management</span>
          </div>
        </Link>
      </div>
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-6 py-4">
          {menuSections.map((section) => (
            <div key={section.title} className="px-2">
              <h2 className="mb-3 px-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">
                {section.title}
              </h2>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start gap-3 h-11 px-4 rounded-xl transition-all duration-200",
                          isActive 
                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90" 
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <item.icon className={cn("h-[18px] w-[18px]", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                        <span className="font-medium">{item.title}</span>
                      </Button>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="mt-auto p-4 border-t border-sidebar-border bg-muted/20">
        <div className="flex items-center gap-3 px-2 py-3">
          <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
            <AvatarImage src={`https://avatar.vercel.sh/${session?.user?.username}.png`} />
            <AvatarFallback className="bg-primary/10 text-primary">{session?.user?.fullName?.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-bold text-foreground truncate">{session?.user?.fullName}</span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase truncate">{session?.user?.role}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
