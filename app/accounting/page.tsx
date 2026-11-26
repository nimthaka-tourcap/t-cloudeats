"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AccountingRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/cashier?tab=finance_reports");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-slate-600 text-xs font-medium">
      Opening Finance &amp; SLFRS Reports...
    </div>
  );
}
