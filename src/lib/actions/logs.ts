"use server";

import { db } from "@/lib/db";
import { activitylog, user } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getAuditLogs() {
  try {
    // Get logs with user info manually joined
    const logs = await db.select().from(activitylog).orderBy(desc(activitylog.createdAt)).limit(50);
    
    // Get all unique userIds from logs (filter out null/undefined)
    const userIds = logs.map(log => log.userId).filter((id): id is string => !!id);
    const uniqueUserIds = [...new Set(userIds)];
    
    // Fetch all users for joining
    const users = uniqueUserIds.length > 0 ? await db.select().from(user) : [];
    
    // Combine logs with user info
    const logsWithUsers = logs.map(log => ({
      ...log,
      user: users.find(u => u.id === log.userId) || null,
    }));
    
    return { success: true, data: logsWithUsers };
  } catch (error: any) {
    console.error("Error fetching logs:", error);
    return { success: false, error: "Gagal mengambil log: " + error.message };
  }
}

export async function logActivity(userId: string | null, activity: string, details?: string) {
  try {
    const session = !userId ? await getServerSession(authOptions) : null;
    const resolvedUserId = userId || session?.user?.id || null;

    await db.insert(activitylog).values({
      id: `log-${Math.random().toString(36).substr(2, 9)}`,
      userId: resolvedUserId,
      activity,
      details: details || null,
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}
