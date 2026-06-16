"use server";

import { db } from "@/lib/db";
import { user, staff } from "@/lib/db/schema";
import { eq, or, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { logActivity } from "./logs";
import fs from "fs";
import path from "path";
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

// Helper to save base64 to file
async function saveBase64File(base64Data: string | null, prefix: string, userId: string) {
  if (!base64Data || !base64Data.startsWith("data:")) return base64Data; // Return if not base64

  const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) return base64Data;

  const type = matches[1];
  const buffer = Buffer.from(matches[2], 'base64');
  
  // Extension based on mime type
  const extension = type.split('/')[1] || 'png';
  const fileName = `${prefix}_${userId}_${Date.now()}.${extension}`;
  const relativePath = `/uploads/staff/${fileName}`;
  const absolutePath = path.join(process.cwd(), "public", "uploads", "staff", fileName);

  fs.writeFileSync(absolutePath, buffer);
  return relativePath;
}

export async function getStaff() {
  try {
    // Get users with staff roles
    const users = await db.select()
      .from(user)
      .where(or(
        eq(user.role, "STAFFADMIN"),
        eq(user.role, "OB")
      ))
      .orderBy(user.fullName);
    
    // Get staff profiles for these users
    const staffProfiles = await db.select().from(staff);
    
    // Combine users with their profiles
    const staffWithProfiles = users.map(u => ({
      ...u,
      staffProfile: staffProfiles.find(s => s.userId === u.id) || null,
    }));
    
    return { success: true, data: staffWithProfiles };
  } catch (error: any) {
    console.error("Error fetching staff:", error);
    return { success: false, error: "Gagal mengambil data pegawai: " + error.message };
  }
}

export async function createStaff(data: any) {
  try {
    // 1. Create User
    const hashedPassword = await bcrypt.hash("1234", 10);
    const userId = `user-${Math.random().toString(36).substr(2, 9)}`;

    await db.insert(user).values({
      id: userId,
      username: data.username,
      email: data.email || null,
      phone: data.phone || null,
      passwordHash: hashedPassword,
      fullName: data.fullName,
      role: data.role,
      birthday: data.birthday ? new Date(data.birthday) : null,
      isActive: data.isActive !== undefined ? data.isActive : true,
    });

    // 2. Save files and get paths
    const ktpPath = await saveBase64File(data.ktpPath, "ktp", userId);
    const photoPath = await saveBase64File(data.photoPath, "photo", userId);

    // 3. Create Staff Profile linked to User
    await db.insert(staff).values({
      id: `staff-${Math.random().toString(36).substr(2, 9)}`,
      userId: userId,
      ktpPath: ktpPath || null,
      photoPath: photoPath || null,
    });

    const newUser = await db.select().from(user).where(eq(user.id, userId)).limit(1);
    const newStaff = await db.select().from(staff).where(eq(staff.userId, userId)).limit(1);

    revalidatePath("/dashboard/pegawai/data");
    await logActivity(null, "CREATE_STAFF", `Created staff & user: ${data.fullName} (${userId})`);
    return { success: true, data: { ...newUser[0], staffProfile: newStaff[0] || null } };
  } catch (error: any) {
    console.error("Error creating staff:", error);
    
    // Handle Unique Constraint Errors (Drizzle doesn't have P2002, check for duplicate key error)
    if (error.message?.includes('Duplicate entry') || error.message?.includes('unique constraint')) {
      if (error.message?.includes('username')) {
        return { success: false, error: "Username sudah digunakan. Silakan gunakan username lain." };
      }
      if (error.message?.includes('email')) {
        return { success: false, error: "Email sudah terdaftar. Silakan gunakan email lain." };
      }
      if (error.message?.includes('phone')) {
        return { success: false, error: "Nomor handphone sudah terdaftar. Silakan gunakan nomor lain." };
      }
    }
    
    return { success: false, error: "Gagal menambah pegawai: " + (error.message || "Terjadi kesalahan internal") };
  }
}

export async function updateStaff(id: string, data: any) {
  try {
    // 1. Save files and get paths (only if new base64 data is provided)
    const ktpPath = await saveBase64File(data.ktpPath, "ktp", id);
    const photoPath = await saveBase64File(data.photoPath, "photo", id);

    // 2. Update User
    await db.update(user).set({
      fullName: data.fullName,
      email: data.email || null,
      phone: data.phone || null,
      role: data.role,
      birthday: data.birthday ? new Date(data.birthday) : null,
      isActive: data.isActive,
    }).where(eq(user.id, id));

    // 3. Check if staff profile exists
    const existingStaff = await db.select().from(staff).where(eq(staff.userId, id)).limit(1);
    
    if (existingStaff.length > 0) {
      // Update existing staff profile
      await db.update(staff).set({
        ktpPath: ktpPath || existingStaff[0].ktpPath,
        photoPath: photoPath || existingStaff[0].photoPath,
      }).where(eq(staff.userId, id));
    } else {
      // Create new staff profile
      await db.insert(staff).values({
        id: `staff-${Math.random().toString(36).substr(2, 9)}`,
        userId: id,
        ktpPath: ktpPath || null,
        photoPath: photoPath || null,
      });
    }

    const updatedUser = await db.select().from(user).where(eq(user.id, id)).limit(1);

    revalidatePath("/dashboard/pegawai/data");
    await logActivity(null, "UPDATE_STAFF", `Updated staff: ${data.fullName} (${id})`);
    return { success: true, data: updatedUser[0] };
  } catch (error: any) {
    console.error("Error updating staff:", error);

    // Handle Unique Constraint Errors
    if (error.message?.includes('Duplicate entry') || error.message?.includes('unique constraint')) {
      if (error.message?.includes('username')) {
        return { success: false, error: "Username ini sudah digunakan oleh pegawai lain. Silakan pilih username berbeda." };
      }
      if (error.message?.includes('email')) {
        return { success: false, error: "Email ini sudah digunakan oleh pegawai lain. Silakan gunakan email berbeda." };
      }
      if (error.message?.includes('phone')) {
        return { success: false, error: "Nomor handphone ini sudah digunakan oleh pegawai lain. Silakan gunakan nomor berbeda." };
      }
    }

    return { success: false, error: "Gagal memperbarui pegawai: " + (error.message || "Terjadi kesalahan internal") };
  }
}

export async function deleteStaff(id: string) {
  try {
    await checkAdminOrPimpinan();
    // Optional: Delete physical files before deleting database records
    const staffProfile = await db.select().from(staff).where(eq(staff.userId, id)).limit(1);
    if (staffProfile.length > 0) {
      if (staffProfile[0].ktpPath && staffProfile[0].ktpPath.startsWith("/uploads/")) {
        const fullPath = path.join(process.cwd(), "public", staffProfile[0].ktpPath);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      }
      if (staffProfile[0].photoPath && staffProfile[0].photoPath.startsWith("/uploads/")) {
        const fullPath = path.join(process.cwd(), "public", staffProfile[0].photoPath);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      }
    }

    // Delete staff profile first (due to foreign key constraint)
    await db.delete(staff).where(eq(staff.userId, id));
    
    // Get user info before deletion for logging
    const userData = await db.select().from(user).where(eq(user.id, id)).limit(1);
    
    // Delete user
    await db.delete(user).where(eq(user.id, id));
    
    revalidatePath("/dashboard/pegawai/data");
    await logActivity(null, "DELETE_STAFF", `Deleted staff & user: ${userData[0]?.fullName} (${id})`);
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting staff:", error);
    return { success: false, error: "Gagal menghapus pegawai: " + error.message };
  }
}

export async function resetStaffPassword(id: string) {
  try {
    const hashedPassword = await bcrypt.hash("1234", 10);
    await db.update(user).set({ passwordHash: hashedPassword }).where(eq(user.id, id));
    const userData = await db.select().from(user).where(eq(user.id, id)).limit(1);
    await logActivity(null, "RESET_PASSWORD", `Reset password for staff: ${userData[0]?.fullName} (${id})`);
    return { success: true };
  } catch (error: any) {
    console.error("Error resetting password:", error);
    return { success: false, error: "Gagal reset password: " + error.message };
  }
}

export async function updateStaffStatus(id: string, isActive: boolean) {
  try {
    await db.update(user).set({ isActive }).where(eq(user.id, id));
    const userData = await db.select().from(user).where(eq(user.id, id)).limit(1);
    revalidatePath("/dashboard/pegawai/data");
    await logActivity(null, "UPDATE_STATUS", `Updated status for staff: ${userData[0]?.fullName} to ${isActive ? "Active" : "Inactive"}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error updating status:", error);
    return { success: false, error: "Gagal update status: " + error.message };
  }
}
