"use server";

import fs from "fs";
import path from "path";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { attendance, staff } from "@/lib/db/schema";
import { logActivity } from "./logs";

function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

async function ensureAttendanceTable() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS attendance (
      id VARCHAR(255) PRIMARY KEY,
      staffId VARCHAR(255) NOT NULL,
      \`date\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      checkIn DATETIME NULL,
      checkOut DATETIME NULL,
      status VARCHAR(255) NULL DEFAULT 'Hadir',
      notes TEXT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX attendance_staffId_fkey (staffId),
      INDEX attendance_date_idx (\`date\`)
    )
  `);
}

async function getMyStaffProfile() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Sesi login tidak ditemukan.");
  }

  const staffRows = await db
    .select()
    .from(staff)
    .where(eq(staff.userId, session.user.id))
    .limit(1);

  const myStaff = staffRows[0];
  if (!myStaff) {
    throw new Error("Profil staff tidak ditemukan.");
  }

  return { session, myStaff };
}

async function saveAttendanceImage(base64Data: string, staffId: string) {
  if (!base64Data.startsWith("data:image/")) {
    return null;
  }

  const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return null;
  }

  const mimeType = matches[1];
  const extension = mimeType.split("/")[1] || "png";
  const fileName = `attendance_${staffId}_${Date.now()}.${extension}`;
  const relativePath = `/uploads/attendance/${fileName}`;
  const absoluteDir = path.join(process.cwd(), "public", "uploads", "attendance");
  const absolutePath = path.join(absoluteDir, fileName);

  fs.mkdirSync(absoluteDir, { recursive: true });
  fs.writeFileSync(absolutePath, Buffer.from(matches[2], "base64"));

  return relativePath;
}

export async function getMyAttendanceToday() {
  try {
    await ensureAttendanceTable();
    const { session, myStaff } = await getMyStaffProfile();
    const { start, end } = getTodayRange();

    const rows = await db
      .select()
      .from(attendance)
      .where(and(eq(attendance.staffId, myStaff.id), gte(attendance.date, start), lte(attendance.date, end)))
      .orderBy(desc(attendance.createdAt))
      .limit(1);

    return {
      success: true,
      data: {
        attendance: rows[0] || null,
        user: {
          id: session.user.id,
          fullName: session.user.fullName,
          role: session.user.role,
        },
        staffId: myStaff.id,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal mengambil data absensi hari ini." };
  }
}

export async function submitMyAttendance(data: {
  capturedImage: string;
  locationLabel: string;
  latitude?: number | null;
  longitude?: number | null;
  systemName?: string;
}) {
  try {
    await ensureAttendanceTable();
    const { session, myStaff } = await getMyStaffProfile();
    const { start, end } = getTodayRange();

    const existingRows = await db
      .select()
      .from(attendance)
      .where(and(eq(attendance.staffId, myStaff.id), gte(attendance.date, start), lte(attendance.date, end)))
      .limit(1);

    const now = new Date();
    const photoPath = data.capturedImage ? await saveAttendanceImage(data.capturedImage, myStaff.id) : null;
    const attendancePayload = {
      locationLabel: data.locationLabel || "-",
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      systemName: data.systemName || "Notaris Digital",
      photoPath,
      submittedAt: now.toISOString(),
    };

    let savedRecord = null;
    let attendanceType = "CHECK_IN";

    if (existingRows[0]) {
      attendanceType = existingRows[0].checkOut ? "UPDATE_ABSENSI" : "CHECK_OUT";

      await db
        .update(attendance)
        .set({
          checkOut: existingRows[0].checkOut ? existingRows[0].checkOut : now,
          notes: JSON.stringify(attendancePayload),
        })
        .where(eq(attendance.id, existingRows[0].id));

      const updatedRows = await db.select().from(attendance).where(eq(attendance.id, existingRows[0].id)).limit(1);
      savedRecord = updatedRows[0] || null;
    } else {
      const attendanceId = `attendance-${Math.random().toString(36).slice(2, 11)}`;
      await db.insert(attendance).values({
        id: attendanceId,
        staffId: myStaff.id,
        date: now,
        checkIn: now,
        status: "Hadir",
        notes: JSON.stringify(attendancePayload),
      });

      const newRows = await db.select().from(attendance).where(eq(attendance.id, attendanceId)).limit(1);
      savedRecord = newRows[0] || null;
    }

    await logActivity(
      null,
      attendanceType,
      `${session.user.fullName} melakukan absensi di ${data.locationLabel || "-"}`
    );

    revalidatePath("/dashboard/pegawai/absensi");
    revalidatePath("/dashboard/pegawai/absensi/absenku");

    return { success: true, data: savedRecord };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal menyimpan absensi." };
  }
}
