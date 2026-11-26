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
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
        setError("Invalid email or password.");
        setIsLoading(false);
      }
    }, 400);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#090A0F] text-slate-100 font-sans antialiased flex flex-col justify-between p-6 overflow-hidden">
      {/* ── Soft Cascading Diffuse Glow ───────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Subtle top-center cascading gradient */}
        <div className="absolute top-[-25%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-gradient-to-b from-sky-500/10 via-[#F26F21]/5 to-transparent blur-[120px]" />
        {/* Delicate subtle mesh background */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      {/* ── Top Bar: Discreet Fullscreen ─────────────────────────────── */}
      <header className="relative z-10 flex justify-end max-w-5xl w-full mx-auto">
        <button
          onClick={toggleFullscreen}
          type="button"
          className="p-2 rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04] transition-colors cursor-pointer"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
        </button>
      </header>

      {/* ── Main Minimalist Login Card ───────────────────────────────── */}
      <main className="relative z-10 w-full max-w-[360px] mx-auto my-auto">
        {/* Subtle cascading ambient card outline glow */}
        <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-b from-white/10 via-white/[0.02] to-transparent blur-sm pointer-events-none -z-10" />

        <div className="rounded-2xl bg-[#111218]/90 border border-white/[0.08] backdrop-blur-xl p-7 sm:p-8 shadow-2xl space-y-6">
          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center p-2 shadow-inner">
              <Image
                src="/Round Logo.png"
                alt="T-Cloud Eats"
                width={36}
                height={36}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-white">
                T-Cloud Eats
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                Cloud Kitchen &amp; POS Solution
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                Email
              </label>
              <div className="relative flex items-center h-11 rounded-xl bg-white/[0.03] border border-white/[0.08] focus-within:border-white/25 focus-within:bg-white/[0.05] transition-all">
                <Mail className="absolute left-3.5 text-zinc-500" size={15} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@t-cloudeats.com"
                  className="w-full h-full bg-transparent pl-10 pr-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                Password
              </label>
              <div className="relative flex items-center h-11 rounded-xl bg-white/[0.03] border border-white/[0.08] focus-within:border-white/25 focus-within:bg-white/[0.05] transition-all">
                <Lock className="absolute left-3.5 text-zinc-500" size={15} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-full bg-transparent pl-10 pr-10 text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-rose-400 text-xs text-center bg-rose-500/10 border border-rose-500/20 py-2.5 rounded-xl">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs tracking-wide uppercase flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.99] shadow-sm mt-2"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={15} />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* ── Discreet Minimal Footer ───────────────────────────────────── */}
      <footer className="relative z-10 text-center text-[11px] text-zinc-600">
        T-Cloud Eats • Sri Lanka
      </footer>
    </div>
  );
}
