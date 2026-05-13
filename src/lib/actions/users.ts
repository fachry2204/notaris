"use server";

import prisma from "@/lib/prisma";

export async function getStaff() {
  try {
    const staff = await prisma.user.findMany({
      where: {
        role: {
          in: ["ADMIN", "STAFF", "SUPERADMIN"],
        },
        isActive: true,
      },
      orderBy: {
        fullName: "asc",
      },
    });
    return { success: true, data: staff };
  } catch (error) {
    console.error("Error fetching staff:", error);
    return { success: false, error: "Gagal mengambil data pegawai" };
  }
}
