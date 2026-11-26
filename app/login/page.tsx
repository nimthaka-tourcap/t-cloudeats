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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased flex flex-col justify-between p-6">
      <div className="flex justify-end">
        <button
          onClick={toggleFullscreen}
          type="button"
          className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
        </button>
      </div>

      <main className="w-full max-w-[390px] mx-auto space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center p-1.5">
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
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              T-Cloud Eats
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Cloud Kitchen ERP &amp; POS Solution
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4"
        >
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700">
              Email
            </label>
            <div className="relative flex items-center h-11 rounded-xl bg-slate-50 border border-slate-200 focus-within:border-sky-500 focus-within:bg-white transition">
              <Mail className="absolute left-3.5 text-slate-400" size={15} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@t-cloudeats.com"
                className="w-full h-full bg-transparent pl-10 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700">
              Password
            </label>
            <div className="relative flex items-center h-11 rounded-xl bg-slate-50 border border-slate-200 focus-within:border-sky-500 focus-within:bg-white transition">
              <Lock className="absolute left-3.5 text-slate-400" size={15} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-full bg-transparent pl-10 pr-10 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showPassword ? "Hide Password" : "Show Password"}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-rose-600 text-xs text-center bg-rose-50 border border-rose-200 py-2.5 rounded-xl">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>
      </main>

      <footer className="text-center text-xs text-slate-400">
        T-Cloud Eats (Pvt) Ltd • Sri Lanka
      </footer>
    </div>
  );
}
