"use client";

import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Filter, CalendarIcon, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type FilterType = "Hari Ini" | "Minggu Ini" | "Bulan Ini" | "Tahun Ini" | "Custom";

interface FilterCepatProps {
  onFilterChange: (start: Date | null, end: Date | null, type: FilterType) => void;
  defaultFilter?: FilterType;
}

export function FilterCepat({ onFilterChange, defaultFilter = "Bulan Ini" }: FilterCepatProps) {
  const [open, setOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>(defaultFilter);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const applyFilter = (type: FilterType, start?: string, end?: string) => {
    setActiveFilter(type);
    
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    const now = new Date();

    if (type === "Hari Ini") {
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
    } else if (type === "Minggu Ini") {
      const day = now.getDay() || 7; 
      if (day !== 1) now.setHours(-24 * (day - 1));
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else if (type === "Bulan Ini") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (type === "Tahun Ini") {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    } else if (type === "Custom") {
      if (start) {
        startDate = new Date(start);
        startDate.setHours(0, 0, 0, 0);
      }
      if (end) {
        endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);
      }
    }

    onFilterChange(startDate, endDate, type);
    
    if (type !== "Custom") {
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="inline-flex h-9 text-xs items-center justify-center rounded-xl border border-pink-500/30 bg-pink-50 text-pink-600 hover:bg-pink-100 hover:text-pink-700 font-bold px-3 shadow-sm focus:outline-none"
      >
        <Filter className="mr-1.5 h-3.5 w-3.5" />
        {activeFilter}
        <ChevronDown className="ml-1.5 h-3.5 w-3.5 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-80 rounded-[1.5rem] p-5 shadow-2xl" align="end">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-foreground">Filter Cepat</h4>
          <button
            onClick={() => {
              setCustomStart("");
              setCustomEnd("");
              applyFilter("Tahun Ini");
            }}
            className="text-[10px] font-black uppercase tracking-widest text-pink-500 hover:text-pink-600"
          >
            Reset
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {["Hari Ini", "Minggu Ini", "Bulan Ini", "Tahun Ini"].map((item) => (
            <button
              key={item}
              onClick={() => applyFilter(item as FilterType)}
              className={cn(
                "w-full rounded-2xl py-3 px-4 text-left text-sm font-bold transition-colors",
                activeFilter === item
                  ? "bg-pink-500 text-white shadow-md shadow-pink-500/20"
                  : "bg-muted/50 text-foreground hover:bg-muted"
              )}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="mt-5 border-t border-border pt-4">
          <p className="mb-3 text-sm font-bold text-foreground">Custom Range</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Dari</p>
              <div className="relative">
                <Input
                  type="date"
                  value={customStart}
                  onChange={(e) => {
                    setCustomStart(e.target.value);
                    if (e.target.value && customEnd) {
                      applyFilter("Custom", e.target.value, customEnd);
                    }
                  }}
                  className="h-10 w-full rounded-xl bg-muted/30 px-3 text-xs font-semibold focus-visible:ring-pink-500"
                />
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sampai</p>
              <div className="relative">
                <Input
                  type="date"
                  value={customEnd}
                  onChange={(e) => {
                    setCustomEnd(e.target.value);
                    if (customStart && e.target.value) {
                      applyFilter("Custom", customStart, e.target.value);
                    }
                  }}
                  className="h-10 w-full rounded-xl bg-muted/30 px-3 text-xs font-semibold focus-visible:ring-pink-500"
                />
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
