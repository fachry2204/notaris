"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getJobById } from "@/lib/actions/jobs";
import { toast } from "sonner";

export default function EditJobDispatcher() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkCategory = async () => {
      const result = await getJobById(id as string);
      if (result.success) {
        const category = result.data.category;
        let route = "";
        
        if (category === "Badan Hukum/Usaha") route = "badan-hukum";
        else if (category === "Non Badan Hukum") route = "non-badan-hukum";
        else if (category === "PPAT") route = "ppat";
        else route = "umum"; // Fallback

        router.replace(`/dashboard/jobs/${id}/edit/${route}`);
      } else {
        toast.error("Gagal memuat data berkas");
        router.back();
      }
    };
    checkCategory();
  }, [id]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-pink-500 border-t-transparent"></div>
      <p className="text-sm font-medium text-muted-foreground animate-pulse">Menyiapkan formulir edit...</p>
    </div>
  );
}
