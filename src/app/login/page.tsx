"use client";

import React, { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, MapPin, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [appName, setAppName] = useState("NOTARIS DIGITAL");
  const [officeName, setOfficeName] = useState("Monitoring & Management System");
  const router = useRouter();

  useEffect(() => {
    const loadBranding = async () => {
      try {
        const res = await fetch("/api/settings", { cache: "no-store" });
        const result = await res.json();

        if (res.ok && result.success) {
          setLogoUrl(result.data?.branding?.logoUrl || "");
          setAppName(result.data?.general?.appName || "NOTARIS DIGITAL");
          setOfficeName(result.data?.general?.officeName || "Monitoring & Management System");
        }
      } catch (error) {
        console.error("Failed to load login branding:", error);
      }
    };

    loadBranding();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid username or password");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-100 px-4 py-10">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -left-16 top-10 h-64 w-64 rounded-full bg-pink-200/40 blur-3xl" />
        <div className="absolute -right-10 bottom-10 h-72 w-72 rounded-full bg-pink-100/50 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-xl"
      >
        <Card className="overflow-hidden rounded-[2rem] border border-pink-100 bg-white shadow-2xl shadow-slate-300/40">
          <div className="h-8 bg-[radial-gradient(circle_at_10px_10px,rgba(255,255,255,0.95)_4px,transparent_4.5px),linear-gradient(135deg,#ec4899_0%,#f472b6_100%)] bg-[length:24px_24px,100%_100%] bg-repeat-x bg-left-top" />
          <CardContent className="px-6 pb-8 pt-7 md:px-10">
            <div className="mb-8 flex flex-col items-center text-center">
              <div className="mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl bg-pink-50 shadow-lg shadow-pink-200/40">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo kantor"
                    className="h-full w-full object-contain p-3"
                  />
                ) : (
                  <ShieldCheck className="h-11 w-11 text-pink-500" />
                )}
              </div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">{appName}</h1>
              <p className="mt-2 text-base text-slate-500">{officeName}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-900">Selamat Datang</h2>
                <p className="text-sm text-slate-500">Silakan login untuk mengakses dashboard Anda.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="username" className="ml-1 text-base font-bold text-slate-900">Username</Label>
                <Input
                  id="username"
                  placeholder="Masukkan username"
                  className="h-16 rounded-2xl border-slate-200 bg-white px-5 text-base text-slate-900 shadow-sm transition-all focus:border-pink-500 focus:ring-pink-500/20"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="ml-1 text-base font-bold text-slate-900">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Masukkan password"
                  className="h-16 rounded-2xl border-slate-200 bg-white px-5 text-base text-slate-900 shadow-sm transition-all focus:border-pink-500 focus:ring-pink-500/20"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="h-14 w-full rounded-2xl bg-pink-500 text-base font-bold text-white shadow-xl shadow-pink-500/20 transition-all hover:bg-pink-600 active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses Login...
                  </>
                ) : (
                  "Masuk ke Sistem"
                )}
              </Button>
            </form>

            <div className="mt-8 border-t border-slate-100 pt-6 text-center">
              <p className="inline-flex items-center gap-2 text-sm text-slate-400">
                <MapPin className="h-4 w-4" />
                {officeName} &copy; 2026
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
