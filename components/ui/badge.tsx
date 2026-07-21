import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "orange" | "dark" | "outline" | "gold";
  className?: string;
}

export function Badge({ children, variant = "orange", className = "" }: BadgeProps) {
  const baseClasses = "inline-flex items-center gap-1 font-black px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider shadow-sm";
  
  const variants = {
    orange: "bg-[#F26F21] text-white",
    dark: "bg-[#0D0D0D] text-white",
    gold: "bg-yellow-400 text-black",
    outline: "border border-white/40 text-white bg-black/20 backdrop-blur-md",
  };

  return <span className={`${baseClasses} ${variants[variant]} ${className}`}>{children}</span>;
}
