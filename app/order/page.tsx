"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

/* ── Types ─────────────────────────────────────────────────────── */
interface MenuItem {
  id: number;
  title: string;
  price: number;
  category: string;
  portion: string;
  description?: string;
  image?: string;
  sku?: string;
}
interface CartItem { item: MenuItem; quantity: number; }

/* ── Constants ─────────────────────────────────────────────────── */
const CATEGORIES = ["All", "Fried Rice", "Chopsuey", "Kottu", "Ultimate Bites", "Pasta", "Beverages"];

function getFallbackDescription(title: string, category: string): string {
  if (category === "Beverages") {
    const t = title.toLowerCase();
    if (t.includes("cola")) return "Chilled Coca-Cola bottle.";
    if (t.includes("sprite")) return "Chilled Sprite bottle.";
    if (t.includes("fanta")) return "Chilled Fanta bottle.";
    if (t.includes("egb")) return "Elephant House Ginger Beer.";
    if (t.includes("water")) return "Pure mineral water.";
    if (t.includes("shake")) return "Chilled creamy milkshake.";
    return "Refreshing chilled beverage.";
  }
  return `Delicious ${title} freshly prepared in our kitchen.`;
}

/* ── Icons ─────────────────────────────────────────────────────── */
const Icons = {
  bag: (cls = "w-5 h-5") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
    </svg>
  ),
  plus: (cls = "w-4 h-4") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  minus: (cls = "w-4 h-4") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  trash: (cls = "w-4 h-4") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
    </svg>
  ),
  x: (cls = "w-5 h-5") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  wa: (cls = "w-5 h-5") => (
    <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.38 5.07L2 22l5.07-1.38A9.959 9.959 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.69 0-3.27-.5-4.6-1.36l-.33-.2-3.01.82.82-3.01-.2-.33C3.5 15.27 3 13.69 3 12c0-4.97 4.03-9 9-9s9 4.03 9 9-4.03 9-9 9z"/>
    </svg>
  ),
  search: (cls = "w-4 h-4") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  star: (cls = "w-3.5 h-3.5") => (
    <svg className={cls} viewBox="0 0 20 20" fill="currentColor">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
    </svg>
  ),
  arrow: (cls = "w-4 h-4") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  home: (cls = "w-4 h-4") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  check: (cls = "w-4 h-4") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
};

/* ── Main Component ─────────────────────────────────────────────── */
export default function OrderPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "add" | "remove" } | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  /* ── Data Loading + Realtime ─────────────────────────────────── */
  useEffect(() => {
    async function loadMenu() {
      try {
        const res = await fetch("/api/menu");
        if (res.ok) setMenuItems(await res.json());
      } catch { /* silent */ } finally { setIsLoading(false); }
    }
    loadMenu();

    const channel = supabase
      .channel("customer-menu-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "menu_items" }, () => loadMenu())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  /* ── Scroll listener for Back to Top button (after 2 rows of products disappear) ── */
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 420) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* ── Cart Helpers ────────────────────────────────────────────── */
  const showToast = (msg: string, type: "add" | "remove" = "add") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2200);
  };

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const idx = prev.findIndex((ci) => ci.item.id === item.id);
      if (idx > -1) { const u = [...prev]; u[idx].quantity += 1; return u; }
      return [...prev, { item, quantity: 1 }];
    });
    showToast(`"${item.title}" added to cart`, "add");
  };

  const updateQuantity = (itemId: number, delta: number) => {
    setCart((prev) =>
      prev.map((ci) => ci.item.id === itemId ? { ...ci, quantity: ci.quantity + delta } : ci)
          .filter((ci) => ci.quantity > 0)
    );
  };

  const removeFromCart = (itemId: number) => {
    setCart((prev) => prev.filter((ci) => ci.item.id !== itemId));
    showToast("Item removed", "remove");
  };

  const clearCart = () => setCart([]);

  const totalItems = cart.reduce((s, ci) => s + ci.quantity, 0);
  const subtotal = cart.reduce((s, ci) => s + Number(ci.item.price) * ci.quantity, 0);

  const filteredItems = menuItems.filter((item) => {
    const matchSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchCat = selectedCategory === "All" || item.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const handleCheckout = () => {
    if (!cart.length) return;
    const lines = cart.map((ci) =>
      `• ${ci.quantity}× ${ci.item.title} (${ci.item.portion}) — Rs ${(Number(ci.item.price) * ci.quantity).toLocaleString()}`
    ).join("\n");
    const msg = `Hi t-cloud eats! I'd like to place an order:\n\n${lines}\n\n*Total: Rs ${subtotal.toLocaleString()}*\n\nPlease confirm and arrange delivery. Thank you!`;
    window.open(`https://wa.me/94706288109?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <>
      {/* ── PAGE STYLES ──────────────────────────────────────────── */}
      <style>{`
        body { background: #F7F5F2; color: #0D0D0D; font-family: 'Inter', -apple-system, sans-serif; }
        .scrollbar-none { -ms-overflow-style:none; scrollbar-width:none; }
        .scrollbar-none::-webkit-scrollbar { display:none; }
        .product-card { background:#fff; border-radius:20px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.07); transition:transform .25s ease, box-shadow .25s ease; }
        .product-card:hover { transform:translateY(-5px); box-shadow:0 16px 40px rgba(242,111,33,0.13); }
        .cat-pill { padding:8px 16px; border-radius:100px; font-size:11px; font-weight:800; transition:all .2s ease; border:2px solid transparent; cursor:pointer; white-space:nowrap; text-transform:uppercase; letter-spacing:0.04em; }
        .cat-pill.active { background:#F26F21; color:#fff; box-shadow:0 2px 6px rgba(0,0,0,0.1); }
        .cat-pill:not(.active) { background:#fff; color:#777; border-color:#e5e5e5; }
        .cat-pill:not(.active):hover { border-color:#F26F21; color:#F26F21; }
        @keyframes slideUp { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes slideRight { from{transform:translateX(100%)} to{transform:translateX(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes toastIn { 0%{transform:translateX(-50%) translateY(-16px);opacity:0} 100%{transform:translateX(-50%) translateY(0);opacity:1} }
        @keyframes shimmer { to{background-position:-200% 0} }
        .anim-slide-up { animation:slideUp .35s cubic-bezier(.16,1,.3,1) forwards; }
        .anim-slide-right { animation:slideRight .35s cubic-bezier(.16,1,.3,1) forwards; }
        .anim-fade { animation:fadeIn .25s ease forwards; }
        .anim-toast { animation:toastIn .35s cubic-bezier(.16,1,.3,1) forwards; }
        .shimmer { background:linear-gradient(110deg,#f0f0f0 30%,#e8e8e8 50%,#f0f0f0 70%); background-size:200% 100%; animation:shimmer 1.4s linear infinite; }
        .qty-btn { width:28px; height:28px; border-radius:8px; display:flex; align-items:center; justify-content:center; transition:all .15s ease; cursor:pointer; font-size:0; }
        .drawer-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.55); backdrop-filter:blur(4px); z-index:49; }
      `}</style>

      <div className="min-h-screen bg-[#F7F5F2]" style={{ paddingBottom: totalItems > 0 ? "96px" : "32px" }}>

        {/* ── TOAST ────────────────────────────────────────────────── */}
        {toast && (
          <div className="fixed top-20 left-1/2 z-[70] anim-toast flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-black text-white shadow-xl"
            style={{ background: toast.type === "add" ? "#06C167" : "#F26F21", transform: "translateX(-50%)" }}>
            {toast.type === "add" ? Icons.check() : Icons.trash()}
            <span>{toast.msg}</span>
          </div>
        )}

        {/* ── STICKY HEADER ────────────────────────────────────────── */}
        <header style={{ background: "rgba(255,255,255,0.93)", backdropFilter: "blur(18px)", borderBottom: "1px solid #eee" }}
          className="sticky top-0 z-40 px-4 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <Image src="/Round Logo.png" alt="t-cloud eats" width={36} height={36} className="object-contain" />
              <div>
                <p className="text-sm font-black tracking-wider leading-none" style={{ color: "#F26F21" }}>t-cloud eats</p>
                <p className="text-[9px] font-bold text-gray-400 tracking-widest uppercase">Digital Menu</p>
              </div>
            </Link>

            {/* Live badge */}
            <div className="hidden sm:flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
              Kitchen Open · ~20 Min Prep
            </div>

            <div className="flex items-center gap-2">
              <Link href="/" className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-[#F26F21] transition-colors">
                {Icons.home()} Home
              </Link>

              {/* Cart Button */}
              <button onClick={() => setIsCartOpen(true)}
                className="relative flex items-center gap-2 text-white text-xs font-black px-4 py-2.5 rounded-full transition-all active:scale-95"
                style={{ background: "#F26F21", boxShadow: totalItems > 0 ? "0 6px 20px rgba(242,111,33,0.4)" : "none" }}>
                {Icons.bag("w-4 h-4")}
                <span className="hidden sm:inline">My Cart</span>
                {totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#0D0D0D] text-white text-[10px] font-black rounded-full flex items-center justify-center shadow">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* ── HERO BANNER ──────────────────────────────────────────── */}
        <section style={{ background: "linear-gradient(135deg,#F26F21 0%,#FF9248 50%,#e05c0d 100%)" }}
          className="relative overflow-hidden px-5 pt-8 pb-24">
          {/* decorative circles */}
          <div className="absolute -right-10 -top-10 w-52 h-52 rounded-full bg-white/10" />
          <div className="absolute right-20 bottom-0 w-32 h-32 rounded-full bg-white/10" />

          <div className="max-w-6xl mx-auto relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-white text-center sm:text-left">
              <p className="text-[11px] font-black uppercase tracking-widest bg-white/20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-3">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" /> Live Menu
              </p>
              <h1 className="text-2xl sm:text-4xl font-black leading-tight drop-shadow-sm mb-2">
                Street Food. <br className="sm:hidden" />Your Way. 🍜
              </h1>
              <p className="text-white/80 text-sm max-w-sm leading-relaxed">
                Add items to your cart and checkout via WhatsApp. It takes less than 30 seconds.
              </p>
            </div>

            <div className="flex items-center gap-4 text-white">
              {[["20+", "Dishes"], ["5.0★", "Rating"], ["~20m", "Prep"]].map(([v, l]) => (
                <div key={l} className="text-center bg-white/15 backdrop-blur rounded-2xl px-4 py-3 border border-white/20">
                  <p className="font-black text-lg leading-none">{v}</p>
                  <p className="text-[10px] text-white/70 font-bold uppercase tracking-wider mt-0.5">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SEARCH + CATEGORIES ────────────────────────────────────── */}
        <div className="max-w-6xl mx-auto px-4 -mt-8 relative z-10">
          {/* Floating white search card */}
          <div className="bg-white rounded-2xl p-4 shadow-xl mb-5" style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.10)" }}>
            <div className="relative mb-4">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                {Icons.search("w-4 h-4")}
              </span>
              <input
                ref={searchRef}
                type="text"
                placeholder="Search for dishes, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-sm pl-10 pr-10 py-3 rounded-xl focus:outline-none focus:border-[#F26F21] focus:ring-2 focus:ring-[#F26F21]/10 transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 flex items-center justify-center text-[10px] transition-all">
                  ×
                </button>
              )}
            </div>

            {/* Category pills */}
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5">
              {CATEGORIES.map((c) => (
                <button key={c} onClick={() => setSelectedCategory(c)} className={`cat-pill ${selectedCategory === c ? "active" : ""}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* ── MENU GRID ─────────────────────────────────────────────── */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="product-card">
                  <div className="shimmer h-32 sm:h-40 w-full" />
                  <div className="p-3 space-y-2">
                    <div className="shimmer h-3 rounded w-3/4" />
                    <div className="shimmer h-3 rounded w-1/2" />
                    <div className="shimmer h-8 rounded-lg w-full mt-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {filteredItems.map((item) => {
                const inCart = cart.find((ci) => ci.item.id === item.id);
                const qty = inCart?.quantity ?? 0;

                return (
                  <div key={item.id} className="product-card flex flex-col">
                    {/* Image */}
                    <div className="relative h-32 sm:h-40 bg-gray-100 flex-shrink-0 overflow-hidden cursor-pointer"
                      onClick={() => setSelectedProduct(item)}>
                      {item.image
                        ? <img src={item.image} alt={item.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                        : item.category === "Beverages"
                          ? (
                            <div className="w-full h-full flex flex-col items-center justify-center" style={{ background: "linear-gradient(135deg,#e8e8e8,#d0d0d0)" }}>
                              <svg viewBox="0 0 64 80" className="w-10 h-14 opacity-50" fill="none">
                                <rect x="18" y="4" width="28" height="6" rx="3" fill="#999"/>
                                <path d="M14 10 L10 68 Q10 72 14 72 L50 72 Q54 72 54 68 L50 10 Z" fill="#bbb" stroke="#aaa" strokeWidth="1"/>
                                <path d="M16 10 L20 10 L16 68 Q16 70 18 70 L14 70 Q12 70 12 68 Z" fill="#c8c8c8"/>
                                <ellipse cx="32" cy="38" rx="12" ry="4" fill="#aaa" opacity="0.4"/>
                                <path d="M50 22 Q58 22 58 28 Q58 34 50 32" stroke="#aaa" strokeWidth="2" fill="none" strokeLinecap="round"/>
                              </svg>
                              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1">Beverage</p>
                            </div>
                          )
                          : (
                            <div className="w-full h-full flex flex-col items-center justify-center" style={{ background: "linear-gradient(135deg,#e8e8e8,#d0d0d0)" }}>
                              <svg viewBox="0 0 80 80" className="w-14 h-14 opacity-40" fill="none">
                                <circle cx="40" cy="38" r="24" fill="none" stroke="#999" strokeWidth="3"/>
                                <path d="M24 38 Q40 20 56 38" fill="#bbb"/>
                                <circle cx="32" cy="34" r="4" fill="#aaa"/>
                                <circle cx="48" cy="32" r="3" fill="#aaa"/>
                                <circle cx="40" cy="42" r="2.5" fill="#c0c0c0"/>
                                <rect x="16" y="62" width="48" height="4" rx="2" fill="#bbb"/>
                                <rect x="22" y="58" width="36" height="6" rx="3" fill="#aaa"/>
                                <line x1="20" y1="62" x2="60" y2="62" stroke="#999" strokeWidth="1"/>
                              </svg>
                              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1">Food Item</p>
                            </div>
                          )
                      }

                      {/* Category Badge */}
                      <span className="absolute top-2.5 left-2.5 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(13,13,13,0.75)", color: "#fff", backdropFilter: "blur(4px)" }}>
                        {item.category}
                      </span>

                      {/* Quick add button (top-right) */}
                      {qty === 0 && (
                        <button onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                          className="absolute bottom-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg transition-all active:scale-90"
                          style={{ background: "#F26F21" }}>
                          {Icons.plus("w-4 h-4")}
                        </button>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3 sm:p-3.5 flex flex-col flex-1 justify-between">
                      <div className="mb-2.5 cursor-pointer" onClick={() => setSelectedProduct(item)}>
                        <h3 className="font-extrabold text-xs sm:text-sm text-gray-900 truncate leading-tight mb-0.5 hover:text-[#F26F21] transition-colors">{item.title}</h3>
                        <p className="text-[10px] text-gray-400 leading-snug line-clamp-2 mb-1.5">
                          {item.description || getFallbackDescription(item.title, item.category)}
                        </p>

                        <div className="flex items-center justify-between">
                          <span className="font-black text-sm" style={{ color: "#F26F21" }}>
                            Rs {Number(item.price).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Cart controls */}
                      {qty > 0 ? (
                        <div className="flex items-center justify-between bg-gray-50 rounded-xl p-1.5 border border-gray-200">
                          <button onClick={() => updateQuantity(item.id, -1)}
                            className="qty-btn bg-white border border-gray-200 text-gray-700 hover:border-[#F26F21] hover:text-[#F26F21]">
                            {Icons.minus("w-3.5 h-3.5")}
                          </button>
                          <span className="text-sm font-black text-gray-900 px-2">{qty}</span>
                          <button onClick={() => updateQuantity(item.id, 1)}
                            className="qty-btn text-white"
                            style={{ background: "#F26F21" }}>
                            {Icons.plus("w-3.5 h-3.5")}
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => addToCart(item)}
                          className="w-full text-white text-xs font-black py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95"
                          style={{ background: "#F26F21", boxShadow: "0 4px 14px rgba(242,111,33,0.3)" }}>
                          {Icons.plus("w-3.5 h-3.5")} Add to Cart
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow">
              <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🔍</div>
              <h3 className="font-extrabold text-gray-800 mb-1">No dishes found</h3>
              <p className="text-sm text-gray-500 mb-4">Try a different search or category</p>
              <button onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }}
                className="text-white text-sm font-black px-6 py-2.5 rounded-full transition-all active:scale-95"
                style={{ background: "#F26F21" }}>
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── FLOATING CART BAR ────────────────────────────────────────── */}
      {totalItems > 0 && !isCartOpen && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-40 anim-slide-up">
          <div className="rounded-2xl flex items-center justify-between px-4 py-3.5 gap-3"
            style={{ background: "#0D0D0D", boxShadow: "0 16px 48px rgba(0,0,0,0.4)" }}>
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl flex items-center justify-center text-white"
                style={{ background: "#F26F21" }}>
                {Icons.bag("w-5 h-5")}
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white text-[#F26F21] text-[10px] font-black rounded-full flex items-center justify-center shadow">
                  {totalItems}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Cart Subtotal</p>
                <p className="font-black text-white">Rs {subtotal.toLocaleString()}</p>
              </div>
            </div>

            <button onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2 text-white text-xs font-black px-4 py-2.5 rounded-xl transition-all active:scale-95"
              style={{ background: "#F26F21", boxShadow: "0 4px 16px rgba(242,111,33,0.45)" }}>
              View Cart {Icons.arrow("w-3.5 h-3.5")}
            </button>
          </div>
        </div>
      )}

      {/* ── BACK TO TOP FLOATING BUTTON ──────────────────────────── */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className={`fixed z-40 w-11 h-11 rounded-full bg-[#0D0D0D] text-white flex items-center justify-center shadow-2xl transition-all duration-300 active:scale-90 hover:bg-[#F26F21] border border-white/20 anim-slide-up ${
            totalItems > 0 && !isCartOpen ? "bottom-24 right-4 sm:bottom-6 sm:right-6" : "bottom-6 right-4 sm:bottom-6 sm:right-6"
          }`}
          aria-label="Back to Top"
          style={{ boxShadow: "0 8px 25px rgba(0,0,0,0.35)" }}>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
          </svg>
        </button>
      )}

      {/* ── CART DRAWER ──────────────────────────────────────────────── */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex sm:justify-end">
          {/* Backdrop */}
          <div className="drawer-backdrop anim-fade" onClick={() => setIsCartOpen(false)} />

          {/* Panel */}
          <aside className="relative w-full sm:w-[420px] mt-auto sm:mt-0 h-[90svh] sm:h-full bg-white flex flex-col z-50 anim-slide-up sm:anim-slide-right"
            style={{ borderRadius: "24px 24px 0 0", boxShadow: "-8px 0 48px rgba(0,0,0,0.18)" }}>

            {/* Drawer Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl text-white flex items-center justify-center"
                  style={{ background: "#F26F21" }}>
                  {Icons.bag("w-5 h-5")}
                </div>
                <div>
                  <h2 className="font-black text-base text-gray-900">Your Cart</h2>
                  <p className="text-xs text-gray-400 font-semibold">{totalItems} {totalItems === 1 ? "item" : "items"} selected</p>
                </div>
              </div>
              <button onClick={() => setIsCartOpen(false)}
                className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-all">
                {Icons.x("w-4 h-4")}
              </button>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto scrollbar-none px-4 py-3 space-y-2.5">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-12">
                  <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center text-4xl">🛒</div>
                  <div>
                    <h3 className="font-extrabold text-gray-800 mb-1">Your cart is empty</h3>
                    <p className="text-sm text-gray-500">Add some dishes to get started!</p>
                  </div>
                  <button onClick={() => setIsCartOpen(false)}
                    className="text-white text-sm font-black px-6 py-3 rounded-2xl transition-all active:scale-95"
                    style={{ background: "#F26F21", boxShadow: "0 6px 20px rgba(242,111,33,0.35)" }}>
                    Explore Menu
                  </button>
                </div>
              ) : (
                <>
                  {/* Cart items */}
                  {cart.map(({ item, quantity }) => (
                    <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3 border border-gray-100">
                      {/* Thumbnail */}
                      {item.image
                        ? <img src={item.image} alt={item.title} className="w-14 h-14 rounded-xl object-cover flex-shrink-0 bg-gray-200" />
                        : item.category === "Beverages"
                          ? (
                            <div className="w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg,#e8e8e8,#d0d0d0)" }}>
                              <svg viewBox="0 0 40 52" className="w-6 h-8 opacity-50" fill="none">
                                <rect x="10" y="2" width="20" height="4" rx="2" fill="#999"/>
                                <path d="M8 6 L6 46 Q6 48 8 48 L32 48 Q34 48 34 46 L32 6 Z" fill="#bbb" stroke="#aaa" strokeWidth="0.5"/>
                                <ellipse cx="20" cy="24" rx="8" ry="3" fill="#aaa" opacity="0.4"/>
                                <path d="M32 14 Q38 14 38 18 Q38 22 32 21" stroke="#aaa" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                              </svg>
                            </div>
                          )
                          : <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg,#e8e8e8,#d0d0d0)" }}>
                              <svg viewBox="0 0 40 40" className="w-8 h-8 opacity-40" fill="none">
                                <circle cx="20" cy="18" r="12" fill="none" stroke="#999" strokeWidth="1.5"/>
                                <path d="M12 18 Q20 10 28 18" fill="#bbb"/>
                                <circle cx="16" cy="16" r="2" fill="#aaa"/>
                                <circle cx="24" cy="15" r="1.5" fill="#aaa"/>
                                <rect x="8" y="30" width="24" height="2" rx="1" fill="#bbb"/>
                                <rect x="11" y="28" width="18" height="4" rx="2" fill="#aaa"/>
                              </svg>
                            </div>
                      }

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-extrabold text-sm text-gray-900 truncate">{item.title}</h4>
                        <p className="text-[10px] text-gray-400 font-medium">{item.portion}</p>
                        <p className="font-black text-sm mt-0.5" style={{ color: "#F26F21" }}>
                          Rs {(Number(item.price) * quantity).toLocaleString()}
                        </p>
                      </div>

                      {/* Qty + remove */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-200 p-1">
                          <button onClick={() => updateQuantity(item.id, -1)}
                            className="qty-btn bg-gray-100 hover:bg-gray-200 text-gray-700">
                            {Icons.minus("w-3.5 h-3.5")}
                          </button>
                          <span className="text-sm font-black text-gray-900 w-5 text-center">{quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)}
                            className="qty-btn text-white"
                            style={{ background: "#F26F21" }}>
                            {Icons.plus("w-3.5 h-3.5")}
                          </button>
                        </div>
                        <button onClick={() => removeFromCart(item.id)}
                          className="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-100 text-red-400 flex items-center justify-center transition-colors">
                          {Icons.trash("w-3.5 h-3.5")}
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* ── UPSELL: Suggest food add-ons ── */}
                  {(() => {
                    const cartIds = cart.map(ci => ci.item.id);
                    const foodSuggestions = menuItems
                      .filter(m => m.category !== "Beverages" && !cartIds.includes(m.id))
                      .slice(0, 3);
                    if (foodSuggestions.length === 0) return null;
                    return (
                      <div className="mt-1 rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg,#FFF7F0,#FFF3E8)", border: "1px solid rgba(242,111,33,0.15)" }}>
                        <div className="flex items-center gap-2 px-3.5 pt-3 pb-2">
                          <span className="text-base">🔥</span>
                          <p className="text-[11px] font-black text-gray-700 uppercase tracking-wider">People also add</p>
                        </div>
                        <div className="flex gap-2 overflow-x-auto scrollbar-none px-3.5 pb-3">
                          {foodSuggestions.map(s => (
                            <button key={s.id} onClick={() => addToCart(s)}
                              className="flex-shrink-0 flex items-center gap-2 bg-white rounded-xl px-2.5 py-2 shadow-sm border border-orange-100 hover:border-[#F26F21] transition-all active:scale-95">
                              {s.image
                                ? <img src={s.image} alt={s.title} className="w-9 h-9 rounded-lg object-cover" />
                                : <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#e8e8e8,#d0d0d0)" }}>
                                    <svg viewBox="0 0 24 24" className="w-5 h-5 opacity-40" fill="none"><circle cx="12" cy="11" r="7" fill="none" stroke="#999" strokeWidth="1.5"/><path d="M7 11 Q12 6 17 11" fill="#bbb"/><rect x="5" y="18" width="14" height="1.5" rx="0.75" fill="#bbb"/></svg>
                                  </div>
                              }
                              <div className="text-left">
                                <p className="text-[10px] font-extrabold text-gray-800 leading-tight" style={{ maxWidth: 90, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.title}</p>
                                <p className="text-[10px] font-black" style={{ color: "#F26F21" }}>Rs {Number(s.price).toLocaleString()}</p>
                              </div>
                              <div className="w-6 h-6 rounded-full text-white flex items-center justify-center flex-shrink-0 ml-1" style={{ background: "#F26F21" }}>
                                {Icons.plus("w-3 h-3")}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* ── UPSELL: Free Beverage Goal Progress Bar & Beverage Selection ── */}
                  {(() => {
                    const TARGET = 3000;
                    const isUnlocked = subtotal >= TARGET;
                    const remaining = Math.max(0, TARGET - subtotal);
                    const pct = Math.min(100, Math.round((subtotal / TARGET) * 100));

                    const cartIds = cart.map(ci => ci.item.id);
                    // Filter out milkshakes!
                    let beverages = menuItems
                      .filter(m => m.category === "Beverages" && !m.title.toLowerCase().includes("shake") && !cartIds.includes(m.id));

                    // Guarantee Elephant House Orange Crush is included in free beverages list
                    if (!beverages.some(b => b.title.toLowerCase().includes("orange crush"))) {
                      beverages.unshift({
                        id: 9991,
                        title: "Elephant House Orange Crush",
                        price: 300,
                        category: "Beverages",
                        portion: "1.05L Bottle",
                        description: "Chilled Elephant House Orange Crush.",
                        image: "/Product Images/BV-07.avif"
                      });
                    }
                    beverages = beverages.slice(0, 6);

                    return (
                      <div className="mt-2 space-y-2">
                        {/* Progress Bar Card */}
                        <div className="rounded-2xl p-3 border transition-all"
                          style={{
                            background: isUnlocked ? "linear-gradient(135deg,#ECFDF5 0%,#D1FAE5 100%)" : "linear-gradient(135deg,#FFF7F0 0%,#FFF0E5 100%)",
                            borderColor: isUnlocked ? "#10B981" : "#F26F21"
                          }}>
                          <div className="flex items-center justify-between text-xs font-black mb-1.5">
                            <span className="flex items-center gap-1.5" style={{ color: isUnlocked ? "#047857" : "#C2410C" }}>
                              {isUnlocked ? "🎉 Free Drink Unlocked!" : `🍹 Add Rs ${remaining.toLocaleString()} more for FREE Drink`}
                            </span>
                            <span className="font-bold text-[10px]" style={{ color: isUnlocked ? "#059669" : "#EA580C" }}>
                              Rs {subtotal.toLocaleString()} / Rs 3,000
                            </span>
                          </div>
                          
                          {/* Progress Bar Track */}
                          <div className="w-full h-2.5 bg-black/10 rounded-full overflow-hidden p-0.5">
                            <div className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${pct}%`,
                                background: isUnlocked ? "linear-gradient(90deg,#10B981,#059669)" : "linear-gradient(90deg,#F26F21,#FF8C3F)"
                              }} />
                          </div>
                        </div>

                        {/* Drink Selection Section */}
                        {beverages.length > 0 && (
                          <div className={`rounded-2xl overflow-hidden border transition-all ${isUnlocked ? "bg-emerald-50/60 border-emerald-200" : "bg-gray-100/90 border-gray-200"}`}>
                            <div className="flex items-center justify-between px-3.5 pt-3 pb-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-base">{isUnlocked ? "🎁" : "🔒"}</span>
                                <p className="text-[11px] font-black text-gray-800 uppercase tracking-wider">
                                  {isUnlocked ? "Choose Your FREE Drink" : "Add a Drink (Locked)"}
                                </p>
                              </div>
                              <span className="text-[9px] font-bold text-gray-400">Excludes milkshakes</span>
                            </div>

                            <div className="flex gap-2 overflow-x-auto scrollbar-none px-3.5 pb-3">
                              {beverages.map(bev => (
                                <button key={bev.id}
                                  disabled={!isUnlocked}
                                  onClick={() => {
                                    if (isUnlocked) {
                                      addToCart({ ...bev, price: 0 });
                                    }
                                  }}
                                  className={`flex-shrink-0 flex items-center gap-2 rounded-xl px-2.5 py-2 shadow-sm border transition-all ${
                                    isUnlocked
                                      ? "bg-white border-emerald-300 hover:border-emerald-500 cursor-pointer active:scale-95"
                                      : "bg-white/60 border-gray-200 opacity-60 cursor-not-allowed"
                                  }`}>
                                  {bev.image
                                    ? <img src={bev.image} alt={bev.title} className="w-9 h-9 rounded-lg object-cover" />
                                    : (
                                      <div className="w-9 h-9 rounded-lg flex flex-col items-center justify-center bg-gray-200">
                                        <svg viewBox="0 0 40 52" className="w-5 h-6 opacity-40" fill="none">
                                          <rect x="10" y="2" width="20" height="4" rx="2" fill="#999"/>
                                          <path d="M8 6 L6 46 Q6 48 8 48 L32 48 Q34 48 34 46 L32 6 Z" fill="#bbb" stroke="#aaa" strokeWidth="0.5"/>
                                        </svg>
                                      </div>
                                    )
                                  }
                                  <div className="text-left">
                                    <p className="text-[10px] font-extrabold text-gray-800 leading-tight" style={{ maxWidth: 80, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{bev.title}</p>
                                    {isUnlocked ? (
                                      <span className="inline-block bg-emerald-100 text-emerald-700 font-extrabold px-1.5 py-0.5 rounded-full text-[9px]">FREE ✔</span>
                                    ) : (
                                      <p className="text-[10px] font-bold text-gray-400">Rs {Number(bev.price).toLocaleString()}</p>
                                    )}
                                  </div>
                                  {isUnlocked && (
                                    <div className="w-6 h-6 rounded-full text-white flex items-center justify-center flex-shrink-0 ml-1 bg-emerald-500">
                                      {Icons.plus("w-3 h-3")}
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </>
              )}
            </div>

            {/* Checkout Footer */}
            {cart.length > 0 && (
              <div className="px-4 py-4 border-t border-gray-100 space-y-3">
                {/* Order Summary */}
                <div className="bg-gray-50 rounded-2xl p-3.5 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span className="font-semibold">Subtotal ({totalItems} items)</span>
                    <span className="font-bold text-gray-900">Rs {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-500 text-xs">
                    <span>Delivery fee</span>
                    <span className="text-green-600 font-bold">Discussed on WhatsApp</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between font-black">
                    <span className="text-gray-900">Order Total</span>
                    <span style={{ color: "#F26F21" }} className="text-base">Rs {subtotal.toLocaleString()}</span>
                  </div>
                </div>

                {/* Checkout CTA */}
                <button onClick={handleCheckout}
                  className="w-full flex items-center justify-center gap-2.5 text-white font-black text-sm py-4 rounded-2xl transition-all active:scale-[0.98]"
                  style={{ background: "#25D366", boxShadow: "0 8px 24px rgba(37,211,102,0.4)" }}>
                  {Icons.wa()} Proceed to WhatsApp Checkout
                </button>

                <div className="flex items-center justify-between text-xs text-gray-400 font-semibold">
                  <span>⚡ Kitchen prep ~20 minutes</span>
                  <button onClick={clearCart} className="text-red-400 hover:text-red-600 hover:underline transition-colors">
                    Clear Cart
                  </button>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}
      {/* ── PRODUCT DETAIL MODAL (INDIVIDUAL ENTITY) ────────── */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md anim-fade"
          onClick={() => setSelectedProduct(null)}>
          <div className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl anim-slide-up"
            onClick={(e) => e.stopPropagation()} style={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)" }}>
            
            {/* Image header */}
            <div className="relative h-56 sm:h-64 bg-gray-100 overflow-hidden">
              {selectedProduct.image
                ? <img src={selectedProduct.image} alt={selectedProduct.title} className="w-full h-full object-cover" />
                : selectedProduct.category === "Beverages"
                  ? (
                    <div className="w-full h-full flex flex-col items-center justify-center" style={{ background: "linear-gradient(135deg,#e8e8e8,#d0d0d0)" }}>
                      <svg viewBox="0 0 64 80" className="w-16 h-20 opacity-50" fill="none">
                        <rect x="18" y="4" width="28" height="6" rx="3" fill="#999"/>
                        <path d="M14 10 L10 68 Q10 72 14 72 L50 72 Q54 72 54 68 L50 10 Z" fill="#bbb" stroke="#aaa" strokeWidth="1"/>
                        <path d="M16 10 L20 10 L16 68 Q16 70 18 70 L14 70 Q12 70 12 68 Z" fill="#c8c8c8"/>
                        <ellipse cx="32" cy="38" rx="12" ry="4" fill="#aaa" opacity="0.4"/>
                      </svg>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-2">Beverage</p>
                    </div>
                  )
                  : (
                    <div className="w-full h-full flex flex-col items-center justify-center" style={{ background: "linear-gradient(135deg,#e8e8e8,#d0d0d0)" }}>
                      <svg viewBox="0 0 80 80" className="w-20 h-20 opacity-40" fill="none">
                        <circle cx="40" cy="38" r="24" fill="none" stroke="#999" strokeWidth="3"/>
                        <path d="M24 38 Q40 20 56 38" fill="#bbb"/>
                        <circle cx="32" cy="34" r="4" fill="#aaa"/>
                        <circle cx="48" cy="32" r="3" fill="#aaa"/>
                      </svg>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-2">Food Item</p>
                    </div>
                  )
              }
              <button onClick={() => setSelectedProduct(null)}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center font-bold text-lg transition-all z-10 backdrop-blur-sm">
                ×
              </button>
              {selectedProduct.category && (
                <span className="absolute top-3 left-3 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-[#F26F21] text-white shadow-md">
                  {selectedProduct.category}
                </span>
              )}
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h2 className="text-xl font-black text-gray-900 leading-tight">{selectedProduct.title}</h2>
                  <p className="text-xs font-bold text-[#F26F21] mt-0.5 flex items-center gap-1">
                    {selectedProduct.category === "Beverages" ? (selectedProduct.portion || "Bottle") : (
                      <>
                        Large Portion · Serves 2
                        <svg className="w-3.5 h-3.5 text-black inline-block" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                          <path d="M18 12c1.66 0 3-1.34 3-3s-1.34-3-3-3c-.37 0-.72.08-1.05.21 1.28 1.15 1.28 3.43 0 4.58.33.13.68.21 1.05.21zm0 2c-.67 0-1.42.08-2.22.23 1.45.96 2.22 2.25 2.22 3.77v2h4v-2c0-2.21-3.58-4-4-4z" opacity="0.75"/>
                        </svg>
                      </>
                    )}
                  </p>
                </div>
                <span className="text-xl font-black text-[#F26F21] flex-shrink-0">
                  Rs {Number(selectedProduct.price).toLocaleString()}
                </span>
              </div>

              <p className="text-xs text-gray-500 leading-relaxed mb-6">
                {selectedProduct.description || getFallbackDescription(selectedProduct.title, selectedProduct.category)}
              </p>

              {/* Cart Actions */}
              {(() => {
                const inCart = cart.find(ci => ci.item.id === selectedProduct.id);
                const qty = inCart?.quantity ?? 0;
                return (
                  <div className="flex items-center gap-3">
                    {qty > 0 ? (
                      <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-2 border border-gray-200 flex-1">
                        <button onClick={() => updateQuantity(selectedProduct.id, -1)}
                          className="qty-btn bg-white border border-gray-200 text-gray-700 hover:border-[#F26F21] hover:text-[#F26F21]">
                          {Icons.minus("w-4 h-4")}
                        </button>
                        <span className="text-base font-black text-gray-900 px-3">{qty} in cart</span>
                        <button onClick={() => updateQuantity(selectedProduct.id, 1)}
                          className="qty-btn text-white"
                          style={{ background: "#F26F21" }}>
                          {Icons.plus("w-4 h-4")}
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}
                        className="flex-1 text-white text-xs font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg"
                        style={{ background: "#F26F21", boxShadow: "0 8px 24px rgba(242,111,33,0.4)" }}>
                        {Icons.plus("w-4 h-4")} Add to Cart (Rs {Number(selectedProduct.price).toLocaleString()})
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
