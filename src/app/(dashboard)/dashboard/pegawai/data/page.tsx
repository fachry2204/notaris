import { Button } from "@/components/ui/button";
import { Contact, Plus, Search, Filter, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StaffList } from "@/components/pegawai/StaffList";

export default function DataPegawaiPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Data Pegawai</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">Pegawai</span>
            <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
            <span className="text-xs font-medium text-primary">Data Pegawai</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="h-10 rounded-xl bg-card border-border/60 font-semibold gap-2">
            <Download className="h-4 w-4" />
            Export Data
          </Button>
          <Button size="sm" className="h-10 rounded-xl font-semibold gap-2 shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" />
            Tambah Pegawai
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="border-none bg-card/60 backdrop-blur-xl shadow-2xl shadow-primary/5 rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-border/60 pb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Contact className="h-5 w-5 text-primary" />
                Daftar Pegawai
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Cari nama pegawai..." 
                    className="pl-9 h-10 rounded-xl bg-background/50 border-border/50 focus:ring-primary/20"
                  />
                </div>
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl bg-background/50 border-border/50">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-8">
            <StaffList />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
