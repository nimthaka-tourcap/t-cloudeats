"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Lock,
  Mail,
  ArrowRight,
  Loader2,
  Maximize,
  Minimize,
  Eye,
  EyeOff,
  ShieldCheck,
  Zap,
  Activity,
  Sparkles,
  Terminal,
  KeyRound,
  CheckCircle2,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [autofillSuccess, setAutofillSuccess] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => {});
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(() => {});
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleAutofill = () => {
    setEmail("cashier@t-cloudeats.com");
    setPassword("cashier@ti321");
    setError("");
    setAutofillSuccess(true);
    setTimeout(() => setAutofillSuccess(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    setTimeout(() => {
      if (email === "cashier@t-cloudeats.com" && password === "cashier@ti321") {
        const lastUser = localStorage.getItem("t-cloud-eats-user");
        if (lastUser !== email) {
          localStorage.removeItem("t-cloud-eats-orders");
          localStorage.removeItem("t-cloud-eats-cms");
        }
        localStorage.setItem("t-cloud-eats-user", email);
        localStorage.setItem("t-cloud-eats-cache-time", Date.now().toString());
        router.push("/cashier");
      } else {
        setError("AUTHENTICATION FAILED: Invalid terminal credentials.");
        setIsLoading(false);
      }
    }, 600);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#05070D] text-slate-100 font-sans antialiased flex flex-col justify-between p-4 sm:p-6 overflow-hidden select-none">
      {/* ── Background Cascading Cyber Ambiance ────────────────────────── */}
      {/* Radial Gradient Mesh */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-sky-500/15 blur-[140px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[650px] h-[650px] rounded-full bg-[#F26F21]/15 blur-[150px]" />
        <div className="absolute top-[35%] right-[20%] w-[450px] h-[450px] rounded-full bg-indigo-600/10 blur-[130px]" />
      </div>

      {/* Cyber Grid Matrix Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(56, 189, 248, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(56, 189, 248, 0.1) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(ellipse at center, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 80%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 80%)",
        }}
      />

      {/* Cascading Diagonal Cyber Beams */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute -top-40 left-1/4 w-[1px] h-[1200px] bg-gradient-to-b from-transparent via-sky-400 to-transparent rotate-[35deg]" />
        <div className="absolute -top-60 right-1/3 w-[1px] h-[1400px] bg-gradient-to-b from-transparent via-[#F26F21]/70 to-transparent rotate-[35deg]" />
        <div className="absolute -top-20 right-1/4 w-[1px] h-[1000px] bg-gradient-to-b from-transparent via-cyan-400/50 to-transparent rotate-[35deg]" />
      </div>

      {/* ── Top Bar: Telemetry & Fullscreen HUD ───────────────────────── */}
      <header className="relative z-10 flex items-center justify-between max-w-6xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-mono tracking-wider uppercase text-emerald-400 font-bold">
              Gateway Online
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/5 backdrop-blur-md text-[11px] font-mono text-slate-400">
            <Terminal size={12} className="text-sky-400" />
            <span>NODE // POS-LK-01</span>
          </div>
        </div>

        <button
          onClick={toggleFullscreen}
          type="button"
          className="group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-sky-400/40 hover:bg-white/[0.08] backdrop-blur-md transition-all cursor-pointer text-slate-400 hover:text-slate-100"
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          <span className="text-[10px] font-mono font-bold tracking-wider uppercase hidden sm:inline">
            {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          </span>
          {isFullscreen ? (
            <Minimize size={14} className="group-hover:scale-110 transition-transform text-sky-400" />
          ) : (
            <Maximize size={14} className="group-hover:scale-110 transition-transform text-sky-400" />
          )}
        </button>
      </header>

      {/* ── Main Cascading Terminal Card ──────────────────────────────── */}
      <main className="relative z-10 w-full max-w-[420px] mx-auto my-auto py-8">
        {/* Layer 1: Cascading Background Glow Plate */}
        <div className="absolute -inset-1.5 rounded-[32px] bg-gradient-to-r from-sky-500/20 via-indigo-500/10 to-[#F26F21]/25 blur-xl opacity-75 group-hover:opacity-100 transition duration-1000 -z-10" />

        {/* Layer 2: Cascading Geometric Accent Plate */}
        <div className="absolute inset-0 rounded-[28px] border border-sky-400/20 rotate-1 scale-[1.02] bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none -z-10" />

        {/* Layer 3: Main Holographic Glass Card */}
        <div className="relative rounded-[26px] bg-[#0A0F1D]/85 border border-white/10 backdrop-blur-2xl p-7 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.7)] space-y-6">
          {/* Futuristic HUD Corner Notches */}
          <div className="absolute top-3 left-3 w-2 h-2 border-t-2 border-l-2 border-sky-400/70 pointer-events-none" />
          <div className="absolute top-3 right-3 w-2 h-2 border-t-2 border-r-2 border-sky-400/70 pointer-events-none" />
          <div className="absolute bottom-3 left-3 w-2 h-2 border-b-2 border-l-2 border-[#F26F21]/70 pointer-events-none" />
          <div className="absolute bottom-3 right-3 w-2 h-2 border-b-2 border-r-2 border-[#F26F21]/70 pointer-events-none" />

          {/* Logo & Portal Identity */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="relative">
              <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-sky-500/40 via-cyan-400/30 to-[#F26F21]/50 blur-md opacity-80 animate-pulse" />
              <div className="relative w-16 h-16 rounded-2xl bg-[#0F172A] border border-white/20 shadow-2xl flex items-center justify-center p-2.5 overflow-hidden">
                <Image
                  src="/Round Logo.png"
                  alt="T-Cloud Eats"
                  width={48}
                  height={48}
                  className="object-contain drop-shadow-[0_0_12px_rgba(242,111,33,0.4)]"
                  priority
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white uppercase">
                  T-Cloud Eats
                </h1>
                <span className="px-1.5 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/30 text-[9px] font-mono font-bold text-sky-400">
                  POS v2.6
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400 mt-0.5 tracking-wide">
                Cloud Kitchen ERP &amp; Neural POS Solution
              </p>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            {/* Email Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <label className="font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                  <span className="text-sky-400">//</span> Terminal User ID
                </label>
                <span className="text-[10px] font-mono text-slate-500">EMAIL</span>
              </div>
              <div className="relative flex items-center h-12 rounded-xl bg-[#070B16] border border-slate-800 focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-400/20 transition-all">
                <Mail className="absolute left-3.5 text-sky-400/80" size={16} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@t-cloudeats.com"
                  className="w-full h-full bg-transparent pl-11 pr-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 font-mono"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <label className="font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                  <span className="text-[#F26F21]">//</span> Access Key
                </label>
                <span className="text-[10px] font-mono text-slate-500">PASSWORD</span>
              </div>
              <div className="relative flex items-center h-12 rounded-xl bg-[#070B16] border border-slate-800 focus-within:border-[#F26F21] focus-within:ring-2 focus-within:ring-[#F26F21]/20 transition-all">
                <Lock className="absolute left-3.5 text-[#F26F21]/80" size={16} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-full bg-transparent pl-11 pr-11 text-sm text-slate-100 outline-none placeholder:text-slate-600 font-mono tracking-wider"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center font-mono animate-in fade-in zoom-in-95">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="relative group w-full h-12 rounded-xl bg-gradient-to-r from-sky-500 via-sky-600 to-[#F26F21] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 overflow-hidden cursor-pointer shadow-[0_0_25px_rgba(14,165,233,0.35)] hover:shadow-[0_0_35px_rgba(242,111,33,0.5)] transition-all duration-300 disabled:opacity-50 active:scale-[0.98]"
            >
              {/* Shimmer laser reflection */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={16} className="text-white" />
                  <span>Authenticate Terminal</span>
                  <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Autofill Pill */}
          <div className="pt-2 border-t border-white/5 flex items-center justify-center">
            <button
              type="button"
              onClick={handleAutofill}
              className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-sky-400/30 text-[10px] font-mono text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
              title="Click to automatically populate cashier credentials"
            >
              {autofillSuccess ? (
                <>
                  <CheckCircle2 size={12} className="text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Credentials Loaded!</span>
                </>
              ) : (
                <>
                  <KeyRound size={12} className="text-sky-400 group-hover:scale-110 transition-transform" />
                  <span>Auto-fill Cashier Access</span>
                </>
              )}
            </button>
          </div>
        </div>
      </main>

      {/* ── Futuristic Telemetry Bar (Bottom) ─────────────────────────── */}
      <footer className="relative z-10 max-w-6xl w-full mx-auto space-y-3">
        {/* Telemetry Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-[10px] font-mono text-slate-500">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.02] border border-white/5">
            <Zap size={11} className="text-sky-400" />
            <span>LATENCY: &lt; 8ms</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.02] border border-white/5">
            <ShieldCheck size={11} className="text-emerald-400" />
            <span>ENCRYPTION: 256-BIT SSL</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.02] border border-white/5">
            <Activity size={11} className="text-[#F26F21]" />
            <span>UPTIME: 99.98%</span>
          </div>
        </div>

        {/* Copyright */}
        <p className="text-center text-[11px] font-mono text-slate-500">
          T-Cloud Eats (Pvt) Ltd • Sri Lanka • Next-Gen Cloud Kitchen Operating System
        </p>
      </footer>
    </div>
  );
}
