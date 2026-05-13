"use server";

import prisma from "@/lib/prisma";

export async function getFinanceStats() {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        payments: true,
      }
    });

    const expenses = await prisma.expense.findMany();

    const totalInvoices = invoices.reduce((acc, inv) => acc + Number(inv.totalAmount), 0);
    const totalPayments = invoices.reduce((acc, inv) => {
      const paid = inv.payments.reduce((pAcc, p) => pAcc + Number(p.amount), 0);
      return acc + paid;
    }, 0);
    const totalPending = totalInvoices - totalPayments;
    
    const totalExpenses = expenses.reduce((acc, exp) => acc + Number(exp.amount), 0);

    return {
      success: true,
      data: {
        totalInvoices,
        totalPayments,
        totalPending,
        totalExpenses
      }
    };
  } catch (error) {
    console.error("Error fetching finance stats:", error);
    return { success: false, error: "Gagal mengambil statistik keuangan" };
  }
}
