"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Lock, Mail, ArrowRight, Loader2, Maximize, Minimize, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("cashier@t-cloudeats.com");
  const [password, setPassword] = useState("cashier123");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error("Error attempting to enable fullscreen:", err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Go fullscreen automatically on the first user click/interaction anywhere on the login page
  useEffect(() => {
    const autoFullscreen = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => {
          setIsFullscreen(true);
        }).catch(() => {});
      }
      window.removeEventListener("click", autoFullscreen);
    };
    window.addEventListener("click", autoFullscreen);
    return () => {
      window.removeEventListener("click", autoFullscreen);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    setTimeout(() => {
      if (email === "cashier@t-cloudeats.com" && password === "cashier123") {
        router.push("/cashier");
      } else {
        setError("Invalid email or password. Use demo credentials.");
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#0D1B35] text-[#F8F9FA] font-sans antialiased flex flex-col justify-between p-6 relative overflow-hidden">
      
      {/* Immersive Background Mesh Gradients */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#FF6B35]/5 blur-[120px]" />
      </div>

      {/* Top Bar / Brand */}
      <header className="w-full max-w-md mx-auto flex items-center justify-between z-10 px-4 py-2">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full border-2 border-orange-500/30 bg-[#111625]/60 flex items-center justify-center p-2 overflow-hidden shadow-lg shadow-orange-500/10">
            <Image 
              src="/Round Logo.png" 
              alt="T-Cloud Eats Logo" 
              width={56} 
              height={56} 
              className="w-auto h-auto max-w-full max-h-full object-contain"
              priority
            />
          </div>
          <span className="font-extrabold text-xl tracking-wider text-[#FF6B35]">
            t-cloud eats
          </span>
        </div>
        <button
          onClick={toggleFullscreen}
          type="button"
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-orange-500/20 bg-[#111625]/60 hover:bg-[#111625]/90 text-slate-300 hover:text-[#FF6B35] transition-all cursor-pointer text-xs font-bold shadow-md shadow-orange-500/5 active:scale-95 h-10"
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? (
            <>
              <Minimize size={14} />
              <span>Exit Fullscreen</span>
            </>
          ) : (
            <>
              <Maximize size={14} />
              <span>Fullscreen</span>
            </>
          )}
        </button>
      </header>

      {/* Center Glass Card */}
      <main className="w-full flex-1 flex items-center justify-center z-10 py-12">
        <div className="w-full max-w-md bg-[#111625]/70 border border-[#222E4E]/50 rounded-[32px] p-8 md:p-10 shadow-2xl backdrop-blur-xl flex flex-col gap-6" style={{ boxShadow: "0 20px 50px rgba(0,0,0,0.4)" }}>
          
          {/* Form Header */}
          <div className="flex flex-col gap-1.5 text-center">
            <h1 className="text-2xl font-black tracking-tight text-slate-100">Welcome Back</h1>
            <p className="text-xs text-slate-500">Sign in to access t-cloud eats</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            
            {/* Email Input */}
            <div className="flex flex-col gap-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
              <div className="relative rounded-2xl bg-[#090D1A] border border-[#222E4E] focus-within:border-[#FF6B35]/60 transition-colors flex items-center h-12">
                <Mail className="absolute left-4 text-slate-500" size={16} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full h-full bg-transparent pr-4 text-xs text-white outline-none placeholder:text-slate-600"
                  style={{ paddingLeft: "46px" }}
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Password</label>
              </div>
              <div className="relative rounded-2xl bg-[#090D1A] border border-[#222E4E] focus-within:border-[#FF6B35]/60 transition-colors flex items-center h-12">
                <Lock className="absolute left-4 text-slate-500" size={16} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-full bg-transparent pr-12 text-xs text-white outline-none placeholder:text-slate-600"
                  style={{ paddingLeft: "46px" }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer flex items-center justify-center p-1"
                  title={showPassword ? "Hide Password" : "Show Password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-xs font-bold text-center bg-red-950/20 border border-red-500/10 py-3 rounded-xl">
                {error}
              </p>
            )}

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-500/15 hover:shadow-orange-600/25 transition-all duration-150 flex items-center justify-center gap-2 text-xs uppercase tracking-widest cursor-pointer disabled:opacity-50 h-12"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Removed Demo Credentials Hint */}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full z-10" style={{ background: "transparent", border: "none", padding: "12px 0", textAlign: "center" }}>
        <p className="text-xs text-slate-400 font-medium tracking-wide" style={{ display: "inline-block", margin: "0 auto", textAlign: "center" }}>
          &copy; {new Date().getFullYear()} t-cloud eats. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
