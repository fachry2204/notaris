"use client";

import React, { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
    <div className="relative flex min-h-screen items-center justify-center bg-slate-200 sm:px-4 sm:py-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full h-full sm:h-auto sm:max-w-md"
      >
        <Card className="overflow-hidden rounded-none sm:rounded-[2rem] border-none bg-white shadow-none sm:shadow-2xl min-h-[100dvh] sm:min-h-0 flex flex-col justify-center">
          <CardContent className="px-8 pb-10 pt-8">
            <div className="mb-8 flex flex-col items-center text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center overflow-hidden">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo kantor"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <ShieldCheck className="h-16 w-16 text-orange-500" />
                )}
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">{appName}</h1>
              <p className="mt-1 text-sm text-slate-500">{officeName}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-xl bg-red-50 p-3 text-center text-sm font-medium text-red-600">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-bold text-slate-900">Username</Label>
                <Input
                  id="username"
                  placeholder="Masukkan username"
                  className="h-14 rounded-2xl border-none bg-[#f0f4f8] px-5 text-base text-slate-900 focus-visible:ring-2 focus-visible:ring-pink-500/50"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-bold text-slate-900">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="h-14 rounded-2xl border-none bg-[#f0f4f8] px-5 text-base text-slate-900 focus-visible:ring-2 focus-visible:ring-pink-500/50"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="pt-2">
                <Button
                  type="submit"
                  className="h-14 w-full rounded-2xl bg-pink-500 text-base font-bold text-white shadow-lg shadow-pink-500/30 transition-all hover:bg-pink-600 active:scale-[0.98]"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    "Masuk ke Sistem"
                  )}
                </Button>
              </div>
              <div className="pt-2">
                <Link 
                  href="/cek-berkas" 
                  className="flex items-center justify-center h-14 w-full rounded-2xl bg-sky-400 text-base font-bold text-white shadow-lg shadow-sky-400/30 transition-all hover:bg-sky-500 active:scale-[0.98]"
                >
                  Cek Berkas Client
                </Link>
              </div>
            </form>

            <div className="mt-6 border-t border-slate-100 pt-4 text-center">
              <p className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                <MapPin className="h-3.5 w-3.5" />
                Sistem Informasi Notaris &copy; 2026
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
