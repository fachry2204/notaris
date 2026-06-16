"use server";

import { db } from "@/lib/db";
import { badanHukum, nonBadanHukum, ppat, client, invoice, financerecord } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getPublicJobStatus(trackingCode: string) {
  try {
    if (!trackingCode) return { success: false, error: "Nomor berkas diperlukan." };

    let jobData: any = null;
    let jobType: "badanHukum" | "nonBadanHukum" | "ppat" | null = null;
    let jobIdField: string = "";

    // Check Badan Hukum
    const bhResult = await db.select({
      id: badanHukum.id,
      trackingCode: badanHukum.trackingCode,
      title: badanHukum.title,
      type: badanHukum.type,
      companyName: badanHukum.companyName,
      status: badanHukum.status,
      invoiceStatus: badanHukum.invoiceStatus,
      createdAt: badanHukum.createdAt,
      clientName: client.name,
      clientId: badanHukum.clientId,
    })
    .from(badanHukum)
    .leftJoin(client, eq(badanHukum.clientId, client.id))
    .where(eq(badanHukum.trackingCode, trackingCode));

    if (bhResult.length > 0) {
      jobData = bhResult[0];
      jobType = "badanHukum";
      jobIdField = "badanHukumId";
    }

    // Check Non Badan Hukum if not found
    if (!jobData) {
      const nbhResult = await db.select({
        id: nonBadanHukum.id,
        trackingCode: nonBadanHukum.trackingCode,
        title: nonBadanHukum.title,
        type: nonBadanHukum.type,
        status: nonBadanHukum.status,
        invoiceStatus: nonBadanHukum.invoiceStatus,
        createdAt: nonBadanHukum.createdAt,
        clientName: client.name,
        clientId: nonBadanHukum.clientId,
      })
      .from(nonBadanHukum)
      .leftJoin(client, eq(nonBadanHukum.clientId, client.id))
      .where(eq(nonBadanHukum.trackingCode, trackingCode));

      if (nbhResult.length > 0) {
        jobData = nbhResult[0];
        jobType = "nonBadanHukum";
        jobIdField = "nonBadanHukumId";
      }
    }

    // Check PPAT if still not found
    if (!jobData) {
      const ppatResult = await db.select({
        id: ppat.id,
        trackingCode: ppat.trackingCode,
        title: ppat.title,
        type: ppat.type,
        status: ppat.status,
        invoiceStatus: ppat.invoiceStatus,
        createdAt: ppat.createdAt,
        clientName: client.name,
        clientId: ppat.clientId,
      })
      .from(ppat)
      .leftJoin(client, eq(ppat.clientId, client.id))
      .where(eq(ppat.trackingCode, trackingCode));

      if (ppatResult.length > 0) {
        jobData = ppatResult[0];
        jobType = "ppat";
        jobIdField = "ppatId";
      }
    }

    if (!jobData) {
      return { success: false, error: "Berkas dengan nomor tersebut tidak ditemukan." };
    }

    // Fetch associated invoice
    let invResult: any[] = [];
    if (jobIdField === "badanHukumId") {
      invResult = await db.select().from(invoice).where(eq(invoice.badanHukumId, jobData.id));
    } else if (jobIdField === "nonBadanHukumId") {
      invResult = await db.select().from(invoice).where(eq(invoice.nonBadanHukumId, jobData.id));
    } else if (jobIdField === "ppatId") {
      invResult = await db.select().from(invoice).where(eq(invoice.ppatId, jobData.id));
    }

    // Fetch finance records for this job (Payment History)
    let financeResult: any[] = [];
    if (jobIdField === "badanHukumId") {
      financeResult = await db.select().from(financerecord).where(eq(financerecord.badanHukumId, jobData.id));
    } else if (jobIdField === "nonBadanHukumId") {
      financeResult = await db.select().from(financerecord).where(eq(financerecord.nonBadanHukumId, jobData.id));
    } else if (jobIdField === "ppatId") {
      financeResult = await db.select().from(financerecord).where(eq(financerecord.ppatId, jobData.id));
    }

    return { 
      success: true, 
      data: {
        job: jobData,
        jobType,
        invoices: invResult,
        payments: financeResult
      } 
    };

  } catch (error: any) {
    console.error("Error fetching public job status:", error);
    return { success: false, error: "Terjadi kesalahan server." };
  }
}
