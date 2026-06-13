"use server";

import { db } from "@/lib/db";
import { financerecord, invoice, badanHukum, nonBadanHukum, ppat, client, sequence } from "@/lib/db/schema";
import { and, desc, eq, sql as drizzleSql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createInvoice(data: {
  jobId: string;
  jobType: "badan_hukum" | "non_badan_hukum" | "ppat";
  invoiceTotal: number;
  dpAmount: number;
  description: string;
  date: Date;
  dueDate: Date;
}) {
  try {
    let clientIdToRevalidate: string | null = null;
    if (data.jobType === "badan_hukum") {
      const job = await db
        .select({ clientId: badanHukum.clientId })
        .from(badanHukum)
        .where(eq(badanHukum.id, data.jobId))
        .limit(1);
      clientIdToRevalidate = job[0]?.clientId ?? null;
    } else if (data.jobType === "non_badan_hukum") {
      const job = await db
        .select({ clientId: nonBadanHukum.clientId })
        .from(nonBadanHukum)
        .where(eq(nonBadanHukum.id, data.jobId))
        .limit(1);
      clientIdToRevalidate = job[0]?.clientId ?? null;
    } else if (data.jobType === "ppat") {
      const job = await db
        .select({ clientId: ppat.clientId })
        .from(ppat)
        .where(eq(ppat.id, data.jobId))
        .limit(1);
      clientIdToRevalidate = job[0]?.clientId ?? null;
    }

    const year = new Date().getFullYear();
    const seqResults = await db
      .select()
      .from(sequence)
      .where(
        and(
          drizzleSql`category = ${"INVOICE"}`,
          drizzleSql`year = ${year}`
        )
      );

    let nextNum = 1;
    if (seqResults && seqResults.length > 0) {
      const seq = seqResults[0];
      nextNum = (seq.lastNum || 0) + 1;
      await db.update(sequence).set({ lastNum: nextNum }).where(eq(sequence.id, seq.id));
    } else {
      const seqId = `seq-${Math.random().toString(36).slice(2, 11)}`;
      await db.insert(sequence).values({
        id: seqId,
        category: "INVOICE",
        year,
        lastNum: 1,
      });
      nextNum = 1;
    }

    const numStr = nextNum.toString().padStart(4, "0");
    const invoiceNumber = `INV-${year}-${numStr}`;
    const invoiceId = `inv-${Math.random().toString(36).slice(2, 11)}`;

    const invoiceData: any = {
      id: invoiceId,
      invoiceNumber,
      amount: data.invoiceTotal,
      status: data.dpAmount > 0 ? "DP Bayar" : "Belum Bayar",
      description: data.description,
      date: data.date,
      dueDate: data.dueDate,
    };

    if (data.jobType === "badan_hukum") {
      invoiceData.badanHukumId = data.jobId;
    } else if (data.jobType === "non_badan_hukum") {
      invoiceData.nonBadanHukumId = data.jobId;
    } else if (data.jobType === "ppat") {
      invoiceData.ppatId = data.jobId;
    }

    await db.insert(invoice).values(invoiceData);

    const financeId = `FIN-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const recordData: any = {
      id: financeId,
      invoiceId: invoiceId,
      amount: data.invoiceTotal,
      description: data.description,
      date: data.date,
      type: "INCOME",
    };

    if (data.jobType === "badan_hukum") {
      recordData.badanHukumId = data.jobId;
    } else if (data.jobType === "non_badan_hukum") {
      recordData.nonBadanHukumId = data.jobId;
    } else if (data.jobType === "ppat") {
      recordData.ppatId = data.jobId;
    }

    await db.insert(financerecord).values(recordData);
    const result = await db.select().from(invoice).where(eq(invoice.id, invoiceId)).limit(1);

    revalidatePath("/dashboard/invoice");
    revalidatePath("/dashboard/clients");
    if (clientIdToRevalidate) {
      revalidatePath(`/dashboard/clients/${clientIdToRevalidate}`);
    }
    return { success: true, data: result[0] };
  } catch (error: any) {
    console.error("Error creating invoice:", error);
    return { success: false, error: "Gagal membuat invoice: " + error.message };
  }
}

export async function getJobsForInvoice() {
  try {
    // Fetch all jobs from three tables
    const [bhJobs, nbhJobs, ppatJobs] = await Promise.all([
      db.select().from(badanHukum).orderBy(desc(badanHukum.createdAt)),
      db.select().from(nonBadanHukum).orderBy(desc(nonBadanHukum.createdAt)),
      db.select().from(ppat).orderBy(desc(ppat.createdAt)),
    ]);

    // Fetch clients for joining
    const clients = await db.select().from(client);

    // Map jobs with category and client
    const mapJob = (j: typeof bhJobs[0], category: string, type: string) => ({
      ...j,
      category,
      type,
      client: clients.find(c => c.id === j.clientId) || null,
    });

    const allJobs = [
      ...bhJobs.map(j => mapJob(j, "Badan Hukum", "badan_hukum")),
      ...nbhJobs.map(j => mapJob(j as typeof bhJobs[0], "Non Badan Hukum", "non_badan_hukum")),
      ...ppatJobs.map(j => mapJob(j as typeof bhJobs[0], "PPAT", "ppat")),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return { success: true, data: allJobs };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

type InvoiceListItem = {
  id: string;
  invoiceNumber: string;
  amount: number;
  status: string;
  description: string | null;
  date: Date;
  dueDate: Date | null;
  job: {
    id: string;
    type: "badan_hukum" | "non_badan_hukum" | "ppat";
    title: string;
    trackingCode?: string | null;
  } | null;
  client: {
    id: string;
    name: string;
  } | null;
};

async function getAllJobsWithClients() {
  const [bhJobs, nbhJobs, ppatJobs, clients] = await Promise.all([
    db.select().from(badanHukum),
    db.select().from(nonBadanHukum),
    db.select().from(ppat),
    db.select().from(client),
  ]);

  const clientById = new Map<string, any>();
  clients.forEach((c: any) => clientById.set(c.id, c));

  const jobsByKey = new Map<string, any>();
  bhJobs.forEach((j: any) => jobsByKey.set(`badan_hukum:${j.id}`, { ...j, type: "badan_hukum" as const }));
  nbhJobs.forEach((j: any) => jobsByKey.set(`non_badan_hukum:${j.id}`, { ...j, type: "non_badan_hukum" as const }));
  ppatJobs.forEach((j: any) => jobsByKey.set(`ppat:${j.id}`, { ...j, type: "ppat" as const }));

  return { jobsByKey, clientById };
}

function resolveInvoiceJobType(inv: any): { type: "badan_hukum" | "non_badan_hukum" | "ppat"; id: string } | null {
  if (inv.badanHukumId) return { type: "badan_hukum", id: inv.badanHukumId };
  if (inv.nonBadanHukumId) return { type: "non_badan_hukum", id: inv.nonBadanHukumId };
  if (inv.ppatId) return { type: "ppat", id: inv.ppatId };
  return null;
}

export async function getInvoicesList() {
  try {
    const invoices = await db.select().from(invoice).orderBy(desc(invoice.createdAt));
    const { jobsByKey, clientById } = await getAllJobsWithClients();

    const mapped: InvoiceListItem[] = invoices.map((inv: any) => {
      const resolved = resolveInvoiceJobType(inv);
      const job = resolved ? jobsByKey.get(`${resolved.type}:${resolved.id}`) : null;
      const jobClient = job?.clientId ? clientById.get(job.clientId) : null;

      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        amount: Number(inv.amount),
        status: inv.status || "Belum Bayar",
        description: inv.description || null,
        date: inv.date,
        dueDate: inv.dueDate || null,
        job: job
          ? {
              id: job.id,
              type: job.type,
              title: job.title,
              trackingCode: job.trackingCode || null,
            }
          : null,
        client: jobClient
          ? {
              id: jobClient.id,
              name: jobClient.name,
            }
          : null,
      };
    });

    return { success: true, data: mapped };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal mengambil daftar invoice." };
  }
}

export async function getInvoicesByClientId(clientId: string) {
  try {
    const invoices = await db.select().from(invoice).orderBy(desc(invoice.createdAt));
    const { jobsByKey, clientById } = await getAllJobsWithClients();

    const mapped: InvoiceListItem[] = invoices
      .map((inv: any) => {
        const resolved = resolveInvoiceJobType(inv);
        const job = resolved ? jobsByKey.get(`${resolved.type}:${resolved.id}`) : null;
        const jobClient = job?.clientId ? clientById.get(job.clientId) : null;

        if (!jobClient || jobClient.id !== clientId) {
          return null;
        }

        return {
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          amount: Number(inv.amount),
          status: inv.status || "Belum Bayar",
          description: inv.description || null,
          date: inv.date,
          dueDate: inv.dueDate || null,
          job: job
            ? {
                id: job.id,
                type: job.type,
                title: job.title,
                trackingCode: job.trackingCode || null,
              }
            : null,
          client: jobClient
            ? {
                id: jobClient.id,
                name: jobClient.name,
              }
            : null,
        };
      })
      .filter(Boolean) as InvoiceListItem[];

    return { success: true, data: mapped };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal mengambil invoice client." };
  }
}
