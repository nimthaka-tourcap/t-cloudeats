"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PosRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#050814] flex items-center justify-center text-slate-400 font-mono text-xs">
      Redirecting to login...
    </div>
  );
}
