"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logActivity } from "./logs";

export async function getClients() {
  try {
    const clients = await prisma.client.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    return { success: true, data: clients };
  } catch (error) {
    console.error("Error fetching clients:", error);
    return { success: false, error: "Gagal mengambil data client" };
  }
}

export async function getClientById(id: string) {
  try {
    const client = await prisma.client.findUnique({
      where: { id },
    });
    return { success: true, data: client };
  } catch (error) {
    console.error("Error fetching client:", error);
    return { success: false, error: "Gagal mengambil data client" };
  }
}

export async function createClient(data: any) {
  try {
    const client = await prisma.client.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        npwp: data.npwp,
        birthday: data.birthday ? new Date(data.birthday) : null,
      },
    });
    revalidatePath("/dashboard/clients");
    await logActivity(null, "CREATE_CLIENT", `Created client: ${client.name} (${client.id})`);
    return { success: true, data: client };
  } catch (error) {
    console.error("Error creating client:", error);
    return { success: false, error: "Gagal menambah client" };
  }
}

export async function updateClient(id: string, data: any) {
  try {
    const client = await prisma.client.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        npwp: data.npwp,
        birthday: data.birthday ? new Date(data.birthday) : null,
      },
    });
    revalidatePath("/dashboard/clients");
    await logActivity(null, "UPDATE_CLIENT", `Updated client: ${client.name} (${client.id})`);
    return { success: true, data: client };
  } catch (error) {
    console.error("Error updating client:", error);
    return { success: false, error: "Gagal memperbarui client" };
  }
}

export async function deleteClient(id: string) {
  try {
    await prisma.client.delete({
      where: { id },
    });
    revalidatePath("/dashboard/clients");
    await logActivity(null, "DELETE_CLIENT", `Deleted client ID: ${id}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting client:", error);
    return { success: false, error: "Gagal menghapus client" };
  }
}
