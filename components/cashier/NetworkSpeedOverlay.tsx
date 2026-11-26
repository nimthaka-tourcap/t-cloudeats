"use client";

import React from "react";
import { WifiOff } from "lucide-react";

interface NetworkSpeedOverlayProps {
  isOnline?: boolean;
  speedMbps?: number | null;
  minRequiredMbps?: number;
  onRetry?: () => void;
  isChecking?: boolean;
}

export default function NetworkSpeedOverlay({
  onRetry,
}: NetworkSpeedOverlayProps) {
  return (
    <div
      onClick={onRetry}
      className="fixed inset-0 z-[99999] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn select-none cursor-pointer"
      title="Click to recheck connection"
    >
      <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-6 sm:p-7 text-center text-white shadow-2xl flex flex-col items-center gap-3.5 max-w-xs w-full">
        <div className="w-14 h-14 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500 animate-pulse">
          <WifiOff size={28} />
        </div>
        <h2 className="text-sm sm:text-base font-bold text-slate-100 tracking-wide">
          Slow Internet Connection
        </h2>
      </div>
    </div>
  );
}
