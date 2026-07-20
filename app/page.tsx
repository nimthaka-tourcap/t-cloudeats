"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";

/* ── Intersection observer for reveal animations ──────────────── */
function useReveal(deps: any[] = []) {
  useEffect(() => {
    // Small delay so React has flushed the new DOM nodes
    const timer = setTimeout(() => {
      const els = document.querySelectorAll("[data-reveal]");
      const io = new IntersectionObserver(
        (entries) =>
          entries.forEach((e) => {
            if (e.isIntersecting) e.target.classList.add("revealed");
          }),
        { threshold: 0.08 }
      );
      els.forEach((el) => io.observe(el));
      // Clean-up is handled by the effect return below
      return () => io.disconnect();
    }, 80);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/* ── Icons ─────────────────────────────────────────────────────── */
const Icon = {
  bag: (cls = "w-5 h-5") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" />
    </svg>
  ),
  wa: (cls = "w-5 h-5") => (
    <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.38 5.07L2 22l5.07-1.38A9.959 9.959 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.69 0-3.27-.5-4.6-1.36l-.33-.2-3.01.82.82-3.01-.2-.33C3.5 15.27 3 13.69 3 12c0-4.97 4.03-9 9-9s9 4.03 9 9-4.03 9-9 9z" />
    </svg>
  ),
  star: (cls = "w-4 h-4") => (
    <svg className={cls} viewBox="0 0 20 20" fill="currentColor">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  ),
  phone: (cls = "w-4 h-4") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 014.69 13.5a19.79 19.79 0 01-3.07-8.67A2 2 0 013.6 2.69h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L7.91 10a16 16 0 006.09 6.09l.92-.92a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
    </svg>
  ),
  map: (cls = "w-4 h-4") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  ),
  clock: (cls = "w-4 h-4") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  fire: (cls = "w-4 h-4") => (
    <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.5 0.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z" />
    </svg>
  ),
  shield: (cls = "w-4 h-4") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" />
    </svg>
  ),
  chev: (cls = "w-4 h-4") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  arrow: (cls = "w-4 h-4") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  plus: (cls = "w-4 h-4") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  ig: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  ),
  fb: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
  tt: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.67a8.18 8.18 0 004.77 1.52V6.74a4.85 4.85 0 01-1-.05z" />
    </svg>
  ),
};

/* ── Static fallback menu data ─────────────────────────────────── */
const FEATURED = [
  { id: 1, title: "Seafood Fried Rice", price: "Rs 1,500", label: "🔥 Hot Pick", category: "Fried Rice", image: "/Product Images/FR-05.avif" },
  { id: 2, title: "Nasi Goreng", price: "Rs 1,400", label: "⭐ Top Rated", category: "Fried Rice", image: "/Product Images/FR-07.avif" },
  { id: 3, title: "Chicken Kottu", price: "Rs 1,100", label: "💚 Best Value", category: "Kottu", image: "/Product Images/KT-02.avif" },
  { id: 4, title: "Prawn Chopsuey", price: "Rs 1,400", label: "🍤 Chef's Pick", category: "Chopsuey", image: "/Product Images/CS-02.avif" },
];

const REVIEWS = [
  { i: "T", name: "Thanuja Welagedara", text: "Highly recommended — excellent food quality, taste, and service!", href: "https://share.google/XfX96zQZ36QWsqjlI" },
  { i: "M", name: "madusanka bandara", text: "Absolutely delicious street-style food and extremely fast service!", href: "https://share.google/y80WdEtoMV9bRdeFT" },
  { i: "E", name: "Eranga Perera", text: "Best Kottu and Fried Rice in town! Large portions and amazing flavor.", href: "https://share.google/eJhWP2tMIsHOp0iTs" },
  { i: "N", name: "Nipuni Fernando", text: "Super fast delivery and food arrived piping hot! Chopsuey is top tier.", href: "https://share.google/Wmb7eUaSzIlG8Y2Ml" },
  { i: "K", name: "Kavindu Silva", text: "Great value! Fresh ingredients and authentic cloud kitchen vibe.", href: "https://share.google/KvwuzXIvknEDxGasV" },
  { i: "P", name: "Pathum Jayasinghe", text: "Generous portions and incredible taste — will definitely order again!", href: "https://share.google/nk2NN7nxO0rI2dhy2" },
];

const FAQS = [
  { q: "How fast is delivery?", a: "Orders are prepped fresh in 15–20 min and delivered hot within 25–35 minutes." },
  { q: "Which areas do you deliver to?", a: "We cover Mulleriyawa, Angoda, Kotikawatta, Kelanimulla, IDH & surrounding suburbs within 3 km." },
  { q: "How do I place an order?", a: 'Use our Digital Menu to build a cart and checkout, or tap "WhatsApp Order" for 1-click ordering.' },
  { q: "What payment methods are accepted?", a: "Cash on Delivery (COD) and online bank transfers with receipt upload." },
];

const CATS = ["All", "Fried Rice", "Kottu", "Chopsuey", "Beverages"];

/* ── Component ─────────────────────────────────────────────────── */
export default function Home() {
  const [items, setItems] = useState<any[]>([]);
  const [cat, setCat] = useState("All");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  useReveal([items]);

  useEffect(() => {
    fetch("/api/menu")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setItems(d))
      .catch(() => {});
  }, []);

  const pool = items.length >= 4 ? items : FEATURED;
  const visible = (cat === "All" ? pool : pool.filter((i) => i.category === cat)).slice(0, 4);

  return (
    <>
      {/* ─────────── GLOBAL STYLES ─────────────────────────────────── */}
      <style>{`
        :root { --orange:#F26F21; --orange-light:#FF8C3F; --dark:#0D0D0D; --card-bg:#FFFFFF; --body-bg:#F7F5F2; }
        body { background: var(--body-bg); color: var(--dark); font-family: 'Inter', -apple-system, sans-serif; }
        [data-reveal] { opacity:0; transform:translateY(24px); transition: opacity .55s ease, transform .55s ease; }
        [data-reveal].revealed { opacity:1; transform:translateY(0); }
        [data-reveal-delay="1"].revealed { transition-delay:.12s; }
        [data-reveal-delay="2"].revealed { transition-delay:.24s; }
        [data-reveal-delay="3"].revealed { transition-delay:.36s; }
        [data-reveal-delay="4"].revealed { transition-delay:.48s; }
        @keyframes heroFloat { 0%,100%{ transform:translateY(0) rotate(-2deg);} 50%{transform:translateY(-14px) rotate(1deg);} }
        @keyframes badge-pop { 0%{transform:scale(0.8) translateY(10px);opacity:0} 100%{transform:scale(1) translateY(0);opacity:1} }
        @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        .hero-float { animation: heroFloat 5s ease-in-out infinite; }
        .badge-pop { animation: badge-pop 0.6s cubic-bezier(.17,.67,.29,1.2) forwards; }
        .ticker-track { display:flex; animation:ticker 28s linear infinite; width:max-content; }
        .ticker-track:hover { animation-play-state:paused; }
        .product-card { background:#fff; border-radius:20px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.07); transition:transform .25s ease,box-shadow .25s ease; }
        .product-card:hover { transform:translateY(-6px); box-shadow:0 16px 40px rgba(242,111,33,0.15); }
        .faq-item { background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.06); }
        .review-card { background:#fff; border-radius:20px; padding:20px; box-shadow:0 4px 24px rgba(0,0,0,0.06); transition:transform .25s ease; }
        .review-card:hover { transform:translateY(-4px); }
        .cat-pill { padding:8px 18px; border-radius:100px; font-size:12px; font-weight:800; transition:all .2s ease; border:2px solid transparent; cursor:pointer; white-space:nowrap; }
        .cat-pill.active { background:var(--orange); color:#fff; box-shadow:0 6px 18px rgba(242,111,33,0.35); }
        .cat-pill:not(.active) { background:#fff; color:#555; border-color:#e5e5e5; }
        .cat-pill:not(.active):hover { border-color:var(--orange); color:var(--orange); }
        .hero-diagonal { position:absolute; inset:0; background:var(--orange); clip-path:polygon(0 0,100% 0,100% 72%,0 100%); z-index:0; }
        .scrollbar-none { -ms-overflow-style:none; scrollbar-width:none; }
        .scrollbar-none::-webkit-scrollbar { display:none; }
        .shimmer { background: linear-gradient(110deg,#f3f3f3 30%,#ecebeb 50%,#f3f3f3 70%); background-size:200% 100%; animation:shimmer 1.4s linear infinite; }
        @keyframes shimmer{to{background-position:-200% 0}}
        @keyframes cardFadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .tag-chip { display:inline-flex; align-items:center; gap:4px; font-size:10px; font-weight:800; padding:3px 10px; border-radius:100px; letter-spacing:0.04em; }
      `}</style>

      {/* ─────────── STICKY NAV ────────────────────────────────────── */}
      <header style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(18px)", borderBottom: "1px solid #eee" }}
        className="sticky top-0 z-50 px-5 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <Image src="/Round Logo.png" alt="t-cloud eats" width={38} height={38} priority className="object-contain" />
            <div>
              <p className="text-sm font-black tracking-wider leading-tight" style={{ color: "#F26F21" }}>t-cloud eats</p>
              <p className="text-[9px] font-bold text-gray-400 tracking-widest uppercase leading-none">Cloud Kitchen · Sri Lanka</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-gray-500 uppercase tracking-wider">
            <a href="#menu" className="hover:text-[#F26F21] transition-colors">Menu</a>
            <a href="#why" className="hover:text-[#F26F21] transition-colors">About</a>
            <a href="#reviews" className="hover:text-[#F26F21] transition-colors">Reviews</a>
            <a href="#faq" className="hover:text-[#F26F21] transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-2">
            <a href="tel:+94706288109" className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-[#F26F21] transition-colors">
              {Icon.phone()} 070 628 8109
            </a>
            <Link href="/order"
              className="flex items-center gap-1.5 text-white text-xs font-black px-4 py-2.5 rounded-full transition-all active:scale-95"
              style={{ background: "#F26F21", boxShadow: "0 6px 20px rgba(242,111,33,0.35)" }}>
              {Icon.bag("w-4 h-4")} <span>Order Now</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ─────────── HERO SECTION ─────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ minHeight: "92svh", background: "#F26F21" }}>
        {/* Background wave shape */}
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-[#F7F5F2] z-0" style={{ borderRadius: "50% 50% 0 0 / 10% 10% 0 0" }} />

        {/* Noise overlay */}
        <div className="absolute inset-0 z-0 opacity-[0.04]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")" }} />

        <div className="relative z-10 max-w-6xl mx-auto px-5 pt-12 pb-28 lg:pb-16 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center min-h-[88svh]">
          {/* Left text */}
          <div className="text-white space-y-5">
            {/* Live badge */}
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3.5 py-1.5 rounded-full badge-pop">
              <span className="w-2 h-2 bg-white rounded-full animate-ping" />
              <span className="text-[10px] font-black uppercase tracking-widest">Kitchen Open · Express Delivery</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.06] tracking-tight drop-shadow-sm">
              Your Favourite<br />
              <span className="text-white/90">Sri Lankan</span><br />
              Street Food 🍜
            </h1>

            <p className="text-white/80 text-sm sm:text-base leading-relaxed max-w-md">
              Flame-wok Kottu, Basmati Fried Rice & Chopsuey cooked fresh on demand. Hot doorstep delivery within 3 km of Mulleriyawa.
            </p>

            {/* Rating row */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(s => <span key={s} className="text-yellow-300 text-base">★</span>)}
              </div>
              <span className="text-white font-black text-sm">5.0</span>
              <span className="text-white/60 text-xs font-semibold">Google Reviews · 50K+ Meals</span>
            </div>

            {/* CTAs */}
            <div className="flex gap-3 flex-wrap pt-1">
              <Link href="/order"
                className="flex items-center gap-2 bg-white font-black text-sm px-6 py-3.5 rounded-2xl transition-all active:scale-95 shadow-xl"
                style={{ color: "#F26F21", boxShadow: "0 10px 30px rgba(0,0,0,0.18)" }}>
                {Icon.bag("w-4 h-4")} Browse Menu
              </Link>
              <a href="https://wa.me/94706288109" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur border border-white/30 text-white font-black text-sm px-6 py-3.5 rounded-2xl transition-all active:scale-95">
                {Icon.wa("w-4 h-4")} WhatsApp Order
              </a>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3 pt-2 max-w-sm">
              {[
                ["~20 min", "Prep Time"],
                ["3 km", "Delivery Range"],
                ["100%", "Hygienic"],
              ].map(([v, l]) => (
                <div key={l} className="bg-white/15 backdrop-blur rounded-xl p-2.5 text-center border border-white/20">
                  <p className="font-black text-sm text-white">{v}</p>
                  <p className="text-[10px] text-white/70 font-bold uppercase tracking-wider leading-tight">{l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right floating food image */}
          <div className="relative flex items-center justify-center">
            {/* Glow disc */}
            <div className="absolute w-72 h-72 sm:w-80 sm:h-80 bg-white/20 rounded-full blur-3xl" />

            {/* Food card */}
            <div className="relative z-10 hero-float">
              <div className="w-64 sm:w-80 bg-white rounded-[28px] p-4 shadow-2xl" style={{ boxShadow: "0 30px 80px rgba(0,0,0,0.25)" }}>
                <div className="relative h-44 sm:h-52 rounded-2xl overflow-hidden bg-orange-50 mb-3">
                  <img src="/Product Images/FR-05.avif" alt="Seafood Fried Rice" className="w-full h-full object-cover" />
                  <span className="absolute top-3 left-3 tag-chip bg-[#F26F21] text-white">{Icon.fire("w-3 h-3")} #1 Best Seller</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-extrabold text-sm text-gray-900">Seafood Fried Rice</h3>
                    <p className="text-[11px] text-gray-400 font-medium">Prawns · Cuttlefish · Beef · Basmati</p>
                  </div>
                  <span className="font-black text-[#F26F21] text-base">Rs 1,500</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-gray-400 font-semibold mb-3">
                  <span className="flex items-center gap-1">{Icon.star("w-3 h-3")} <span className="text-yellow-500 font-bold">5.0</span></span>
                  <span className="flex items-center gap-1">{Icon.clock("w-3 h-3")} 20 min</span>
                  <span className="flex items-center gap-1">{Icon.map("w-3 h-3")} 3 km</span>
                </div>
                <Link href="/order"
                  className="w-full flex items-center justify-center gap-2 text-white text-xs font-black py-2.5 rounded-xl transition-all active:scale-95"
                  style={{ background: "#F26F21", boxShadow: "0 6px 18px rgba(242,111,33,0.4)" }}>
                  {Icon.bag("w-4 h-4")} Add to Cart
                </Link>
              </div>
            </div>

            {/* Floating mini badge */}
            <div className="absolute bottom-4 left-0 sm:-left-6 z-20 bg-white rounded-2xl px-3 py-2.5 flex items-center gap-2 shadow-xl badge-pop" style={{ animationDelay: ".3s" }}>
              <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                {Icon.shield("w-4 h-4")}
              </div>
              <div>
                <p className="text-xs font-black text-gray-900 leading-none">Verified Hygienic</p>
                <p className="text-[10px] text-gray-400 font-bold">Food Safety Certified</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────── TICKER ────────────────────────────────────────── */}
      <div className="overflow-hidden py-4 bg-[#0D0D0D] text-white">
        <div className="ticker-track gap-12 text-xs font-black uppercase tracking-widest">
          {[...Array(2)].map((_, i) =>
            ["🍜 Kottu", "🍚 Fried Rice", "🥘 Chopsuey", "🌶️ Spicy Options", "⚡ 20-Min Prep", "🚴 Express Delivery", "⭐ 5.0 Google Rating", "🥗 Fresh Daily"].map((t, j) => (
              <span key={`${i}-${j}`} className="text-[#F26F21] mx-10">{t}<span className="text-white/30 ml-10">·</span></span>
            ))
          )}
        </div>
      </div>

      {/* ─────────── PROMO BANNER ──────────────────────────────────── */}
      <section className="bg-[#F7F5F2] py-6 px-5">
        <div className="max-w-6xl mx-auto" data-reveal>
          <div className="rounded-3xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6 p-6 sm:p-8"
            style={{ background: "linear-gradient(135deg,#F26F21 0%,#FF8C3F 50%,#e05c0d 100%)" }}>
            {/* BG shapes */}
            <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/10" />
            <div className="absolute -right-8 -bottom-12 w-40 h-40 rounded-full bg-white/10" />

            <div className="relative z-10 text-white text-center sm:text-left">
              <p className="text-[11px] font-extrabold uppercase tracking-widest bg-white/20 inline-flex px-3 py-1 rounded-full mb-2">🎉 Limited Time Offer</p>
              <h2 className="text-2xl sm:text-4xl font-black leading-tight">Order via WhatsApp <br />Get Free Extras!</h2>
              <p className="text-white/80 text-sm mt-1">First 5 orders daily — complimentary sambol + chili sauce with every meal.</p>
            </div>

            <div className="relative z-10 flex flex-col items-center gap-3">
              <a href="https://wa.me/94706288109" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white font-black text-sm px-7 py-3.5 rounded-2xl transition-all active:scale-95 shadow-xl"
                style={{ color: "#F26F21" }}>
                {Icon.wa("w-4 h-4")} Claim via WhatsApp
              </a>
              <span className="text-white/70 text-[10px] font-bold uppercase tracking-wider">No minimum order required</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────── MENU SHOWCASE ─────────────────────────────────── */}
      <section id="menu" className="bg-[#F7F5F2] py-10 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div data-reveal>
              <p className="text-[11px] font-black uppercase tracking-widest text-[#F26F21] mb-1">Our Menu</p>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900">Popular Dishes</h2>
            </div>
            <Link href="/order" data-reveal data-reveal-delay="1"
              className="flex items-center gap-2 text-xs font-black text-[#F26F21] hover:underline uppercase tracking-wider">
              View All {Icon.arrow()}
            </Link>
          </div>

          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-3 mb-5" data-reveal data-reveal-delay="2">
            {CATS.map((c) => (
              <button key={c} onClick={() => setCat(c)} className={`cat-pill ${cat === c ? "active" : ""}`}>{c}</button>
            ))}
          </div>

          {/* Product grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {visible.map((item, idx) => {
              const price = typeof item.price === "string" ? item.price : `Rs ${Number(item.price).toLocaleString()}`;
              return (
                <div key={item.id} className="product-card" style={{ animationDelay: `${idx * 60}ms`, animation: "cardFadeIn .4s ease both" }}>
                  <div className="relative h-36 sm:h-44 bg-orange-50 overflow-hidden">
                    {item.image
                      ? <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      : <div className="shimmer w-full h-full" />
                    }
                    {item.label && (
                      <span className="absolute top-2.5 left-2.5 tag-chip bg-[#F26F21] text-white text-[9px]">{item.label}</span>
                    )}
                  </div>
                  <div className="p-3 sm:p-4">
                    <h3 className="font-extrabold text-sm text-gray-900 truncate mb-0.5">{item.title}</h3>
                    <div className="flex items-center gap-1 mb-2">
                      {[1,2,3,4,5].map(s => <span key={s} className="text-yellow-400 text-xs">★</span>)}
                      <span className="text-[10px] text-gray-400 font-bold ml-1">5.0</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-black text-[#F26F21] text-sm">{price}</span>
                      <Link href="/order"
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white transition-all active:scale-95 shadow-md"
                        style={{ background: "#F26F21" }}>
                        {Icon.plus("w-4 h-4")}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA */}
          <div className="text-center mt-10" data-reveal>
            <Link href="/order"
              className="inline-flex items-center gap-2.5 text-white font-black text-sm px-8 py-4 rounded-2xl transition-all active:scale-95"
              style={{ background: "#F26F21", boxShadow: "0 10px 30px rgba(242,111,33,0.35)" }}>
              {Icon.bag()} Explore Full Menu (20+ Items) {Icon.arrow()}
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────── WHY US ─────────────────────────────────────────── */}
      <section id="why" className="py-12 px-5 bg-[#0D0D0D]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8" data-reveal>
            <p className="text-[11px] font-black uppercase tracking-widest text-[#F26F21] mb-1">Why Choose Us</p>
            <h2 className="text-2xl sm:text-3xl font-black text-white">Crafted for Taste. <span className="text-[#F26F21]">Built for Speed.</span></h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Icon.shield("w-6 h-6"), emoji: "🛡️", title: "100% Hygienic", desc: "Stainless steel workstations, sealed tamper-proof packaging and daily sanitization.", color: "rgba(6,193,103,0.12)", textColor: "#06C167" },
              { icon: Icon.fire("w-6 h-6"), emoji: "🔥", title: "Master Wok Cooking", desc: "High-heat wok searing with authentic Sri Lankan spices for bold, smoky street-style taste.", color: "rgba(242,111,33,0.12)", textColor: "#F26F21" },
              { icon: Icon.clock("w-6 h-6"), emoji: "⚡", title: "Express 25-Min Delivery", desc: "Thermal-insulated delivery bags keep your meal piping hot, from kitchen to doorstep.", color: "rgba(99,102,241,0.12)", textColor: "#818CF8" },
              { icon: Icon.wa("w-6 h-6"), emoji: "💬", title: "WhatsApp Instant Orders", desc: "Real-time confirmations, item updates and digital receipts sent directly on WhatsApp.", color: "rgba(37,211,102,0.12)", textColor: "#25D366" },
            ].map(({ icon, emoji, title, desc, color, textColor }, idx) => (
              <div key={title} data-reveal data-reveal-delay={String(idx + 1) as any}
                className="rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-all"
                style={{ background: "rgba(255,255,255,0.04)" }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: color, color: textColor }}>
                  {icon}
                </div>
                <h3 className="font-extrabold text-sm text-white mb-1">{title}</h3>
                <p className="text-xs text-white/50 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── REVIEWS ─────────────────────────────────────────── */}
      <section id="reviews" className="py-12 px-5 bg-[#F7F5F2]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <div data-reveal>
              <p className="text-[11px] font-black uppercase tracking-widest text-[#F26F21] mb-1">What Customers Say</p>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900">5.0 ★ Verified Google Reviews</h2>
            </div>
            <a href="https://g.page/r/CcHhV6EC-0olEAI/review" target="_blank" rel="noopener noreferrer"
              data-reveal data-reveal-delay="1"
              className="text-xs font-extrabold text-[#F26F21] hover:underline flex items-center gap-1 uppercase tracking-wider">
              Write a Review {Icon.arrow()}
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {REVIEWS.map((r, idx) => (
              <div key={idx} className="review-card" data-reveal data-reveal-delay={String((idx % 3) + 1) as any}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-sm"
                      style={{ background: "#F26F21" }}>{r.i}</div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">{r.name}</p>
                      <p className="text-[10px] text-gray-400 font-semibold">Google Review · Verified</p>
                    </div>
                  </div>
                  <div className="flex text-yellow-400">{[1,2,3,4,5].map(s => <span key={s} className="text-sm">★</span>)}</div>
                </div>
                <p className="text-xs text-gray-600 italic leading-relaxed mb-3">"{r.text}"</p>
                <a href={r.href} target="_blank" rel="noopener noreferrer"
                  className="text-[10px] font-extrabold text-[#F26F21] hover:underline uppercase tracking-wider">
                  View on Google ↗
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── FAQ ─────────────────────────────────────────────── */}
      <section id="faq" className="py-12 px-5 bg-white">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8" data-reveal>
            <p className="text-[11px] font-black uppercase tracking-widest text-[#F26F21] mb-1">FAQ</p>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">Got Questions? We've Got Answers.</h2>
          </div>

          <div className="space-y-2.5">
            {FAQS.map((f, idx) => (
              <div key={idx} className="faq-item" data-reveal data-reveal-delay={String((idx % 3) + 1) as any}>
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full text-left flex items-center justify-between gap-4 p-4 sm:p-5"
                >
                  <span className="font-extrabold text-sm text-gray-900">{f.q}</span>
                  <span className={`flex-shrink-0 transition-transform duration-300 ${openFaq === idx ? "rotate-180" : ""}`}
                    style={{ color: "#F26F21" }}>
                    {Icon.chev("w-4 h-4")}
                  </span>
                </button>
                {openFaq === idx && (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-xs text-gray-500 leading-relaxed border-t border-gray-50 pt-3">
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── LOCATION & DELIVERY ──────────────────────────── */}
      <section className="py-12 px-5 bg-[#F7F5F2]">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-3xl overflow-hidden shadow-xl grid grid-cols-1 lg:grid-cols-12 bg-white">
            <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-center gap-4" data-reveal>
              <p className="text-[11px] font-black uppercase tracking-widest text-[#F26F21]">Find Us</p>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900">Express Delivery<br />Within 3 km</h2>
              <p className="text-xs text-gray-500 leading-relaxed">557/3/5 Godella Rd, Mulleriyawa 10620, Sri Lanka. Delivery available across:</p>

              <div className="flex flex-wrap gap-1.5">
                {["Mulleriyawa", "Angoda", "Kotikawatta", "Kelanimulla", "IDH Suburbs"].map((a) => (
                  <span key={a} className="text-[10px] font-bold text-[#F26F21] bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-100">
                    📍 {a}
                  </span>
                ))}
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <a href="tel:+94706288109" className="flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-[#F26F21] transition-colors">
                  {Icon.phone("w-4 h-4")} 070 628 8109
                </a>
                <a href="https://wa.me/94706288109" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm font-bold text-[#25D366] hover:underline">
                  {Icon.wa("w-4 h-4")} WhatsApp Order
                </a>
              </div>

              <a href="https://maps.app.goo.gl/K5SmeWHuuSF41U7VA" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-white text-xs font-black px-5 py-3 rounded-2xl w-max transition-all active:scale-95"
                style={{ background: "#F26F21", boxShadow: "0 6px 20px rgba(242,111,33,0.3)" }}>
                {Icon.map()} Get Directions
              </a>
            </div>

            <div className="lg:col-span-7 h-60 lg:h-auto min-h-[280px]" data-reveal data-reveal-delay="2">
              <iframe
                title="t-cloud eats location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d990.161254038916!2d79.92902197881799!3d6.932962699999993!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae257fcc5fb0da5%3A0x254afb02a157e1c1!2st-cloud%20eats!5e0!3m2!1sen!2sus!4v1782627430513!5m2!1sen!2sus"
                width="100%" height="100%" style={{ border: 0, display: "block", minHeight: 280 }} loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─────────── FOOTER ─────────────────────────────────────────── */}
      <footer className="bg-[#0D0D0D] text-white py-10 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pb-8 border-b border-white/10">
            {/* Brand */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <Image src="/Round Logo.png" alt="t-cloud eats" width={36} height={36} />
                <span className="font-black text-base" style={{ color: "#F26F21" }}>t-cloud eats</span>
              </div>
              <p className="text-xs text-white/50 leading-relaxed">Mulleriyawa's premium cloud kitchen. Bold street flavors cooked fresh, delivered hot.</p>
              <div className="flex items-center gap-2 pt-1">
                {[Icon.ig, Icon.fb, Icon.tt].map((Comp, i) => (
                  <a key={i}
                    href={["https://www.instagram.com/tcloudeats/", "https://www.facebook.com/tcloudeats", "https://www.tiktok.com/@tcloudeats"][i]}
                    target="_blank" rel="noopener noreferrer"
                    className="w-8 h-8 rounded-xl bg-white/8 flex items-center justify-center text-white/60 hover:text-white hover:bg-[#F26F21] transition-all">
                    <Comp />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick links */}
            <div>
              <p className="font-black text-xs uppercase tracking-widest text-white/50 mb-3">Quick Links</p>
              <div className="space-y-2">
                {[["Browse Menu", "/order"], ["WhatsApp Order", "https://wa.me/94706288109"], ["Google Maps", "https://maps.app.goo.gl/K5SmeWHuuSF41U7VA"]].map(([label, href]) => (
                  <a key={label} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-white/60 hover:text-[#F26F21] transition-colors font-semibold">
                    {Icon.arrow("w-3 h-3")} {label}
                  </a>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <p className="font-black text-xs uppercase tracking-widest text-white/50 mb-3">Contact</p>
              <div className="space-y-2.5">
                <a href="tel:+94706288109" className="flex items-center gap-2 text-xs text-white/70 hover:text-[#F26F21] transition-colors font-semibold">
                  {Icon.phone()} 070 628 8109
                </a>
                <a href="https://wa.me/94706288109" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-white/70 hover:text-[#F26F21] transition-colors font-semibold">
                  {Icon.wa()} WhatsApp Order
                </a>
                <a href="mailto:tcloudeats@gmail.com" className="flex items-center gap-2 text-xs text-white/70 hover:text-[#F26F21] transition-colors font-semibold">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  tcloudeats@gmail.com
                </a>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 text-[11px] text-white/30 font-semibold">
            <p>© 2026 t-cloud eats. All rights reserved.</p>
            <p>Eat. Enjoy. Repeat. 🍜</p>
          </div>
        </div>
      </footer>
    </>
  );
}
