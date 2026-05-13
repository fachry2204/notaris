"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logActivity } from "./logs";
import { JobStatus, JobPriority } from "@prisma/client";

export async function getUpcomingDeadlines() {
  try {
    const jobs = await prisma.job.findMany({
      where: {
        status: {
          not: JobStatus.DONE,
        },
        deadline: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
        },
      },
      orderBy: {
        deadline: "asc",
      },
      take: 5,
      include: {
        client: true,
      },
    });
    return { success: true, data: jobs };
  } catch (error) {
    console.error("Error fetching deadlines:", error);
    return { success: false, error: "Gagal mengambil deadline" };
  }
}

export async function getDashboardStats() {
  try {
    const totalJobs = await prisma.job.count();
    const processingJobs = await prisma.job.count({ where: { status: JobStatus.PROCESS } });
    const doneJobs = await prisma.job.count({ where: { status: JobStatus.DONE } });
    const pendingJobs = await prisma.job.count({ where: { status: JobStatus.PENDING } });

    return {
      success: true,
      data: {
        totalJobs,
        processingJobs,
        doneJobs,
        pendingJobs
      }
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return { success: false, error: "Gagal mengambil statistik" };
  }
}

export async function getCompletedJobs() {
  try {
    const jobs = await prisma.job.findMany({
      where: {
        status: JobStatus.DONE,
      },
      include: {
        client: true,
        staff: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
    return { success: true, data: jobs };
  } catch (error) {
    console.error("Error fetching completed jobs:", error);
    return { success: false, error: "Gagal mengambil data arsip" };
  }
}

export async function getJobs() {
  try {
    const jobs = await prisma.job.findMany({
      include: {
        client: true,
        staff: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return { success: true, data: jobs };
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return { success: false, error: "Gagal mengambil data pekerjaan" };
  }
}

export async function createJob(data: any) {
  try {
    const job = await prisma.job.create({
      data: {
        trackingCode: `J-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        title: data.title,
        type: data.type,
        clientId: data.clientId,
        staffId: data.staffId,
        status: data.status || JobStatus.NEW,
        priority: data.priority || JobPriority.MEDIUM,
        deadline: data.deadline ? new Date(data.deadline) : null,
        notes: data.notes,
      },
    });
    revalidatePath("/dashboard/jobs");
    await logActivity(null, "CREATE_JOB", `Created job: ${job.title} (${job.trackingCode})`);
    return { success: true, data: job };
  } catch (error) {
    console.error("Error creating job:", error);
    return { success: false, error: "Gagal menambah pekerjaan" };
  }
}

export async function updateJob(id: string, data: any) {
  try {
    const job = await prisma.job.update({
      where: { id },
      data: {
        title: data.title,
        type: data.type,
        clientId: data.clientId,
        staffId: data.staffId,
        status: data.status,
        priority: data.priority,
        deadline: data.deadline ? new Date(data.deadline) : null,
        notes: data.notes,
      },
    });
    revalidatePath("/dashboard/jobs");
    await logActivity(null, "UPDATE_JOB", `Updated job: ${job.title} (${job.id})`);
    return { success: true, data: job };
  } catch (error) {
    console.error("Error updating job:", error);
    return { success: false, error: "Gagal memperbarui pekerjaan" };
  }
}

export async function deleteJob(id: string) {
  try {
    await prisma.job.delete({
      where: { id },
    });
    revalidatePath("/dashboard/jobs");
    await logActivity(null, "DELETE_JOB", `Deleted job ID: ${id}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting job:", error);
    return { success: false, error: "Gagal menghapus pekerjaan" };
  }
}
