import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-sidebar relative pb-16 md:pb-0">

      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden relative z-10">
        <Header />
        <main className="flex-1 overflow-y-auto bg-background/80 backdrop-blur-sm p-4 md:p-8">
          <div className="mx-auto max-w-full h-full">
            {children}
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
