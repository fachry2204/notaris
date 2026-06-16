"use server";

import fs from "fs";
import path from "path";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { attendance, staff, user } from "@/lib/db/schema";
import { logActivity } from "./logs";

function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return { start, end };
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
      let existingNotes: any = {};
      try {
        if (existingRows[0].notes) {
          existingNotes = JSON.parse(existingRows[0].notes);
        }
      } catch (e) {}

      // Keep existing notes for backward compatibility, but move them to checkIn if not structured yet
      if (!existingNotes.checkIn && existingNotes.locationLabel) {
        existingNotes = { checkIn: { ...existingNotes } };
      }

      // Merge new checkOut notes
      const newNotes = {
        ...existingNotes,
        checkOut: attendancePayload
      };

      await db
        .update(attendance)
        .set({
          checkOut: existingRows[0].checkOut ? existingRows[0].checkOut : now,
          notes: JSON.stringify(newNotes),
        })
        .where(eq(attendance.id, existingRows[0].id));

      const updatedRows = await db.select().from(attendance).where(eq(attendance.id, existingRows[0].id)).limit(1);
      savedRecord = updatedRows[0] || null;
    } else {
      const attendanceId = `attendance-${Math.random().toString(36).slice(2, 11)}`;
      const newNotes = {
        checkIn: attendancePayload
      };
      await db.insert(attendance).values({
        id: attendanceId,
        staffId: myStaff.id,
        date: now,
        checkIn: now,
        status: "Hadir",
        notes: JSON.stringify(newNotes),
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

export async function getTodayAllStaffAttendance(filterStart?: Date, filterEnd?: Date) {
  try {
    const now = new Date();
    
    // Default to Bulan Ini
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    
    const finalStart = filterStart || defaultStart;
    const finalEnd = filterEnd || defaultEnd;

    // Format dates manually for safety with raw SQL
    const startStr = `${finalStart.getFullYear()}-${String(finalStart.getMonth() + 1).padStart(2, '0')}-${String(finalStart.getDate()).padStart(2, '0')} 00:00:00`;
    const endStr = `${finalEnd.getFullYear()}-${String(finalEnd.getMonth() + 1).padStart(2, '0')}-${String(finalEnd.getDate()).padStart(2, '0')} 23:59:59`;

    // Added COLLATE to fix mix of collations error in MySQL when joining tables
    const result = await db.execute(sql`
      SELECT 
        a.id, 
        a.date, 
        a.checkIn, 
        a.checkOut, 
        a.status, 
        a.notes,
        u.fullName as staffName, 
        u.role as staffRole
      FROM attendance a
      JOIN staff s ON a.staffId COLLATE utf8mb4_unicode_ci = s.id COLLATE utf8mb4_unicode_ci
      JOIN user u ON s.userId COLLATE utf8mb4_unicode_ci = u.id COLLATE utf8mb4_unicode_ci
      WHERE a.date >= ${startStr} AND a.date <= ${endStr}
      ORDER BY a.createdAt DESC
    `);

    return { success: true, data: (result[0] as unknown as any[]) || [] };
  } catch (error: any) {
    console.error(error);
    return { success: false, error: error.message || "Gagal mengambil data." };
  }
}

export async function getMyAttendanceHistory() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthenticated");

    const myStaffRows = await db.select().from(staff).where(eq(staff.userId, session.user.id)).limit(1);
    const myStaff = myStaffRows[0];
    if (!myStaff) throw new Error("Staff record not found.");

    const history = await db.execute(sql`
      SELECT 
        a.id, 
        a.date, 
        a.checkIn, 
        a.checkOut, 
        a.status, 
        a.notes
      FROM attendance a
      WHERE a.staffId = ${myStaff.id}
      ORDER BY a.date DESC
      LIMIT 30
    `);

    return { success: true, data: (history[0] as unknown as any[]) || [] };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal mengambil riwayat absensi." };
  }
}

export async function getAbsensiDashboardData(filterStart?: Date, filterEnd?: Date) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Sesi tidak ditemukan.");
    
    const role = session.user.role;
    if (role === "ADMINISTRATOR" || role === "PIMPINAN") {
      const allData = await getTodayAllStaffAttendance(filterStart, filterEnd);
      return { success: true, role, data: allData.data };
    } else {
      const myData = await getMyAttendanceToday();
      const myHistory = await getMyAttendanceHistory();
      return { success: true, role, data: { today: myData.data, history: myHistory.data } };
    }
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal memuat dashboard." };
  }
}

export async function deleteAttendance(id: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Sesi tidak ditemukan.");
    
    if (session.user.role !== "ADMINISTRATOR" && session.user.role !== "PIMPINAN") {
      throw new Error("Tidak memiliki izin.");
    }

    await db.delete(attendance).where(eq(attendance.id, id));
    revalidatePath("/dashboard/pegawai/absensi");
    return { success: true, message: "Data absensi berhasil dihapus." };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal menghapus absensi." };
  }
}

export async function editAttendance(id: string, checkInTime: Date | null, checkOutTime: Date | null) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Sesi tidak ditemukan.");
    
    if (session.user.role !== "ADMINISTRATOR" && session.user.role !== "PIMPINAN") {
      throw new Error("Tidak memiliki izin.");
    }

    await db.update(attendance)
      .set({
        checkIn: checkInTime,
        checkOut: checkOutTime,
      })
      .where(eq(attendance.id, id));

    revalidatePath("/dashboard/pegawai/absensi");
    return { success: true, message: "Data absensi berhasil diperbarui." };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal memperbarui absensi." };
  }
}
