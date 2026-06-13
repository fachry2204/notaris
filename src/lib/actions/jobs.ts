"use server";

import { db } from "@/lib/db";
import { badanHukum, nonBadanHukum, ppat, client, user, founder, attachment, jobprogress, sequence } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";
import { logActivity } from "./logs";
import { formatWhatsApp } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eq, and, or, desc, asc, sql as drizzleSql } from "drizzle-orm";

async function checkAdminOrPimpinan() {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMINISTRATOR", "PIMPINAN"].includes(session.user.role)) {
    throw new Error("Anda tidak memiliki izin untuk melakukan tindakan ini.");
  }
  return session;
}

// Helper to get all jobs from all tables with Drizzle
export async function getAllJobsFromTables() {
  try {
    // Fetch badan hukum with client and staff
    const bh = await db.select({
      id: badanHukum.id,
      trackingCode: badanHukum.trackingCode,
      clientId: badanHukum.clientId,
      staffId: badanHukum.staffId,
      title: badanHukum.title,
      type: badanHukum.type,
      companyName: badanHukum.companyName,
      status: badanHukum.status,
      priority: badanHukum.priority,
      deadline: badanHukum.deadline,
      saksi: badanHukum.saksi,
      notes: badanHukum.notes,
      createdAt: badanHukum.createdAt,
      updatedAt: badanHukum.updatedAt,
      invoiceStatus: badanHukum.invoiceStatus,
      clientName: client.name,
      clientEmail: client.email,
      clientPhone: client.phone,
      staffName: user.fullName,
      staffUsername: user.username,
    })
    .from(badanHukum)
    .leftJoin(client, eq(badanHukum.clientId, client.id))
    .leftJoin(user, eq(badanHukum.staffId, user.id));

    // Fetch non badan hukum with client and staff
    const nbh = await db.select({
      id: nonBadanHukum.id,
      trackingCode: nonBadanHukum.trackingCode,
      clientId: nonBadanHukum.clientId,
      staffId: nonBadanHukum.staffId,
      title: nonBadanHukum.title,
      type: nonBadanHukum.type,
      companyName: nonBadanHukum.companyName,
      status: nonBadanHukum.status,
      priority: nonBadanHukum.priority,
      deadline: nonBadanHukum.deadline,
      saksi: nonBadanHukum.saksi,
      notes: nonBadanHukum.notes,
      createdAt: nonBadanHukum.createdAt,
      updatedAt: nonBadanHukum.updatedAt,
      invoiceStatus: nonBadanHukum.invoiceStatus,
      clientName: client.name,
      clientEmail: client.email,
      clientPhone: client.phone,
      staffName: user.fullName,
      staffUsername: user.username,
    })
    .from(nonBadanHukum)
    .leftJoin(client, eq(nonBadanHukum.clientId, client.id))
    .leftJoin(user, eq(nonBadanHukum.staffId, user.id));

    // Fetch ppat with client and staff
    const ppatData = await db.select({
      id: ppat.id,
      trackingCode: ppat.trackingCode,
      clientId: ppat.clientId,
      staffId: ppat.staffId,
      title: ppat.title,
      type: ppat.type,
      companyName: ppat.companyName,
      status: ppat.status,
      priority: ppat.priority,
      deadline: ppat.deadline,
      saksi: ppat.saksi,
      notes: ppat.notes,
      createdAt: ppat.createdAt,
      updatedAt: ppat.updatedAt,
      invoiceStatus: ppat.invoiceStatus,
      clientName: client.name,
      clientEmail: client.email,
      clientPhone: client.phone,
      staffName: user.fullName,
      staffUsername: user.username,
    })
    .from(ppat)
    .leftJoin(client, eq(ppat.clientId, client.id))
    .leftJoin(user, eq(ppat.staffId, user.id));

    // Format and add category
    const formattedBh = bh.map(j => ({
      ...j,
      category: "Badan Hukum/Usaha",
      client: j.clientId ? {
        id: j.clientId,
        name: j.clientName,
        email: j.clientEmail,
        phone: j.clientPhone,
      } : null,
      staff: j.staffId ? {
        id: j.staffId,
        fullName: j.staffName,
        username: j.staffUsername,
      } : null,
    }));

    const formattedNbh = nbh.map(j => ({
      ...j,
      category: "Non Badan Hukum",
      client: j.clientId ? {
        id: j.clientId,
        name: j.clientName,
        email: j.clientEmail,
        phone: j.clientPhone,
      } : null,
      staff: j.staffId ? {
        id: j.staffId,
        fullName: j.staffName,
        username: j.staffUsername,
      } : null,
    }));

    const formattedPpat = ppatData.map(j => ({
      ...j,
      category: "PPAT",
      client: j.clientId ? {
        id: j.clientId,
        name: j.clientName,
        email: j.clientEmail,
        phone: j.clientPhone,
      } : null,
      staff: j.staffId ? {
        id: j.staffId,
        fullName: j.staffName,
        username: j.staffUsername,
      } : null,
    }));

    return [...formattedBh, ...formattedNbh, ...formattedPpat];
  } catch (err) {
    console.error("Failed to fetch all jobs:", err);
    throw err;
  }
}

export async function getJobStats() {
  try {
    const allJobs = await getAllJobsFromTables();
    
    return {
      success: true,
      data: {
        total: allJobs.length,
        pending: allJobs.filter((j: any) => j.status === "PENDING").length,
        proses: allJobs.filter((j: any) => j.status === "PROSES").length,
        revisi: allJobs.filter((j: any) => j.status === "REVISI" || j.status === "REVISI_PROSES").length,
        verifikasi: allJobs.filter((j: any) => j.status === "VERIFIKASI").length,
        selesai: allJobs.filter((j: any) => j.status === "SELESAI").length,
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getUpcomingDeadlines() {
  try {
    const allJobs = await getAllJobsFromTables();
    const upcoming = allJobs
      .filter((j: any) => 
        j.status !== "SELESAI" && 
        j.deadline && 
        new Date(j.deadline) >= new Date() &&
        new Date(j.deadline) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      )
      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
      .slice(0, 5);

    return { success: true, data: upcoming };
  } catch (error: any) {
    console.error("Error fetching deadlines:", error);
    return { success: false, error: "Gagal mengambil deadline: " + error.message };
  }
}

export async function getDashboardStats() {
  try {
    const [countBH, countNBH, countPPAT] = await Promise.all([
      db.select({ count: drizzleSql`count(*)` }).from(badanHukum).then(r => Number(r[0].count)),
      db.select({ count: drizzleSql`count(*)` }).from(nonBadanHukum).then(r => Number(r[0].count)),
      db.select({ count: drizzleSql`count(*)` }).from(ppat).then(r => Number(r[0].count)),
    ]);

    const totalJobs = countBH + countNBH + countPPAT;
    
    const allJobs = await getAllJobsFromTables();
    const processingJobs = allJobs.filter((j: any) => j.status === "PROSES").length;
    const doneJobs = allJobs.filter((j: any) => j.status === "SELESAI").length;
    const pendingJobs = allJobs.filter((j: any) => j.status === "PENDING").length;

    return {
      success: true,
      data: {
        totalJobs,
        processingJobs,
        doneJobs,
        pendingJobs
      }
    };
  } catch (error: any) {
    console.error("Error fetching dashboard stats:", error);
    return { success: false, error: "Gagal mengambil statistik: " + error.message };
  }
}

export async function getCompletedJobs() {
  try {
    const allJobs = await getAllJobsFromTables();
    const jobs = allJobs
      .filter((j: any) => j.status === "SELESAI")
      .sort((a: any, b: any) => b.updatedAt.getTime() - a.updatedAt.getTime());
    return { success: true, data: jobs };
  } catch (error: any) {
    console.error("Error fetching completed jobs:", error);
    return { success: false, error: "Gagal mengambil data arsip: " + error.message };
  }
}

export async function getJobs() {
  try {
    console.log("Fetching all jobs from tables...");
    const allJobs = await getAllJobsFromTables();
    console.log(`Successfully fetched ${allJobs.length} jobs.`);
    allJobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return { success: true, data: allJobs };
  } catch (error: any) {
    console.error("CRITICAL ERROR in getJobs:", error);
    return { success: false, error: "Gagal mengambil data pekerjaan. Detail: " + (error.message || "Unknown error") };
  }
}

export async function getJobById(id: string) {
  try {
    // Try to find in badanHukum
    const bhJob = await db.select().from(badanHukum).where(eq(badanHukum.id, id)).limit(1);
    if (bhJob.length > 0) {
      const job = bhJob[0];
      const [jobClient, jobStaff, jobProgress, jobAttachments, jobFounders] = await Promise.all([
        job.clientId ? db.select().from(client).where(eq(client.id, job.clientId)).limit(1).then(r => r[0] || null) : Promise.resolve(null),
        job.staffId ? db.select().from(user).where(eq(user.id, job.staffId)).limit(1).then(r => r[0] || null) : Promise.resolve(null),
        db.select().from(jobprogress).where(eq(jobprogress.badanHukumId, id)),
        db.select().from(attachment).where(eq(attachment.badanHukumId, id)),
        db.select().from(founder).where(eq(founder.badanHukumId, id)),
      ]);
      return { 
        success: true, 
        data: {
          ...job,
          category: "Badan Hukum/Usaha",
          client: jobClient,
          staff: jobStaff,
          progressHistory: jobProgress,
          attachments: jobAttachments,
          founders: jobFounders,
        }
      };
    }

    // Try to find in nonBadanHukum
    const nbhJob = await db.select().from(nonBadanHukum).where(eq(nonBadanHukum.id, id)).limit(1);
    if (nbhJob.length > 0) {
      const job = nbhJob[0];
      const [jobClient, jobStaff, jobProgress, jobAttachments, jobFounders] = await Promise.all([
        job.clientId ? db.select().from(client).where(eq(client.id, job.clientId)).limit(1).then(r => r[0] || null) : Promise.resolve(null),
        job.staffId ? db.select().from(user).where(eq(user.id, job.staffId)).limit(1).then(r => r[0] || null) : Promise.resolve(null),
        db.select().from(jobprogress).where(eq(jobprogress.nonBadanHukumId, id)),
        db.select().from(attachment).where(eq(attachment.nonBadanHukumId, id)),
        db.select().from(founder).where(eq(founder.nonBadanHukumId, id)),
      ]);
      return { 
        success: true, 
        data: {
          ...job,
          category: "Non Badan Hukum",
          client: jobClient,
          staff: jobStaff,
          progressHistory: jobProgress,
          attachments: jobAttachments,
          founders: jobFounders,
        }
      };
    }

    // Try to find in ppat
    const ppatJob = await db.select().from(ppat).where(eq(ppat.id, id)).limit(1);
    if (ppatJob.length > 0) {
      const job = ppatJob[0];
      const [jobClient, jobStaff, jobProgress, jobAttachments, jobFounders] = await Promise.all([
        job.clientId ? db.select().from(client).where(eq(client.id, job.clientId)).limit(1).then(r => r[0] || null) : Promise.resolve(null),
        job.staffId ? db.select().from(user).where(eq(user.id, job.staffId)).limit(1).then(r => r[0] || null) : Promise.resolve(null),
        db.select().from(jobprogress).where(eq(jobprogress.ppatId, id)),
        db.select().from(attachment).where(eq(attachment.ppatId, id)),
        db.select().from(founder).where(eq(founder.ppatId, id)),
      ]);
      return { 
        success: true, 
        data: {
          ...job,
          category: "PPAT",
          client: jobClient,
          staff: jobStaff,
          progressHistory: jobProgress,
          attachments: jobAttachments,
          founders: jobFounders,
        }
      };
    }

    return { success: false, error: "Pekerjaan tidak ditemukan" };
  } catch (error) {
    console.error("Error fetching job by ID:", error);
    return { success: false, error: "Gagal mengambil detail pekerjaan" };
  }
}

export async function getNextTrackingCode(category: string) {
  try {
    console.log("Getting next tracking code for:", category);
    const year = new Date().getFullYear();
    
    // Use Drizzle to query sequence
    const results = await db.select().from(sequence)
      .where(and(
        drizzleSql`category = ${category}`,
        drizzleSql`year = ${year}`
      ));
    
    console.log("Query results:", results);
    
    const seq = results && results.length > 0 ? results[0] : null;
    const nextNum = (seq?.lastNum || 0) + 1;
    const numStr = nextNum.toString().padStart(4, '0');
    
    let trackingCode = "";
    if (category === "Badan Hukum/Usaha") {
      trackingCode = `BHM-${year}-${numStr}`;
    } else if (category === "Non Badan Hukum") {
      trackingCode = `NBH-${year}-${numStr}`;
    } else {
      trackingCode = `PPAT-${year}-${numStr}`;
    }
    
    console.log("Generated code:", trackingCode);
    return { success: true, data: trackingCode };
  } catch (error: any) {
    console.error("Error getting next tracking code:", error);
    return { success: false, error: "Gagal mengambil nomor berkas: " + error.message };
  }
}

export async function createJob(data: any) {
  try {
    const category = data.category || data.jobCategory || data.type;
    console.log("Creating job for category:", category);
    
    if (!data.clientId) {
      return { success: false, error: "Client harus dipilih." };
    }

    const year = new Date().getFullYear();
    const jobId = `job-${Math.random().toString(36).substr(2, 9)}`;
    
    // Get sequence for tracking code
    const seqResults = await db.select().from(sequence)
      .where(and(
        drizzleSql`category = ${category}`,
        drizzleSql`year = ${year}`
      ));

    let nextNum = 1;
    if (seqResults && seqResults.length > 0) {
      const seq = seqResults[0];
      nextNum = (seq.lastNum || 0) + 1;
      await db.update(sequence)
        .set({ lastNum: nextNum })
        .where(eq(sequence.id, seq.id));
    } else {
      const seqId = `seq-${Math.random().toString(36).substr(2, 9)}`;
      await db.insert(sequence).values({
        id: seqId,
        category,
        year,
        lastNum: 1,
      });
      nextNum = 1;
    }

    const numStr = nextNum.toString().padStart(4, '0');
    
    let trackingCode = "";
    if (category === "Badan Hukum/Usaha") {
      trackingCode = `BHM-${year}-${numStr}`;
    } else if (category === "Non Badan Hukum") {
      trackingCode = `NBH-${year}-${numStr}`;
    } else {
      trackingCode = `PPAT-${year}-${numStr}`;
    }
    
    // Get first user as fallback
    const firstUser = await db.select().from(user).limit(1);
    const fallbackUserId = firstUser[0]?.id || "system";

    const jobData = {
      id: jobId,
      trackingCode,
      title: data.title,
      type: data.type || data.title,
      companyName: data.companyName || null,
      clientId: data.clientId,
      staffId: data.staffId || null,
      status: data.status || "PENDING",
      priority: data.priority || "MEDIUM",
      deadline: data.deadline ? new Date(data.deadline) : null,
      saksi: data.saksi || null,
      notes: data.notes || null,
      invoiceStatus: "PENDING" as const,
    };

    // Insert job based on category
    if (category === "Badan Hukum/Usaha") {
      await db.insert(badanHukum).values(jobData);
    } else if (category === "Non Badan Hukum") {
      await db.insert(nonBadanHukum).values(jobData);
    } else {
      await db.insert(ppat).values(jobData);
    }

    // Insert founders
    if (data.founders?.length > 0) {
      const foundersToInsert = data.founders.map((f: any) => ({
        id: `FND-${Math.random().toString(36).substr(2, 9)}`,
        name: f.name || f.nama,
        phone: formatWhatsApp(f.phone || f.hp),
        email: f.email || null,
        badanHukumId: category === "Badan Hukum/Usaha" ? jobId : null,
        nonBadanHukumId: category === "Non Badan Hukum" ? jobId : null,
        ppatId: category === "PPAT" ? jobId : null,
      }));
      await db.insert(founder).values(foundersToInsert);
    }

    // Insert attachments
    if (data.attachments?.length > 0) {
      const attachmentsToInsert = data.attachments.map((att: any) => ({
        id: `ATT-${Math.random().toString(36).substr(2, 9)}`,
        userId: data.staffId || fallbackUserId,
        fileName: att.description || att.fileName,
        filePath: att.filePath,
        fileType: att.fileType,
        description: att.description || att.fileName,
        badanHukumId: category === "Badan Hukum/Usaha" ? jobId : null,
        nonBadanHukumId: category === "Non Badan Hukum" ? jobId : null,
        ppatId: category === "PPAT" ? jobId : null,
      }));
      await db.insert(attachment).values(attachmentsToInsert);
    }

    revalidatePath("/dashboard/jobs");
    await logActivity(null, "CREATE_JOB", `Created job: ${data.title} (${trackingCode})`);
    return { success: true, data: { ...jobData, category } };
  } catch (error: any) {
    console.error("Error creating job:", error);
    return { success: false, error: "Gagal menambah pekerjaan: " + error.message };
  }
}

export async function updateJob(id: string, data: any) {
  try {
    const category = data.category || data.jobCategory || data.type;
    
    console.log(`Updating job ${id} in category ${category}`);

    // Get old job to check status
    let oldJob: any = null;
    if (category === "Badan Hukum/Usaha") {
      const result = await db.select().from(badanHukum).where(eq(badanHukum.id, id)).limit(1);
      oldJob = result[0];
    } else if (category === "Non Badan Hukum") {
      const result = await db.select().from(nonBadanHukum).where(eq(nonBadanHukum.id, id)).limit(1);
      oldJob = result[0];
    } else {
      const result = await db.select().from(ppat).where(eq(ppat.id, id)).limit(1);
      oldJob = result[0];
    }
    
    const oldStatus = oldJob?.status || "PENDING";

    // Update job data
    const updateData = {
      title: data.title,
      type: data.type,
      status: data.status,
      priority: data.priority,
      deadline: data.deadline ? new Date(data.deadline) : null,
      notes: data.notes || null,
      clientId: data.clientId,
      staffId: data.staffId || null,
      companyName: data.companyName || null,
      saksi: data.saksi || null,
      invoiceStatus: (data.invoiceStatus || "PENDING") as "PENDING" | "DP" | "PAYMENT",
    };

    // Update based on category
    if (category === "Badan Hukum/Usaha") {
      await db.update(badanHukum).set(updateData).where(eq(badanHukum.id, id));
    } else if (category === "Non Badan Hukum") {
      await db.update(nonBadanHukum).set(updateData).where(eq(nonBadanHukum.id, id));
    } else {
      await db.update(ppat).set(updateData).where(eq(ppat.id, id));
    }

    // Get fallback user
    const firstUser = await db.select().from(user).limit(1);
    const fallbackUserId = firstUser[0]?.id || "default-admin";

    // Founders - delete existing and insert new
    if (data.founders) {
      await db.delete(founder)
        .where(or(
          eq(founder.badanHukumId, id),
          eq(founder.nonBadanHukumId, id),
          eq(founder.ppatId, id)
        ));
      
      if (data.founders.length > 0) {
        const foundersToInsert = data.founders.map((f: any) => ({
          id: `FND-${Math.random().toString(36).substr(2, 9)}`,
          name: f.name || f.nama,
          phone: formatWhatsApp(f.phone || f.hp),
          email: f.email || null,
          badanHukumId: category === "Badan Hukum/Usaha" ? id : null,
          nonBadanHukumId: category === "Non Badan Hukum" ? id : null,
          ppatId: category === "PPAT" ? id : null,
        }));
        await db.insert(founder).values(foundersToInsert);
      }
    }

    // Attachments - delete existing and insert new
    if (data.attachments) {
      await db.delete(attachment)
        .where(or(
          eq(attachment.badanHukumId, id),
          eq(attachment.nonBadanHukumId, id),
          eq(attachment.ppatId, id)
        ));
      
      if (data.attachments.length > 0) {
        const attachmentsToInsert = data.attachments.map((att: any) => ({
          id: `ATT-${Math.random().toString(36).substr(2, 9)}`,
          userId: data.staffId || fallbackUserId,
          fileName: att.fileName,
          filePath: att.filePath,
          fileType: att.fileType,
          description: att.description || att.fileName,
          badanHukumId: category === "Badan Hukum/Usaha" ? id : null,
          nonBadanHukumId: category === "Non Badan Hukum" ? id : null,
          ppatId: category === "PPAT" ? id : null,
        }));
        await db.insert(attachment).values(attachmentsToInsert);
      }
    }

    // Create progress history if description provided
    if (data.description) {
      await db.insert(jobprogress).values({
        id: `PROG-${Math.random().toString(36).substr(2, 9)}`,
        userId: data.staffId || fallbackUserId,
        statusBefore: oldStatus as any,
        statusAfter: data.status as any,
        description: data.description,
        badanHukumId: category === "Badan Hukum/Usaha" ? id : null,
        nonBadanHukumId: category === "Non Badan Hukum" ? id : null,
        ppatId: category === "PPAT" ? id : null,
      });
    }

    revalidatePath("/dashboard/jobs");
    await logActivity(null, "UPDATE_JOB", `Updated job ID: ${id}`);
    return { success: true, data: { id } };
  } catch (error: any) {
    console.error("Error updating job:", error);
    return { success: false, error: "Gagal memperbarui pekerjaan: " + (error.message || "Unknown error") };
  }
}

export async function deleteJob(id: string, category: string) {
  try {
    await checkAdminOrPimpinan();
    
    // Delete related records first (founders, attachments, jobprogress)
    await db.delete(founder)
      .where(or(
        eq(founder.badanHukumId, id),
        eq(founder.nonBadanHukumId, id),
        eq(founder.ppatId, id)
      ));
    
    await db.delete(attachment)
      .where(or(
        eq(attachment.badanHukumId, id),
        eq(attachment.nonBadanHukumId, id),
        eq(attachment.ppatId, id)
      ));
    
    await db.delete(jobprogress)
      .where(or(
        eq(jobprogress.badanHukumId, id),
        eq(jobprogress.nonBadanHukumId, id),
        eq(jobprogress.ppatId, id)
      ));
    
    // Delete the job
    if (category === "Badan Hukum/Usaha") {
      await db.delete(badanHukum).where(eq(badanHukum.id, id));
    } else if (category === "Non Badan Hukum") {
      await db.delete(nonBadanHukum).where(eq(nonBadanHukum.id, id));
    } else {
      await db.delete(ppat).where(eq(ppat.id, id));
    }
    
    revalidatePath("/dashboard/jobs");
    await logActivity(null, "DELETE_JOB", `Deleted job ID: ${id}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting job:", error);
    return { success: false, error: "Gagal menghapus pekerjaan" };
  }
}

export async function getStaffProductivity() {
  try {
    const usersData = await db.select({
      id: user.id,
      fullName: user.fullName,
      role: user.role,
      username: user.username,
    })
    .from(user)
    .where(or(
      eq(user.role, "STAFFADMIN"),
      eq(user.role, "OB"),
      eq(user.role, "ADMINISTRATOR"),
      eq(user.role, "PIMPINAN")
    ));

    const allJobs = await getAllJobsFromTables();

    const productivity = usersData.map((u: typeof usersData[0]) => {
      const userJobs = allJobs.filter(j => j.staffId === u.id);
      const completed = userJobs.filter(j => j.status === "SELESAI").length;
      const processing = userJobs.filter(j => j.status !== "SELESAI" && j.status !== "CANCELLED").length;
      
      return {
        id: u.id,
        name: u.fullName || u.username,
        role: u.role,
        completed,
        processing,
      };
    }).sort((a: { completed: number }, b: { completed: number }) => b.completed - a.completed);

    return { success: true, data: productivity };
  } catch (error: any) {
    console.error("Error fetching productivity:", error);
    return { success: false, error: error.message };
  }
}

export async function getMonthlyJobStats() {
  try {
    const allJobs = await getAllJobsFromTables();
    
    interface MonthlyStat {
      name: string;
      month: number;
      year: number;
      total: number;
      completed: number;
    }

    // Get last 6 months
    const months: MonthlyStat[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const year = now.getFullYear();
      const month = now.getMonth() - i;
      // Calculate correct year and month accounting for negative months
      const adjustedYear = year + Math.floor(month / 12);
      const adjustedMonth = ((month % 12) + 12) % 12;
      
      const d = new Date(adjustedYear, adjustedMonth, 1);
      months.push({
        name: d.toLocaleString('id-ID', { month: 'short' }),
        month: adjustedMonth,
        year: adjustedYear,
        total: 0,
        completed: 0,
      });
    }

    allJobs.forEach(job => {
      const jobDate = new Date(job.createdAt);
      const updatedDate = new Date(job.updatedAt);
      
      months.forEach(m => {
        if (jobDate.getMonth() === m.month && jobDate.getFullYear() === m.year) {
          m.total++;
        }
        if (job.status === "SELESAI" && updatedDate.getMonth() === m.month && updatedDate.getFullYear() === m.year) {
          m.completed++;
        }
      });
    });

    return { success: true, data: months };
  } catch (error: any) {
    console.error("Error fetching monthly stats:", error);
    return { success: false, error: error.message };
  }
}
