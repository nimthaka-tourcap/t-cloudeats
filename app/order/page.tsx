"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { getStoreStatus, StoreStatus } from "@/lib/utils/business-hours";

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
interface CartItem {
  item: MenuItem;
  quantity: number;
  isFreePromo?: boolean;
}

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
  const [storeStatus, setStoreStatus] = useState<StoreStatus>(getStoreStatus());
  const [showPromoReminderModal, setShowPromoReminderModal] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  /* ── Load & Sync Cart with LocalStorage ─────────────────────── */
  useEffect(() => {
    const syncCart = () => {
      try {
        const saved = localStorage.getItem("tcloud_cart");
        if (saved) setCart(JSON.parse(saved));
        else setCart([]);
      } catch {}
    };
    syncCart();
    window.addEventListener("storage", syncCart);
    window.addEventListener("cart_updated", syncCart);
    return () => {
      window.removeEventListener("storage", syncCart);
      window.removeEventListener("cart_updated", syncCart);
    };
  }, []);

  // Save Cart to LocalStorage whenever cart changes
  useEffect(() => {
    try {
      localStorage.setItem("tcloud_cart", JSON.stringify(cart));
      window.dispatchEvent(new Event("cart_updated"));
    } catch {}
  }, [cart]);

  /* ── Live store open/close tracker (Asia/Colombo time) ────── */
  useEffect(() => {
    setStoreStatus(getStoreStatus());
    const interval = setInterval(() => {
      setStoreStatus(getStoreStatus());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

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
      const idx = prev.findIndex((ci) => ci.item.id === item.id && !ci.isFreePromo);
      if (idx > -1) { const u = [...prev]; u[idx].quantity += 1; return u; }
      return [...prev, { item, quantity: 1, isFreePromo: false }];
    });
    showToast(`"${item.title}" added to cart`, "add");
  };

  // Claim exactly 1 free beverage promo (replaces any previously selected promo beverage)
  const claimFreeDrink = (beverage: MenuItem) => {
    if (subtotal < 3000) {
      showToast("Spend Rs 3,000+ to unlock FREE drink!", "remove");
      return;
    }
    setCart((prev) => {
      const withoutFree = prev.filter((ci) => !ci.isFreePromo);
      return [
        ...withoutFree,
        {
          item: { ...beverage, price: 0 },
          quantity: 1,
          isFreePromo: true,
        },
      ];
    });
    showToast(`🎁 Claimed FREE ${beverage.title}!`, "add");
  };

  const removeFreeDrink = () => {
    setCart((prev) => prev.filter((ci) => !ci.isFreePromo));
    showToast("Free beverage removed", "remove");
  };

  const updateQuantity = (itemId: number, delta: number, isFreePromo?: boolean) => {
    if (isFreePromo) {
      if (delta > 0) {
        showToast("Promo limited to 1 free drink per order", "remove");
        return;
      }
      removeFreeDrink();
      return;
    }
    setCart((prev) =>
      prev.map((ci) => (ci.item.id === itemId && !ci.isFreePromo) ? { ...ci, quantity: ci.quantity + delta } : ci)
          .filter((ci) => ci.quantity > 0)
    );
  };

  const removeFromCart = (itemId: number, isFreePromo?: boolean) => {
    if (isFreePromo) {
      removeFreeDrink();
      return;
    }
    setCart((prev) => prev.filter((ci) => ci.isFreePromo || ci.item.id !== itemId));
    showToast("Item removed", "remove");
  };

  const clearCart = () => setCart([]);

  const totalItems = cart.reduce((s, ci) => s + ci.quantity, 0);
  // Free promo item price is 0 so it doesn't count towards the required 3000 threshold
  const subtotal = cart.reduce((s, ci) => s + (ci.isFreePromo ? 0 : Number(ci.item.price) * ci.quantity), 0);

  // Auto-remove free promo drink if subtotal drops below 3000
  useEffect(() => {
    if (subtotal < 3000) {
      setCart((prev) => {
        if (prev.some((ci) => ci.isFreePromo)) {
          showToast("Free drink removed (Subtotal under Rs 3,000)", "remove");
          return prev.filter((ci) => !ci.isFreePromo);
        }
        return prev;
      });
    }
  }, [subtotal]);

  const filteredItems = useMemo(() => {
    const CATEGORY_ORDER = ["Fried Rice", "Chopsuey", "Kottu", "Pasta", "Ultimate Bites", "Beverages"];
    return menuItems
      .filter((item) => {
        const matchSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
        const matchCat = selectedCategory === "All" || item.category === selectedCategory;
        return matchSearch && matchCat;
      })
      .sort((a, b) => {
        const catA = CATEGORY_ORDER.indexOf(a.category);
        const catB = CATEGORY_ORDER.indexOf(b.category);
        const orderA = catA === -1 ? 99 : catA;
        const orderB = catB === -1 ? 99 : catB;
        if (orderA !== orderB) return orderA - orderB;
        return a.id - b.id;
      });
  }, [menuItems, searchQuery, selectedCategory]);

  const handleCheckout = (skipPromoCheck?: boolean) => {
    if (!cart.length) return;

    // If order qualifies for free drink promo (Rs 3,000+) but none is selected yet, prompt user with reminder modal
    const hasClaimedPromo = cart.some(ci => ci.isFreePromo);
    if (subtotal >= 3000 && !hasClaimedPromo && !skipPromoCheck) {
      setShowPromoReminderModal(true);
      return;
    }

    setShowPromoReminderModal(false);

    const lines = cart.map((ci) => {
      if (ci.isFreePromo) {
        return `• 1× ${ci.item.title} (${ci.item.portion || "Beverage"}) — 🎁 FREE PROMO ITEM (Rs 0)`;
      }
      return `• ${ci.quantity}× ${ci.item.title} (${ci.item.portion}) — Rs ${(Number(ci.item.price) * ci.quantity).toLocaleString()}`;
    }).join("\n");

    const closedNotice = !storeStatus.isOpen
      ? "\n\n⚠️ *Note:* Order placed during non-business hours (Closed after 12 AM). Please confirm delivery time upon kitchen opening at 11:00 AM."
      : "";

    const msg = `Hi t-cloud eats! I'd like to place an order:\n\n${lines}\n\n*Total: Rs ${subtotal.toLocaleString()}*${closedNotice}\n\nPlease confirm and arrange delivery. Thank you!`;
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
        .qty-btn { width:30px; height:30px; border-radius:10px; display:flex; align-items:center; justify-content:center; transition:all .15s ease; cursor:pointer; font-size:0; }
        .drawer-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.65); backdrop-filter:blur(6px); z-index:100; }
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

            {/* Live store status badge */}
            <div className={`flex items-center gap-1.5 border px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-colors ${storeStatus.badgeColorClass}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${storeStatus.dotColorClass} ${storeStatus.isOpen ? "animate-ping" : ""}`} />
              <span>{storeStatus.statusText} · {storeStatus.helperText}</span>
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

        {/* ── CLOSED WARNING BANNER ── */}
        {!storeStatus.isOpen && (
          <div className="bg-gradient-to-r from-rose-500/15 via-amber-500/10 to-rose-500/15 border-b border-rose-200/80 px-4 py-2.5 text-center text-xs font-bold text-rose-900 flex items-center justify-center gap-2 shadow-inner">
            <span className="text-sm">🌙</span>
            <span>Kitchen is currently <strong>Closed (Operating hours: 11:00 AM – 12:00 AM Midnight)</strong>. You can still pre-order or browse our menu!</span>
          </div>
        )}

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

      {/* ── MODERN MINIMALIST CART DRAWER (MOBILE BOTTOM SHEET & DESKTOP SIDE PANEL) ── */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[100] flex sm:justify-end">
          {/* Backdrop */}
          <div className="drawer-backdrop anim-fade" onClick={() => setIsCartOpen(false)} />

          {/* Panel */}
          <aside className="relative w-full sm:w-[420px] h-[88dvh] sm:h-full max-h-[88dvh] sm:max-h-full mt-auto sm:mt-0 bg-white flex flex-col z-[101] rounded-t-3xl sm:rounded-none sm:border-l sm:border-neutral-200 shadow-2xl overflow-hidden anim-slide-up sm:anim-slide-right">
            
            {/* Mobile Sheet Drag Handle */}
            <div className="pt-3 pb-1 flex justify-center sm:hidden bg-white flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-neutral-200" />
            </div>

            {/* Header */}
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between bg-white flex-shrink-0">
              <div className="flex items-baseline gap-2">
                <h2 className="text-lg font-bold text-neutral-900 tracking-tight">Your Cart</h2>
                <span className="text-xs text-neutral-400 font-medium">({totalItems} {totalItems === 1 ? "item" : "items"})</span>
              </div>
              <button onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-900 flex items-center justify-center transition-colors"
                aria-label="Close Cart">
                {Icons.x("w-4 h-4")}
              </button>
            </div>

            {/* ── MINIMAL PROMO BAR ── */}
            {(() => {
              const TARGET = 3000;
              const isUnlocked = subtotal >= TARGET;
              const remaining = Math.max(0, TARGET - subtotal);
              const pct = Math.min(100, Math.round((subtotal / TARGET) * 100));

              const claimedPromoItem = cart.find(ci => ci.isFreePromo);
              const claimedPromoId = claimedPromoItem?.item.id;

              const getBevImage = (title: string, currentImage?: string) => {
                if (currentImage) return currentImage;
                const t = title.toLowerCase();
                if (t.includes("coca") || t.includes("coke")) return "/Product Images/BV-03.avif";
                if (t.includes("sprite")) return "/Product Images/BV-04.avif";
                if (t.includes("fanta")) return "/Product Images/BV-05.avif";
                if (t.includes("ginger") || t.includes("egb")) return "/Product Images/BV-06.avif";
                if (t.includes("orange")) return "/Product Images/BV-07.avif";
                return null;
              };

              let beverages = menuItems
                .filter(m => m.category === "Beverages" && !m.title.toLowerCase().includes("shake"))
                .map(m => {
                  if (m.title.toLowerCase().includes("water")) {
                    return {
                      ...m,
                      title: "2x Mineral Water Bottles",
                      portion: "2 Bottles (1000 ml each)",
                      description: "2x Chilled Mineral Water Bottles (1000 ml each)."
                    };
                  }
                  return m;
                });

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

              if (!beverages.some(b => b.title.toLowerCase().includes("water"))) {
                beverages.push({
                  id: 9992,
                  title: "2x Mineral Water Bottles",
                  price: 200,
                  category: "Beverages",
                  portion: "2 Bottles (1000 ml each)",
                  description: "2x Chilled Mineral Water Bottles (1000 ml each).",
                  image: ""
                });
              }
              beverages = beverages.slice(0, 6);

              if (!isUnlocked) {
                return (
                  <div className="px-5 py-3.5 border-b border-orange-100 bg-orange-50/70 flex-shrink-0">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-800 mb-1.5">
                      <span className="text-[#F26F21]">Special Offer: Free Beverage on orders Rs 3,000+</span>
                      <span className="text-gray-500 font-semibold text-[11px]">Rs {subtotal.toLocaleString()} / 3,000</span>
                    </div>
                    <p className="text-[11px] text-gray-500 mb-2">
                      Add Rs <span className="font-bold text-gray-900">{remaining.toLocaleString()}</span> more to unlock your free drink
                    </p>
                    <div className="w-full h-2 bg-orange-200/60 rounded-full overflow-hidden">
                      <div className="h-full bg-[#F26F21] rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              }

              return (
                <div className="px-5 py-3.5 border-b border-emerald-200 bg-emerald-50/70 flex-shrink-0">
                  {claimedPromoItem ? (
                    <div className="flex items-center justify-between bg-white border border-emerald-300 rounded-2xl p-3 shadow-sm">
                      <div className="flex items-center gap-3 min-w-0">
                        {getBevImage(claimedPromoItem.item.title, claimedPromoItem.item.image) ? (
                          <img src={getBevImage(claimedPromoItem.item.title, claimedPromoItem.item.image)!}
                            alt={claimedPromoItem.item.title} className="w-10 h-10 rounded-xl object-cover bg-gray-100 flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            💧 2x
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">Special Offer Claimed</p>
                          <p className="text-xs font-bold text-gray-900 truncate">{claimedPromoItem.item.title}</p>
                          <p className="text-[10px] font-bold text-emerald-600">Rs 0 (100% Free)</p>
                        </div>
                      </div>
                      <button onClick={removeFreeDrink}
                        className="text-xs text-gray-500 hover:text-red-500 font-bold ml-2 px-2.5 py-1 bg-gray-100 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
                        Change
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-xs font-black text-emerald-900 uppercase tracking-wide">Special Offer Unlocked!</p>
                          <p className="text-[11px] text-emerald-700 font-medium">Select 1 complimentary beverage (100% Free):</p>
                        </div>
                        <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                          FREE
                        </span>
                      </div>

                      {/* Spacious horizontal list with clear images and full names */}
                      <div className="flex gap-2.5 overflow-x-auto scrollbar-none pb-1 pt-0.5">
                        {beverages.map(bev => {
                          const img = getBevImage(bev.title, bev.image);
                          return (
                            <button key={bev.id}
                              onClick={() => claimFreeDrink(bev)}
                              className="flex-shrink-0 flex items-center gap-2.5 bg-white border border-emerald-300 hover:border-emerald-600 rounded-2xl p-2.5 text-left shadow-sm transition-all active:scale-95 hover:shadow-md">
                              {img ? (
                                <img src={img} alt={bev.title} className="w-10 h-10 rounded-xl object-cover bg-gray-100 flex-shrink-0" />
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex flex-col items-center justify-center font-bold text-[10px] flex-shrink-0">
                                  <span>💧</span>
                                  <span className="text-[8px] leading-none">2x</span>
                                </div>
                              )}
                              <div className="min-w-0 pr-1">
                                <p className="text-xs font-bold text-gray-900 whitespace-nowrap leading-tight">{bev.title}</p>
                                <p className="text-[10px] text-gray-500 font-medium mt-0.5">{bev.portion || "Bottle"}</p>
                                <span className="inline-block mt-1 text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                                  + Claim Free
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── ITEMS LIST ── */}
            <div className="flex-1 overflow-y-auto scrollbar-none px-5 py-2 min-h-0 divide-y divide-neutral-100">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-16">
                  <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center text-2xl text-neutral-400">
                    🛍️
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900 mb-0.5">Your cart is empty</h3>
                    <p className="text-xs text-neutral-400">Add dishes from the menu to start</p>
                  </div>
                  <button onClick={() => setIsCartOpen(false)}
                    className="mt-2 text-xs font-semibold text-neutral-900 bg-neutral-100 hover:bg-neutral-200 px-4 py-2 rounded-full transition-colors">
                    Browse Menu
                  </button>
                </div>
              ) : (
                cart.map(({ item, quantity, isFreePromo }) => (
                  <div key={isFreePromo ? `free-promo-${item.id}` : `cart-item-${item.id}`}
                    className="flex items-center gap-3.5 py-4">
                    
                    {/* Thumbnail */}
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0 border border-neutral-100">
                      {item.image ? (
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-300 text-base">🍽️</div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-neutral-900 leading-snug truncate">
                        {item.title}
                      </h4>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {item.portion || "Standard Portion"}
                      </p>
                      <p className="text-xs font-semibold mt-1">
                        {isFreePromo ? (
                          <span className="text-emerald-600 font-semibold">Free Promo (Rs 0)</span>
                        ) : (
                          <span className="text-neutral-900">Rs {(Number(item.price) * quantity).toLocaleString()}</span>
                        )}
                      </p>
                    </div>

                    {/* Quantity Stepper or Delete */}
                    {isFreePromo ? (
                      <button onClick={removeFreeDrink}
                        className="w-8 h-8 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-red-500 flex items-center justify-center transition-colors"
                        title="Remove free drink">
                        {Icons.trash("w-4 h-4")}
                      </button>
                    ) : (
                      <div className="flex items-center bg-neutral-100 rounded-full p-1 gap-1 flex-shrink-0">
                        <button onClick={() => updateQuantity(item.id, -1, false)}
                          className="w-6 h-6 rounded-full hover:bg-white text-neutral-600 hover:text-neutral-900 flex items-center justify-center transition-all active:scale-90"
                          aria-label="Decrease">
                          {quantity === 1 ? Icons.trash("w-3 h-3 text-red-500") : Icons.minus("w-3 h-3")}
                        </button>
                        <span className="text-xs font-semibold text-neutral-900 w-5 text-center">{quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1, false)}
                          className="w-6 h-6 rounded-full hover:bg-white text-neutral-900 flex items-center justify-center transition-all active:scale-90"
                          aria-label="Increase">
                          {Icons.plus("w-3 h-3")}
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* ── MINIMALIST CHECKOUT FOOTER ── */}
            {cart.length > 0 && (
              <div className="p-5 border-t border-neutral-100 bg-white flex-shrink-0 space-y-3.5">
                {/* Summary */}
                <div className="space-y-1.5 text-xs text-neutral-500">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-neutral-900 font-medium">Rs {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery</span>
                    <span className="text-neutral-400">Via WhatsApp</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-neutral-900 pt-2 border-t border-neutral-100">
                    <span>Total</span>
                    <span className="text-base font-bold text-neutral-900">Rs {subtotal.toLocaleString()}</span>
                  </div>
                </div>

                {/* WhatsApp Button */}
                <button onClick={() => handleCheckout()}
                  className="w-full h-12 rounded-2xl bg-[#0D0D0D] hover:bg-[#262626] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99] shadow-sm">
                  {Icons.wa("w-4 h-4 text-emerald-400")}
                  <span>Order via WhatsApp</span>
                  <span className="text-neutral-400 ml-1">• Rs {subtotal.toLocaleString()}</span>
                </button>

                {/* Subtext */}
                <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-0.5">
                  <span>⚡ Kitchen prep ~20 mins</span>
                  <button onClick={clearCart} className="hover:text-red-500 transition-colors">
                    Clear cart
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

      {/* ── PROMO REMINDER POPUP (WHEN BILLING WITHOUT PROMO) ── */}
      {showPromoReminderModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md anim-fade"
          onClick={() => setShowPromoReminderModal(false)}>
          <div className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-7 anim-slide-up"
            onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-2xl font-bold shadow-sm">
                🎁
              </div>
              <button onClick={() => setShowPromoReminderModal(false)}
                className="w-8 h-8 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-900 flex items-center justify-center transition-colors"
                aria-label="Close">
                {Icons.x("w-4 h-4")}
              </button>
            </div>

            <h3 className="text-xl font-black text-gray-900 leading-tight mb-1.5">
              Claim Your Free Beverage!
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-4">
              Your order is <strong>Rs {subtotal.toLocaleString()}</strong>, which qualifies for a 100% complimentary beverage. Choose your drink below:
            </p>

            {/* Quick selection drink list */}
            <div className="space-y-2 mb-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto scrollbar-none pr-1">
                {[
                  { id: 9992, title: "2x Mineral Water Bottles", portion: "2 Bottles (1000 ml)" },
                  { id: 9991, title: "Elephant House Orange Crush", portion: "1.05L Bottle" },
                  { id: 25, title: "Coca Cola (1050 ml)", portion: "1050 ml" },
                  { id: 27, title: "Sprite (1050 ml)", portion: "1050 ml" },
                  { id: 28, title: "Fanta (1050 ml)", portion: "1050 ml" },
                  { id: 29, title: "Elephant House Ginger Beer", portion: "1050 ml" },
                ].map((bev) => (
                  <button key={bev.id}
                    onClick={() => {
                      claimFreeDrink(bev as any);
                      setShowPromoReminderModal(false);
                      setIsCartOpen(true);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 hover:border-emerald-500 transition-all text-left group active:scale-95 shadow-xs">
                    <div className="min-w-0 pr-1">
                      <p className="text-xs font-bold text-gray-900 truncate">{bev.title}</p>
                      <p className="text-[10px] text-gray-500">{bev.portion}</p>
                    </div>
                    <span className="text-[10px] font-black text-emerald-700 bg-white px-2 py-0.5 rounded-lg border border-emerald-200 flex-shrink-0">
                      + Free
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  setShowPromoReminderModal(false);
                  setIsCartOpen(true);
                }}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl transition-all shadow-md active:scale-98 flex items-center justify-center gap-2">
                Select in Cart Drawer
              </button>

              <button
                onClick={() => handleCheckout(true)}
                className="w-full py-2.5 text-gray-400 hover:text-gray-700 font-bold text-xs transition-colors text-center">
                Proceed to WhatsApp without free drink →
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
