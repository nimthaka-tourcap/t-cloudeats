"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
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
    // If already logged in, redirect straight to cashier
    const user = localStorage.getItem("t-cloud-eats-user");
    if (user === "cashier@t-cloudeats.com") {
      document.cookie = `tce_auth=${encodeURIComponent(user)}; path=/; max-age=604800; SameSite=Lax`;
      router.replace("/cashier");
    }

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [router]);

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
        // Set secure auth cookie for server-side proxy guard (7 days)
        document.cookie = `tce_auth=${encodeURIComponent(email)}; path=/; max-age=604800; SameSite=Lax`;
        router.replace("/cashier");
      } else {
        setError("Invalid email or password.");
        setIsLoading(false);
      }
    }, 400);
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white font-sans antialiased text-slate-900 select-none">
      {/* ── Left Hero Pane (Matching Reference) ──────────────────────── */}
      <aside className="w-full lg:w-[42%] bg-[#EEF2F6] flex flex-col justify-between p-8 sm:p-12 lg:p-16 shrink-0 relative overflow-hidden">
        {/* Subtle decorative background gradient */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-gradient-to-bl from-sky-100/60 to-transparent blur-3xl pointer-events-none" />

        {/* Top: Bare Logo without any container box */}
        <div className="relative z-10 flex items-center gap-3.5">
          <Image
            src="/Round Logo.png"
            alt="t-cloud eats"
            width={52}
            height={52}
            className="w-12 h-12 sm:w-[52px] sm:h-[52px] object-contain"
            priority
          />
          <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 font-[family-name:var(--font-heading)] lowercase">
            t-cloud eats
          </span>
        </div>

        {/* Bottom: Hero Typographic Tagline */}
        <div className="relative z-10 py-10 lg:py-0">
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-bold tracking-tight text-slate-900 leading-[1.12]">
            Run your <br />
            cloud kitchen. <br />
            <span className="text-sky-600">Better.</span> <br />
            <span className="text-[#F26F21]">Together.</span>
          </h2>
        </div>

        {/* Left Footer: A product by Stack37 */}
        <div className="relative z-10 text-xs text-slate-500 font-medium">
          A product by{" "}
          <a
            href="https://stack37.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-800 hover:text-black font-semibold underline underline-offset-2 transition-colors cursor-pointer"
          >
            Stack37
          </a>
        </div>
      </aside>

      {/* ── Right Form Pane (Matching Reference) ─────────────────────── */}
      <main className="flex-1 bg-white flex flex-col justify-between p-8 sm:p-12 lg:p-16">
        {/* Top Header: Fullscreen */}
        <div className="flex justify-end">
          <button
            onClick={toggleFullscreen}
            type="button"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
        </div>

        {/* Center Form Section (No rectangle card box) */}
        <div className="w-full max-w-[380px] mx-auto my-auto py-8 space-y-6">
          <div>
            <span className="text-[10px] font-mono tracking-widest uppercase text-slate-400 font-bold block mb-2">
              Cloud Kitchen POS &amp; ERP
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Sign in
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Access your workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">
                Work email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full h-11 px-3.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition"
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-medium text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setEmail("cashier@t-cloudeats.com");
                    setPassword("cashier@ti321");
                    setError("");
                  }}
                  className="text-sky-600 hover:text-sky-700 text-xs font-medium cursor-pointer"
                >
                  Fill credentials
                </button>
              </div>
              <div className="relative flex items-center h-11 border border-slate-300 rounded-lg focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900 transition bg-white">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-full px-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-rose-600 text-xs bg-rose-50 border border-rose-200 py-2.5 px-3 rounded-lg text-center font-medium">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-lg bg-[#111827] hover:bg-[#1f2937] text-white font-semibold text-xs tracking-wide transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-2 shadow-xs active:scale-[0.99]"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <span>Sign in</span>
              )}
            </button>
          </form>
        </div>

        {/* Empty bottom space to maintain vertical balance */}
        <div className="hidden lg:block h-6" />
      </main>
    </div>
  );
}
