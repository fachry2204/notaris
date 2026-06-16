"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isPegawai = role === "STAFFADMIN" || role === "OB";

  const navItems = isPegawai 
    ? [
        { href: "/dashboard", iconSrc: "/uploads/home.png", label: "Home" },
        { href: "/dashboard/pegawai/absensi/absenku", iconSrc: "/uploads/camera.png", label: "Absen" },
        { href: "/dashboard/jobs/inbound", iconSrc: "/uploads/lapor.png", label: "Berkas" },
      ]
    : [
        { href: "/dashboard", iconSrc: "/uploads/home.png", label: "Home" },
        { href: "/dashboard/jobs/inbound", iconSrc: "/uploads/lapor.png", label: "Berkas" },
        { href: "/dashboard/settings", icon: Settings, label: "Setting" },
      ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t bg-background/90 backdrop-blur-lg px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full space-y-1 transition-all",
              isActive ? "text-pink-500 scale-110" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {item.iconSrc ? (
              <img 
                src={item.iconSrc} 
                alt={item.label} 
                className={cn("h-6 w-6 object-contain transition-all duration-300", !isActive && "opacity-60 grayscale")} 
              />
            ) : item.icon ? (
              <item.icon className={cn("h-5 w-5", isActive && "fill-pink-500/20")} />
            ) : null}
            <span className="text-[10px] font-bold">{item.label}</span>
          </Link>
        );
      })}
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="flex flex-col items-center justify-center w-full h-full space-y-1 text-rose-500 hover:text-rose-600 transition-all active:scale-95"
      >
        <img 
          src="/uploads/checkin.png" 
          alt="Keluar" 
          className="h-6 w-6 object-contain opacity-80" 
        />
        <span className="text-[10px] font-bold">Keluar</span>
      </button>
    </div>
  );
}
