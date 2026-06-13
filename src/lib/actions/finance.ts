"use server";
import { db } from "@/lib/db";
import { financerecord, expense } from "@/lib/db/schema";
import { getAllJobsFromTables } from "./jobs";

export async function getFinanceStats() {
  try {
    const financeRecords = await db.select().from(financerecord);
    const expenses = await db.select().from(expense);
    const allJobs = await getAllJobsFromTables();

    // Summary totals
    const totalInvoices = financeRecords
      .filter((r: any) => r.type === 'INCOME')
      .reduce((acc: number, r: any) => acc + Number(r.amount), 0);
      
    const totalPayments = totalInvoices;
    const totalPending = 0; 
    const totalExpenses = expenses.reduce((acc: number, exp: any) => acc + Number(exp.amount), 0);

    // Monthly Data (Last 6 months)
    interface MonthlyFinance {
      month: string;
      m: number;
      y: number;
      revenue: number;
      expenses: number;
    }

    const months: MonthlyFinance[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push({
        month: d.toLocaleString('id-ID', { month: 'short' }),
        m: d.getMonth(),
        y: d.getFullYear(),
        revenue: 0,
        expenses: 0,
      });
    }

    financeRecords.forEach(r => {
      const d = new Date(r.date);
      const m = months.find(month => month.m === d.getMonth() && month.y === d.getFullYear());
      if (m) {
        if (r.type === 'INCOME') m.revenue += Number(r.amount);
        else m.expenses += Number(r.amount);
      }
    });

    expenses.forEach(e => {
      const d = new Date(e.expenseDate);
      const m = months.find(month => month.m === d.getMonth() && month.y === d.getFullYear());
      if (m) m.expenses += Number(e.amount);
    });

    // Payment Status Data (from jobs)
    const statusBreakdown = [
      { name: "Lunas", value: allJobs.filter((j: any) => j.invoiceStatus === "PAYMENT").length, color: "#10b981" },
      { name: "Belum Lunas", value: allJobs.filter((j: any) => j.invoiceStatus === "PENDING" || !j.invoiceStatus).length, color: "#f59e0b" },
      { name: "Cicilan / DP", value: allJobs.filter((j: any) => j.invoiceStatus === "DP").length, color: "#3b82f6" },
    ];

    return {
      success: true,
      data: {
        totalInvoices,
        totalPayments,
        totalPending,
        totalExpenses,
        monthlyData: months,
        statusBreakdown
      }
    };
  } catch (error: any) {
    console.error("Error fetching finance stats:", error);
    return { success: false, error: "Gagal mengambil statistik keuangan: " + error.message };
  }
}
