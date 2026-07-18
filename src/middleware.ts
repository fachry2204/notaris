import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const userRole = token?.role as string | undefined;

    const redirectToForbidden = (section: string) => {
      const url = new URL("/forbidden", req.url);
      url.searchParams.set("from", path);
      url.searchParams.set("section", section);
      return NextResponse.redirect(url);
    };

    // Middleware runs before every dashboard request. Do not call our own API
    // here: that used to add an HTTP round-trip and multiple DB queries to
    // every page navigation. These are the system-role access rules; sensitive
    // mutations still perform their own authorization in the server actions.
    const permissionsByRole: Record<string, Record<string, boolean>> = {
      ADMINISTRATOR: { client: true, berkas: true, finance: true, invoice: false, settings: true },
      PIMPINAN: { client: true, berkas: true, finance: true, invoice: false, settings: false },
      STAFFADMIN: { client: true, berkas: true, finance: false, invoice: false, settings: false },
      OB: { client: false, berkas: true, finance: false, invoice: false, settings: false },
    };
    const rolePermissions = userRole ? permissionsByRole[userRole] : null;

    // Role-based access control for Audit Log
    if (path.startsWith("/dashboard/audit")) {
      const allowedRoles = ["ADMINISTRATOR", "PIMPINAN"];
      if (!userRole || !allowedRoles.includes(userRole)) {
        return redirectToForbidden("Audit Log");
      }
    }

    // Role-based access control for Pegawai Data
    if (path.startsWith("/dashboard/pegawai/data") || path.startsWith("/dashboard/pegawai/reports")) {
      const allowedRoles = ["ADMINISTRATOR", "PIMPINAN"];
      if (!userRole || !allowedRoles.includes(userRole)) {
        return redirectToForbidden("Data Pegawai");
      }
    }

    // Role-based access control for Stats
    if (path.startsWith("/dashboard/stats") || path.startsWith("/dashboard/productivity")) {
      const allowedRoles = ["ADMINISTRATOR", "PIMPINAN"];
      if (!userRole || !allowedRoles.includes(userRole)) {
        return redirectToForbidden("Statistik");
      }
    }

    const permissionRoutes = [
      { prefixes: ["/dashboard/clients"], permissionKey: "client", label: "Data Client" },
      { prefixes: ["/dashboard/jobs"], permissionKey: "berkas", label: "Data Berkas" },
      { prefixes: ["/dashboard/finance"], permissionKey: "finance", label: "Keuangan" },
      { prefixes: ["/dashboard/invoice"], permissionKey: "invoice", label: "Invoice" },
      { prefixes: ["/dashboard/settings"], permissionKey: "settings", label: "Settings" },
    ];

    for (const route of permissionRoutes) {
      const isMatched = route.prefixes.some((prefix) => path.startsWith(prefix));
      if (!isMatched) continue;

      if (!rolePermissions || !rolePermissions[route.permissionKey]) {
        return redirectToForbidden(route.label);
      }
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*"],
};
