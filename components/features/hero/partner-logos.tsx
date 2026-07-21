import React from "react";
import { STORE_CONFIG } from "@/lib/constants/store";

export function PartnerLogos() {
  return (
    <div className="pt-2 sm:pt-3 flex flex-wrap items-start gap-6 sm:gap-8">
      {/* Delivery Partners Block */}
      <div className="flex flex-col items-start gap-1.5">
        <div className="flex items-center gap-3">
          <a
            href={STORE_CONFIG.uberEatsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block transition-transform hover:scale-105 active:scale-95 shadow-md rounded-[14px] overflow-hidden"
            title="Order on Uber Eats"
          >
            <img src="/ubereats.png" alt="Uber Eats" className="h-10 sm:h-11 w-auto object-contain rounded-[14px]" />
          </a>
          <div className="inline-block shadow-md rounded-[14px] overflow-hidden" title="PickMe Delivery">
            <img src="/pickme.png" alt="PickMe" className="h-10 sm:h-11 w-auto object-contain rounded-[14px]" />
          </div>
        </div>
        <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-white mt-0.5 drop-shadow-sm">
          DELIVERY PARTNERS
        </span>
      </div>

      <div className="h-10 w-px bg-white/30 hidden sm:block self-center" />

      {/* Payment Partner Block */}
      <div className="flex flex-col items-start gap-1.5">
        <div className="flex items-center gap-3">
          <div className="inline-block shadow-md rounded-[14px] overflow-hidden" title="HelaPOS Payment Partner">
            <img src="/helapos.png" alt="HelaPOS" className="h-10 sm:h-11 w-auto object-contain rounded-[14px]" />
          </div>
        </div>
        <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-white mt-0.5 drop-shadow-sm">
          PAYMENT SOLUTIONS
        </span>
      </div>
    </div>
  );
}
