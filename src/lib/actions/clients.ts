"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { client } from "@/lib/db/schema";
import { eq, or, like, and, ne } from "drizzle-orm";
import { logActivity } from "./logs";
import { formatWhatsApp } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function checkAdminOrPimpinan() {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMINISTRATOR", "PIMPINAN"].includes(session.user.role)) {
    throw new Error("Anda tidak memiliki izin untuk melakukan tindakan ini.");
  }
  return session;
}

export async function getClients() {
  try {
    const clients = await db.select().from(client).orderBy(client.name);
    return { success: true, data: clients };
  } catch (error: any) {
    console.error("Error fetching clients:", error);
    return { success: false, error: "Gagal mengambil data klien: " + error.message };
  }
}

export async function getClientStats() {
  try {
    const clients = await db.select().from(client);
    
    return {
      success: true,
      data: {
        total: clients.length,
        individual: clients.filter(c => c.type === "individual").length,
        corporate: clients.filter(c => c.type === "corporate").length,
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getClientById(id: string) {
  if (!id) {
    return { success: false, error: "ID klien tidak valid" };
  }
  try {
    const clientData = await db.select().from(client).where(eq(client.id, id)).limit(1);
    return { success: true, data: clientData[0] || null };
  } catch (error: any) {
    console.error("Error fetching client by ID:", error);
    return { success: false, error: "Gagal mengambil data klien" };
  }
}

export async function searchClients(query: string) {
  try {
    const clients = await db.select().from(client)
      .where(or(
        like(client.name, `%${query}%`),
        like(client.phone, `%${query}%`),
        like(client.address, `%${query}%`)
      ))
      .orderBy(client.name)
      .limit(5);
    return { success: true, data: clients };
  } catch (error: any) {
    console.error("Error searching clients:", error);
    return { success: false, error: "Gagal mencari data klien" };
  }
}

export async function createClient(data: any) {
  try {
    const formattedPhone = formatWhatsApp(data.phone);

    // Check for existing client with same email or phone
    const conditions = [];
    if (data.email) conditions.push(eq(client.email, data.email));
    if (data.phone) conditions.push(eq(client.phone, formattedPhone));
    
    let existingClient = null;
    if (conditions.length > 0) {
      const results = await db.select().from(client).where(or(...conditions)).limit(1);
      existingClient = results[0] || null;
    }

    if (existingClient) {
      if (data.email && existingClient.email === data.email) {
        return { success: false, error: "Email ini sudah terdaftar untuk client lain." };
      }
      if (data.phone && existingClient.phone === formattedPhone) {
        return { success: false, error: "Nomor handphone ini sudah terdaftar untuk client lain." };
      }
    }

    const clientId = `client-${Math.random().toString(36).substr(2, 9)}`;
    await db.insert(client).values({
      id: clientId,
      name: data.name,
      email: data.email || null,
      phone: formattedPhone || null,
      address: data.address || null,
      country: data.country || null,
      province: data.province || null,
      city: data.city || null,
      district: data.district || null,
      village: data.village || null,
      type: data.type || "individual",
      gender: data.gender || null,
      citizenship: data.citizenship || null,
      picName: data.picName || null,
      npwp: data.npwp || null,
      birthday: data.birthday ? new Date(data.birthday) : null,
    });
    
    const newClient = await db.select().from(client).where(eq(client.id, clientId)).limit(1);
    revalidatePath("/dashboard/clients");
    await logActivity(null, "CREATE_CLIENT", `Created client: ${data.name} (${clientId})`);
    return { success: true, data: newClient[0] };
  } catch (error: any) {
    console.error("Error creating client:", error);
    return { success: false, error: "Gagal menambah klien: " + (error.message || "Terjadi kesalahan") };
  }
}

export async function updateClient(id: string, data: any) {
  try {
    const formattedPhone = formatWhatsApp(data.phone);

    // Check for existing client with same email or phone (excluding current client)
    const conditions = [];
    if (data.email) conditions.push(eq(client.email, data.email));
    if (data.phone) conditions.push(eq(client.phone, formattedPhone));
    
    let existingClient = null;
    if (conditions.length > 0) {
      const results = await db.select().from(client)
        .where(and(
          or(...conditions),
          ne(client.id, id)
        ))
        .limit(1);
      existingClient = results[0] || null;
    }

    if (existingClient) {
      if (data.email && existingClient.email === data.email) {
        return { success: false, error: "Email ini sudah digunakan oleh client lain." };
      }
      if (data.phone && existingClient.phone === formattedPhone) {
        return { success: false, error: "Nomor handphone ini sudah digunakan oleh client lain." };
      }
    }

    await db.update(client).set({
      name: data.name,
      email: data.email || null,
      phone: formattedPhone || null,
      address: data.address || null,
      country: data.country || null,
      province: data.province || null,
      city: data.city || null,
      district: data.district || null,
      village: data.village || null,
      type: data.type || "individual",
      gender: data.gender || null,
      citizenship: data.citizenship || null,
      picName: data.picName || null,
      npwp: data.npwp || null,
      birthday: data.birthday ? new Date(data.birthday) : null,
    }).where(eq(client.id, id));
    
    const updatedClient = await db.select().from(client).where(eq(client.id, id)).limit(1);
    revalidatePath("/dashboard/clients");
    await logActivity(null, "UPDATE_CLIENT", `Updated client: ${data.name} (${id})`);
    return { success: true, data: updatedClient[0] };
  } catch (error: any) {
    console.error("Error updating client:", error);
    return { success: false, error: "Gagal memperbarui klien: " + (error.message || "Terjadi kesalahan") };
  }
}

export async function deleteClient(id: string) {
  try {
    await checkAdminOrPimpinan();
    const clientData = await db.select().from(client).where(eq(client.id, id)).limit(1);
    await db.delete(client).where(eq(client.id, id));
    revalidatePath("/dashboard/clients");
    await logActivity(null, "DELETE_CLIENT", `Deleted client: ${clientData[0]?.name} (${id})`);
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting client:", error);
    return { success: false, error: "Gagal menghapus klien" };
  }
}
