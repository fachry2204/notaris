import prisma from "./prisma";

export async function logActivity({
  userId,
  activity,
  details,
  ipAddress,
  device,
}: {
  userId?: string;
  activity: string;
  details?: string;
  ipAddress?: string;
  device?: string;
}) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        activity,
        details,
        ipAddress,
        device,
      },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}
