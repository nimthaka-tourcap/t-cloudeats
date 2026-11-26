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
    }, 450);
  };

  return (
    <div className="min-h-screen bg-[#0A0B0F] text-zinc-100 font-sans antialiased flex flex-col justify-between p-6">
      {/* Subtle Top Corner Fullscreen Control */}
      <div className="flex justify-end">
        <button
          onClick={toggleFullscreen}
          type="button"
          className="p-2 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04] transition cursor-pointer"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
        </button>
      </div>

      {/* Centered Minimal Sign-In Surface */}
      <main className="w-full max-w-[380px] mx-auto space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-11 h-11 rounded-xl bg-[#111318] border border-white/[0.08] flex items-center justify-center p-1.5">
            <Image
              src="/Round Logo.png"
              alt="T-Cloud Eats"
              width={32}
              height={32}
              className="object-contain"
              priority
            />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white">
              t-cloud eats ERP
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Sign in to continue to your workspace
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#111318] border border-white/[0.08] rounded-2xl p-6 space-y-4"
        >
          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium text-zinc-400">
              Email
            </label>
            <div className="relative flex items-center h-10 rounded-lg bg-[#0A0B0F] border border-white/[0.08] focus-within:border-[#F26F21]/70 transition">
              <Mail className="absolute left-3 text-zinc-500" size={14} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@t-cloudeats.com"
                className="w-full h-full bg-transparent pl-9 pr-3 text-xs text-white outline-none placeholder:text-zinc-600"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium text-zinc-400">
              Password
            </label>
            <div className="relative flex items-center h-10 rounded-lg bg-[#0A0B0F] border border-white/[0.08] focus-within:border-[#F26F21]/70 transition">
              <Lock className="absolute left-3 text-zinc-500" size={14} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-full bg-transparent pl-9 pr-9 text-xs text-white outline-none placeholder:text-zinc-600"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                title={showPassword ? "Hide Password" : "Show Password"}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-rose-400 text-xs text-center bg-rose-500/10 border border-rose-500/20 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-10 rounded-lg bg-[#F26F21] hover:bg-[#e06117] text-white font-medium text-xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
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
      </main>

      <footer className="text-center text-[11px] text-zinc-600">
        T-Cloud Eats (Pvt) Ltd • Sri Lanka
      </footer>
    </div>
  );
}
