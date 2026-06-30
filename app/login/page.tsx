"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Lock, Mail, ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("cashier@t-cloudeats.com");
  const [password, setPassword] = useState("cashier123");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    setTimeout(() => {
      if (email === "cashier@t-cloudeats.com" && password === "cashier123") {
        router.push("/pos");
      } else {
        setError("Invalid email or password. Use demo credentials.");
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#050814] text-[#F8F9FA] font-sans antialiased flex flex-col justify-between p-6 relative overflow-hidden">
      
      {/* Immersive Background Mesh Gradients */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#FF6B35]/5 blur-[120px]" />
      </div>

      {/* Top Bar / Brand */}
      <header className="w-full max-w-7xl mx-auto flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shadow-lg shadow-orange-500/10">
            <Image 
              src="/Classic Logo.png" 
              alt="T-Cloud Eats Logo" 
              width={36} 
              height={36} 
              className="object-cover"
            />
          </div>
          <span className="font-extrabold text-sm tracking-wider uppercase">
            T-Cloud <span className="text-[#FF6B35]">Eats</span>
          </span>
        </div>
        <span className="text-[10px] text-slate-500 tracking-widest font-mono">SECURE LOGIN</span>
      </header>

      {/* Center Glass Card */}
      <main className="w-full flex-1 flex items-center justify-center z-10 py-12">
        <div className="w-full max-w-md bg-[#111625]/40 border border-[#222E4E]/50 rounded-[32px] p-8 md:p-10 shadow-2xl backdrop-blur-xl space-y-8">
          
          {/* Form Header */}
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-black tracking-tight text-slate-100">Welcome Back</h1>
            <p className="text-xs text-slate-500">Sign in to access the T-Cloud Eats POS system</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Email Input */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
              <div className="relative rounded-2xl bg-[#090D1A] border border-[#222E4E] focus-within:border-[#FF6B35]/60 transition-colors flex items-center">
                <Mail className="absolute left-4 text-slate-500" size={16} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-transparent pl-12 pr-4 py-3.5 text-xs text-white outline-none placeholder:text-slate-600"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Password</label>
                <span className="text-[9px] text-[#FF6B35] font-bold cursor-pointer hover:underline">Forgot?</span>
              </div>
              <div className="relative rounded-2xl bg-[#090D1A] border border-[#222E4E] focus-within:border-[#FF6B35]/60 transition-colors flex items-center">
                <Lock className="absolute left-4 text-slate-500" size={16} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent pl-12 pr-4 py-3.5 text-xs text-white outline-none placeholder:text-slate-600"
                  required
                />
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
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-500/15 hover:shadow-orange-600/25 transition-all duration-150 flex items-center justify-center gap-2 text-xs uppercase tracking-widest cursor-pointer disabled:opacity-50"
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

          {/* Demo Credentials Hint */}
          <div className="bg-[#090D1A]/60 border border-[#222E4E]/40 rounded-2xl p-4 text-center space-y-1">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Demo Credentials</p>
            <p className="text-[10px] text-slate-400 font-mono">Email: cashier@t-cloudeats.com</p>
            <p className="text-[10px] text-slate-400 font-mono">Password: cashier123</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto text-center z-10">
        <p className="text-[10px] text-slate-600">
          &copy; {new Date().getFullYear()} T-Cloud Eats POS. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
