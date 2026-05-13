"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const users = [
  {
    name: "Dianne Russell",
    email: "redaniel@gmail.com",
    avatar: "https://i.pravatar.cc/150?u=dianne",
    date: "27 Mar 2024",
    plan: "Free",
    status: "Active",
  },
  {
    name: "Wade Warren",
    email: "xterris@gmail.com",
    avatar: "https://i.pravatar.cc/150?u=wade",
    date: "27 Mar 2024",
    plan: "Basic",
    status: "Active",
  },
  {
    name: "Albert Flores",
    email: "seannand@mail.ru",
    avatar: "https://i.pravatar.cc/150?u=albert",
    date: "27 Mar 2024",
    plan: "Standard",
    status: "Active",
  },
  {
    name: "Bessie Cooper",
    email: "igerrin@gmail.com",
    avatar: "https://i.pravatar.cc/150?u=bessie",
    date: "27 Mar 2024",
    plan: "Business",
    status: "Active",
  },
  {
    name: "Arlene McCoy",
    email: "fellora@mail.ru",
    avatar: "https://i.pravatar.cc/150?u=arlene",
    date: "27 Mar 2024",
    plan: "Enterprise",
    status: "Active",
  },
];

export function LatestUsers() {
  const [activeTab, setActiveTab] = React.useState("registered");

  return (
    <Card className="border-none shadow-sm overflow-hidden rounded-2xl bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-6 pt-6">
        <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab("registered")}
            className={cn(
              "h-10 px-4 rounded-lg text-sm font-semibold transition-all",
              activeTab === "registered" 
                ? "bg-card text-primary shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Latest Registered
            <span className={cn(
              "ml-2 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-bold",
              activeTab === "registered" ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground"
            )}>
              35
            </span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab("subscribe")}
            className={cn(
              "h-10 px-4 rounded-lg text-sm font-semibold transition-all",
              activeTab === "subscribe" 
                ? "bg-card text-primary shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Latest Subscribe
            <span className={cn(
              "ml-2 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-bold",
              activeTab === "subscribe" ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground"
            )}>
              35
            </span>
          </Button>
        </div>
        <Button variant="link" className="text-primary hover:text-primary/80 font-semibold p-0 flex items-center gap-1">
          View All <ChevronRight className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/10">
                <th className="text-left py-4 px-6 text-sm font-bold text-muted-foreground uppercase tracking-wider">Users</th>
                <th className="text-left py-4 px-6 text-sm font-bold text-muted-foreground uppercase tracking-wider">Registered On</th>
                <th className="text-left py-4 px-6 text-sm font-bold text-muted-foreground uppercase tracking-wider">Plan</th>
                <th className="text-left py-4 px-6 text-sm font-bold text-muted-foreground uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {users.map((user, i) => (
                <tr key={i} className="hover:bg-muted/5 transition-colors group">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border-2 border-background group-hover:scale-105 transition-transform">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-foreground">{user.name}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm font-medium text-muted-foreground">{user.date}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm font-medium text-muted-foreground">{user.plan}</span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-green-500/10 text-green-600 dark:text-green-400">
                      {user.status}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
