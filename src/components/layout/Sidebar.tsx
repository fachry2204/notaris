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
  Receipt,
  CheckCircle,
  Clock,
  FileBarChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { signOut, useSession } from "next-auth/react";


export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [logoUrl, setLogoUrl] = React.useState("");
  const [rolePermissions, setRolePermissions] = React.useState<Record<string, boolean> | null>(null);

  React.useEffect(() => {
    const loadSidebarSettings = async () => {
      try {
        const res = await fetch("/api/settings", { cache: "no-store" });
        const result = await res.json();

        if (res.ok && result.success) {
          setLogoUrl(result.data?.branding?.logoUrl || "");
          const matchedRole = result.data?.roles?.find((role: any) => role.key === session?.user?.role);
          setRolePermissions(matchedRole?.permissions || null);
        }
      } catch (error) {
        console.error("Failed to load sidebar branding:", error);
      }
    };

    if (session?.user?.role) {
      loadSidebarSettings();
    }
  }, [session?.user?.role]);

  const menuSections = [
    {
      title: "Utama",
      items: [
        { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard", roles: ["ADMINISTRATOR", "PIMPINAN", "STAFFADMIN", "OB"], permissionKey: "dashboard" },
        { title: "Statistik", icon: PieChart, href: "/dashboard/stats", roles: ["ADMINISTRATOR", "PIMPINAN"] },
      ]
    },
    {
      title: "Operasional",
      items: [
        { title: "Data Client", icon: Users, href: "/dashboard/clients", roles: ["ADMINISTRATOR", "PIMPINAN", "STAFFADMIN", "OB"], permissionKey: "client" },
        { title: "Data Berkas", icon: FileText, href: "/dashboard/jobs/inbound", roles: ["ADMINISTRATOR", "PIMPINAN", "STAFFADMIN", "OB"], permissionKey: "berkas" },
        { title: "Berkas Selesai", icon: CheckCircle, href: "/dashboard/jobs/completed", roles: ["ADMINISTRATOR", "PIMPINAN", "STAFFADMIN", "OB"], permissionKey: "berkas" },
      ]
    },
    {
      title: "Billing",
      items: [
        { title: "Invoice", icon: Receipt, href: "/dashboard/invoice", roles: ["ADMINISTRATOR", "PIMPINAN", "STAFFADMIN", "OB"], permissionKey: "invoice" },
        { title: "Keuangan", icon: CreditCard, href: "/dashboard/finance", roles: ["ADMINISTRATOR", "PIMPINAN", "STAFFADMIN", "OB"], permissionKey: "finance" },
      ]
    },
    {
      title: "Pegawai",
      items: [
        { title: "Absensi", icon: Clock, href: "/dashboard/pegawai/absensi", roles: ["ADMINISTRATOR", "PIMPINAN", "STAFFADMIN", "OB"] },
        { title: "Data Pegawai", icon: Contact, href: "/dashboard/pegawai/data", roles: ["ADMINISTRATOR", "PIMPINAN"] },
        { title: "Laporan Absensi", icon: FileBarChart, href: "/dashboard/pegawai/laporan", roles: ["ADMINISTRATOR", "PIMPINAN"] },
      ]
    },
    {
      title: "UI Elements",
      items: [
        { title: "Produktivitas", icon: PieChart, href: "/dashboard/productivity", roles: ["ADMINISTRATOR", "PIMPINAN"] },
        { title: "Laporan", icon: FileText, href: "/dashboard/reports", roles: ["ADMINISTRATOR", "PIMPINAN"] },
        { title: "Audit Log", icon: ShieldCheck, href: "/dashboard/audit", roles: ["ADMINISTRATOR", "PIMPINAN"] },
        { title: "Settings", icon: Settings, href: "/dashboard/settings", roles: ["ADMINISTRATOR", "PIMPINAN", "STAFFADMIN", "OB"], permissionKey: "settings" },
      ]
    }
  ];

  const userRole = session?.user?.role || "";

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-sidebar border-sidebar-border relative z-[100] shadow-xl text-sm">
      <div className="flex h-20 items-center px-6">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-300">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo kantor"
                className="h-8 w-8 rounded-lg object-contain"
              />
            ) : (
              <FileText className="h-6 w-6 text-primary-foreground" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-foreground leading-none">Notaris</span>
            <span className="font-semibold text-muted-foreground uppercase tracking-widest mt-1">Management</span>
          </div>
        </Link>
      </div>
      <div className="flex-1 px-3 overflow-y-auto min-h-0 custom-scrollbar">
        <div className="space-y-6 py-4">
          {menuSections.map((section) => {
            const filteredItems = section.items.filter(item => 
              item.roles.includes(userRole) &&
              (item.permissionKey ? rolePermissions?.[item.permissionKey] ?? false : true)
            );

            if (filteredItems.length === 0) return null;

            return (
              <div key={section.title} className="px-2">
                <h2 className="mb-3 px-4 font-bold uppercase tracking-widest text-muted-foreground/60">
                  {section.title}
                </h2>
                <div className="space-y-1">
                  {filteredItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link 
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "w-full flex items-center justify-start gap-3 h-11 px-4 rounded-xl transition-all duration-300 cursor-pointer relative group",
                          isActive 
                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90" 
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <item.icon className={cn("h-[18px] w-[18px] transition-transform group-hover:scale-110", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary")} />
                        <span className="font-semibold">{item.title}</span>
                        {isActive && (
                          <div className="absolute right-2 h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-auto p-4 border-t border-sidebar-border bg-muted/20">
        <div className="flex items-center gap-3 px-2 py-3">
          <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
            <AvatarImage src={`https://avatar.vercel.sh/${session?.user?.username}.png`} />
            <AvatarFallback className="bg-primary/10 text-primary">{session?.user?.fullName?.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-bold text-foreground truncate">{session?.user?.fullName}</span>
            <span className="font-medium text-muted-foreground uppercase truncate">{session?.user?.role}</span>
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
