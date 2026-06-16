"use client";

import React from "react";
import { Bell, Search, Moon, Sun, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { setTheme, theme } = useTheme();

  return (
    <header className="hidden md:flex sticky top-0 z-30 h-20 w-full items-center justify-between border-b bg-background px-8 border-border/40 shadow-sm">
      <div className="flex items-center gap-6 flex-1">
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="relative w-full max-w-lg">
          <Search className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground/60" />
          <Input
            placeholder="Search here..."
            className="w-full bg-muted/30 border-none pl-12 h-11 rounded-xl focus-visible:ring-primary/20 focus-visible:bg-muted/50 transition-all"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-10 w-10 rounded-full bg-muted/30 hover:bg-muted/50"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-muted/30 hover:bg-muted/50">
          <div className="h-5 w-5 rounded-sm overflow-hidden border border-border/50">
            <img src="https://flagcdn.com/id.svg" alt="ID" className="h-full w-full object-cover" />
          </div>
        </Button>

        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-muted/30 hover:bg-muted/50">
          <div className="relative">
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive border-2 border-background" />
          </div>
        </Button>

        <div className="h-8 w-[1px] bg-border/60 mx-2" />

        <Avatar className="h-10 w-10 border-2 border-primary/10 cursor-pointer hover:border-primary/30 transition-all">
          <AvatarImage src="https://i.pravatar.cc/150?u=notaris" />
          <AvatarFallback>AD</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
