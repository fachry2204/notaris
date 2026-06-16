import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const LEGACY_SETTINGS_FILE = path.join(process.cwd(), "data", "app-settings.json");
const SETTINGS_KEY = "GLOBAL_APP_SETTINGS";

const defaultPermissions = {
  dashboard: false,
  client: false,
  berkas: false,
  finance: false,
  invoice: false,
  settings: false,
};

function normalizeRoles(roles: any[]) {
  return roles.map((role) => ({
    ...role,
    permissions: {
      ...defaultPermissions,
      ...(role.permissions || {}),
    },
  }));
}

const defaultSettings = {
  general: {
    appName: "NOTARIS DIGITAL",
    officeName: "Kantor Notaris & PPAT Fachry, S.H., M.Kn.",
    officeAddress: "Jl. Jenderal Sudirman No. 123, Jakarta Selatan",
    officeEmail: "info@notarisfachry.com",
    officePhone: "+62 21 12345678",
  },
  branding: {
    logoUrl: "",
    faviconUrl: "",
  },
  finance: {
    bankName: "Bank Central Asia (BCA)",
    accountNumber: "1234567890",
    accountName: "Kantor Notaris Fachry",
  },
  roles: [
    {
      id: "ADMINISTRATOR",
      key: "ADMINISTRATOR",
      name: "Administrator",
      color: "bg-pink-500",
      systemRole: true,
      permissions: {
        dashboard: true,
        client: true,
        berkas: true,
        finance: true,
        invoice: true,
        settings: true,
      },
    },
    {
      id: "PIMPINAN",
      key: "PIMPINAN",
      name: "Pimpinan",
      color: "bg-blue-500",
      systemRole: true,
      permissions: {
        dashboard: true,
        client: true,
        berkas: true,
        finance: true,
        invoice: true,
        settings: false,
      },
    },
    {
      id: "STAFFADMIN",
      key: "STAFFADMIN",
      name: "Staff Admin",
      color: "bg-emerald-500",
      systemRole: true,
      permissions: {
        dashboard: true,
        client: true,
        berkas: true,
        finance: false,
        invoice: false,
        settings: false,
      },
    },
    {
      id: "OB",
      key: "OB",
      name: "OB / Kurir",
      color: "bg-slate-500",
      systemRole: true,
      permissions: {
        dashboard: true,
        client: false,
        berkas: true,
        finance: false,
        invoice: false,
        settings: false,
      },
    },
  ],
  whatsapp: {
    provider: "fonnte",
    endpointUrl: "https://api.fonnte.com/send",
    apiToken: "",
    messages: {
      newJob:
        "Halo {clientName}, berkas baru Anda dengan judul {jobTitle} telah dibuat dan sedang diproses oleh sistem kami.",
      statusUpdate:
        "Halo {clientName}, status berkas {jobTitle} telah diperbarui menjadi {status}. Silakan hubungi kantor kami bila memerlukan bantuan.",
      newInvoice:
        "Halo {clientName}, invoice baru untuk {jobTitle} telah dibuat dengan nominal {amount}. Mohon cek informasi pembayaran Anda.",
    },
  },
};

async function ensureSettingsTable() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS app_settings (
      id VARCHAR(255) PRIMARY KEY,
      settings_key VARCHAR(255) NOT NULL UNIQUE,
      settings_value LONGTEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
}

function mergeWithDefaults(input: any) {
  return {
    ...defaultSettings,
    ...input,
    general: {
      ...defaultSettings.general,
      ...(input.general || {}),
    },
    branding: {
      ...defaultSettings.branding,
      ...(input.branding || {}),
    },
    finance: {
      ...defaultSettings.finance,
      ...(input.finance || {}),
    },
    whatsapp: {
      ...defaultSettings.whatsapp,
      ...(input.whatsapp || {}),
      messages: {
        ...defaultSettings.whatsapp.messages,
        ...(input.whatsapp?.messages || {}),
      },
    },
    roles: Array.isArray(input.roles) && input.roles.length > 0 ? normalizeRoles(input.roles) : defaultSettings.roles,
  };
}

async function readLegacySettingsFile() {
  try {
    const raw = await readFile(LEGACY_SETTINGS_FILE, "utf8");
    return mergeWithDefaults(JSON.parse(raw));
  } catch {
    return null;
  }
}

async function saveSettingsToDatabase(settings: any) {
  await ensureSettingsTable();
  const payload = JSON.stringify(mergeWithDefaults(settings));

  await db.execute(sql`
    INSERT INTO app_settings (id, settings_key, settings_value)
    VALUES (${`settings-${SETTINGS_KEY.toLowerCase()}`}, ${SETTINGS_KEY}, ${payload})
    ON DUPLICATE KEY UPDATE
      settings_value = VALUES(settings_value),
      updated_at = CURRENT_TIMESTAMP
  `);
}

function extractQueryRows(result: any) {
  if (!result) return [];
  if (Array.isArray(result[0])) return result[0];
  if (Array.isArray(result.rows)) return result.rows;
  if (Array.isArray(result)) return result;
  return [];
}

async function readSettings() {
  await ensureSettingsTable();

  const queryResult = await db.execute(sql`
    SELECT settings_value
    FROM app_settings
    WHERE settings_key = ${SETTINGS_KEY}
    LIMIT 1
  `);

  const rows = extractQueryRows(queryResult);
  const record = rows[0];
  if (record?.settings_value) {
    try {
      const parsed = mergeWithDefaults(JSON.parse(record.settings_value as string));
      return parsed;
    } catch {
      return defaultSettings;
    }
  }

  const legacySettings = await readLegacySettingsFile();
  if (legacySettings) {
    await saveSettingsToDatabase(legacySettings);
    return legacySettings;
  }

  await saveSettingsToDatabase(defaultSettings);
  return defaultSettings;
}

export async function GET() {
  try {
    const settings = await readSettings();
    return NextResponse.json(
      { success: true, data: settings },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memuat pengaturan." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const nextSettings = mergeWithDefaults(body);
    await saveSettingsToDatabase(nextSettings);

    return NextResponse.json({ success: true, data: nextSettings });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menyimpan pengaturan." },
      { status: 500 }
    );
  }
}
