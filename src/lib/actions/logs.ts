"use server";

import prisma from "@/lib/prisma";

export async function getAuditLogs() {
  try {
    const logs = await prisma.activityLog.findMany({
      include: {
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });
    return { success: true, data: logs };
  } catch (error) {
    console.error("Error fetching logs:", error);
    return { success: false, error: "Gagal mengambil log" };
  }
}

export async function logActivity(userId: string | null, activity: string, details?: string) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        activity,
        details,
        // In a real server action, we could get IP/Device from headers
      },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}
