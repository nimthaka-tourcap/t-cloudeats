"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AccountingRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/cashier?tab=finance_reports");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0A0B0F] flex items-center justify-center text-zinc-400 text-xs">
      Opening Finance &amp; SLFRS Reports...
    </div>
  );
}
