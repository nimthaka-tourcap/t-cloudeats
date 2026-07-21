"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatLKR } from "@/lib/utils/currency";

export function BestSellersSlider() {
  const [heroSlide, setHeroSlide] = useState(0);

  return (
    <div
      className="relative flex items-center justify-center pt-3 pb-4 sm:py-6 min-h-[260px] sm:min-h-[340px] select-none"
      onTouchStart={(e) => ((window as any)._touchX = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        const startX = (window as any)._touchX;
        if (startX !== undefined) {
          const diff = e.changedTouches[0].clientX - startX;
          if (diff < -40) setHeroSlide(1);
          if (diff > 40) setHeroSlide(0);
        }
      }}
    >
      {/* Glow disc */}
      <div className="absolute w-72 h-72 sm:w-96 sm:h-96 bg-white/20 rounded-full blur-3xl" />

      {/* Desktop View: Side by side simultaneously */}
      <div className="hidden sm:flex relative z-10 flex-row gap-4 items-center justify-center">
        {/* Card 1 */}
        <div className="w-64 sm:w-72 bg-white rounded-[24px] p-3.5 shadow-2xl hero-float">
          <div className="relative h-40 sm:h-44 rounded-xl overflow-hidden bg-orange-50 mb-2.5">
            <img src="/Product Images/FR-05.avif" alt="Seafood Fried Rice" className="w-full h-full object-cover" />
            <span className="absolute top-2.5 left-2.5 tag-chip bg-[#F26F21] text-white text-[9px]">🔥 #1 Best Seller</span>
          </div>
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 className="font-extrabold text-xs sm:text-sm text-gray-900">Seafood Fried Rice</h3>
              <p className="text-[10px] text-gray-500 font-bold flex items-center gap-1 mt-0.5">Serves 2</p>
            </div>
            <span className="font-black text-[#F26F21] text-sm">{formatLKR(1500)}</span>
          </div>
          <Link
            href="/order"
            className="w-full flex items-center justify-center gap-2 text-white text-xs font-black py-2 rounded-xl transition-all active:scale-95 mt-2"
            style={{ background: "#F26F21", boxShadow: "0 4px 14px rgba(242,111,33,0.35)" }}
          >
            Order Now
          </Link>
        </div>

        {/* Card 2 */}
        <div className="w-64 sm:w-72 bg-white rounded-[24px] p-3.5 shadow-2xl hero-float" style={{ animationDelay: "1.5s" }}>
          <div className="relative h-40 sm:h-44 rounded-xl overflow-hidden bg-orange-50 mb-2.5">
            <img src="/Product Images/FR-07.avif" alt="Nasi Goreng" className="w-full h-full object-cover" />
            <span className="absolute top-2.5 left-2.5 tag-chip bg-[#0D0D0D] text-white text-[9px]">⭐ #2 Top Seller</span>
          </div>
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 className="font-extrabold text-xs sm:text-sm text-gray-900">Nasi Goreng</h3>
              <p className="text-[10px] text-gray-500 font-bold flex items-center gap-1 mt-0.5">Serves 2</p>
            </div>
            <span className="font-black text-[#F26F21] text-sm">{formatLKR(1400)}</span>
          </div>
          <Link
            href="/order"
            className="w-full flex items-center justify-center gap-2 text-white text-xs font-black py-2 rounded-xl transition-all active:scale-95 mt-2"
            style={{ background: "#F26F21", boxShadow: "0 4px 14px rgba(242,111,33,0.35)" }}
          >
            Order Now
          </Link>
        </div>
      </div>

      {/* Mobile View: Touch Swipeable Cards Stack */}
      <div className="flex sm:hidden relative z-10 w-full max-w-md items-center justify-center min-h-[290px] py-4 px-2 select-none">
        {/* Card 1: #1 Best Seller (Seafood Fried Rice) */}
        <div
          onClick={() => setHeroSlide(0)}
          className={`w-60 bg-white rounded-[24px] p-3.5 transition-all duration-150 ease-in-out cursor-pointer ${
            heroSlide === 0
              ? "relative z-20 scale-100 opacity-100 shadow-xl pointer-events-auto -translate-x-10"
              : "absolute z-10 scale-90 opacity-60 -translate-x-24 blur-[0.2px] hover:opacity-80 pointer-events-auto"
          }`}
        >
          <div className="relative h-36 rounded-xl overflow-hidden bg-orange-50 mb-2.5">
            <img src="/Product Images/FR-05.avif" alt="Seafood Fried Rice" className="w-full h-full object-cover" />
            <span className="absolute top-2.5 left-2.5 tag-chip bg-[#F26F21] text-white text-[9px]">🔥 #1 Best Seller</span>
          </div>
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 className="font-extrabold text-xs text-gray-900">Seafood Fried Rice</h3>
              <p className="text-[10px] text-gray-500 font-bold flex items-center gap-1 mt-0.5">Serves 2</p>
            </div>
            <span className="font-black text-[#F26F21] text-sm">{formatLKR(1500)}</span>
          </div>
          <Link
            href="/order"
            className="w-full flex items-center justify-center gap-2 text-white text-xs font-black py-2 rounded-xl transition-all active:scale-95 mt-2"
            style={{ background: "#F26F21", boxShadow: "0 4px 14px rgba(242,111,33,0.35)" }}
          >
            Order Now
          </Link>
        </div>

        {/* Card 2: #2 Top Seller (Nasi Goreng) */}
        <div
          onClick={() => setHeroSlide(1)}
          className={`w-60 bg-white rounded-[24px] p-3.5 transition-all duration-150 ease-in-out cursor-pointer ${
            heroSlide === 1
              ? "relative z-20 scale-100 opacity-100 shadow-xl pointer-events-auto translate-x-10"
              : "absolute z-10 scale-90 opacity-60 translate-x-24 blur-[0.2px] hover:opacity-80 pointer-events-auto"
          }`}
        >
          <div className="relative h-36 rounded-xl overflow-hidden bg-orange-50 mb-2.5">
            <img src="/Product Images/FR-07.avif" alt="Nasi Goreng" className="w-full h-full object-cover" />
            <span className="absolute top-2.5 left-2.5 tag-chip bg-[#0D0D0D] text-white text-[9px]">⭐ #2 Top Seller</span>
          </div>
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 className="font-extrabold text-xs text-gray-900">Nasi Goreng</h3>
              <p className="text-[10px] text-gray-500 font-bold flex items-center gap-1 mt-0.5">Serves 2</p>
            </div>
            <span className="font-black text-[#F26F21] text-sm">{formatLKR(1400)}</span>
          </div>
          <Link
            href="/order"
            className="w-full flex items-center justify-center gap-2 text-white text-xs font-black py-2 rounded-xl transition-all active:scale-95 mt-2"
            style={{ background: "#F26F21", boxShadow: "0 4px 14px rgba(242,111,33,0.35)" }}
          >
            Order Now
          </Link>
        </div>
      </div>
    </div>
  );
}
