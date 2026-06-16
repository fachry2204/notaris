"use server";

import { db } from "@/lib/db";
import { admin } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { logActivity } from "./logs";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function checkAdminOrPimpinan() {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMINISTRATOR", "PIMPINAN"].includes(session.user.role)) {
    throw new Error("Anda tidak memiliki izin untuk melakukan tindakan ini.");
  }
  return session;
}

export async function getAdmins() {
  try {
    await checkAdminOrPimpinan();
    const admins = await db.select().from(admin).orderBy(admin.fullName);
    return { success: true, data: admins };
  } catch (error: any) {
    return { success: false, error: "Gagal mengambil data admin: " + error.message };
  }
}

export async function createAdmin(data: any) {
  try {
    await checkAdminOrPimpinan();
    const hashedPassword = await bcrypt.hash(data.password || "123456", 10);
    const adminId = `admin-${Math.random().toString(36).substr(2, 9)}`;

    await db.insert(admin).values({
      id: adminId,
      username: data.username,
      email: data.email || `admin${Date.now()}@test.com`,
      phone: data.phone || null,
      passwordHash: hashedPassword,
      fullName: data.fullName,
      role: data.role,
      isActive: data.isActive !== undefined ? data.isActive : true,
    });

    const newAdmin = await db.select().from(admin).where(eq(admin.id, adminId)).limit(1);
    revalidatePath("/dashboard/settings");
    await logActivity(null, "CREATE_ADMIN", `Created admin: ${data.fullName}`);
    return { success: true, data: newAdmin[0] };
  } catch (error: any) {
    if (error.message?.includes('Duplicate entry')) {
      return { success: false, error: "Username, email, atau phone sudah digunakan." };
    }
    return { success: false, error: "Gagal menambah admin: " + error.message };
  }
}

export async function updateAdmin(id: string, data: any) {
  try {
    await checkAdminOrPimpinan();
    await db.update(admin).set({
      fullName: data.fullName,
      email: data.email || null,
      phone: data.phone || null,
      role: data.role,
      isActive: data.isActive,
    }).where(eq(admin.id, id));

    const updatedAdmin = await db.select().from(admin).where(eq(admin.id, id)).limit(1);
    revalidatePath("/dashboard/settings");
    await logActivity(null, "UPDATE_ADMIN", `Updated admin: ${data.fullName}`);
    return { success: true, data: updatedAdmin[0] };
  } catch (error: any) {
    return { success: false, error: "Gagal memperbarui admin: " + error.message };
  }
}

export async function deleteAdmin(id: string) {
  try {
    await checkAdminOrPimpinan();
    const adminData = await db.select().from(admin).where(eq(admin.id, id)).limit(1);
    await db.delete(admin).where(eq(admin.id, id));
    revalidatePath("/dashboard/settings");
    await logActivity(null, "DELETE_ADMIN", `Deleted admin: ${adminData[0]?.fullName}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Gagal menghapus admin: " + error.message };
  }
}

export async function resetAdminPassword(id: string) {
  try {
    await checkAdminOrPimpinan();
    const hashedPassword = await bcrypt.hash("123456", 10);
    await db.update(admin).set({ passwordHash: hashedPassword }).where(eq(admin.id, id));
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Gagal reset password: " + error.message };
  }
}

export async function updateAdminStatus(id: string, isActive: boolean) {
  try {
    await checkAdminOrPimpinan();
    await db.update(admin).set({ isActive }).where(eq(admin.id, id));
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Gagal update status: " + error.message };
  }
}
