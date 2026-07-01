"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag, 
  History, 
  FolderKanban, 
  Settings as SettingsIcon, 
  LogOut, 
  Lock, 
  Search, 
  Check, 
  Printer, 
  TrendingUp, 
  X,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Info,
  RotateCw,
  Maximize2,
  Image as ImageIcon
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// ============================================================================
// --- TYPES & DATA ---
// ============================================================================

interface MenuItem {
  id: number;
  title: string;
  price: number;
  category: string;
  portion: string;
  image?: string;
  sku?: string;
}

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

interface Order {
  id: string;
  timestamp: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: "Completed" | "Pending";
  type: "Take Away" | "Pick Up" | "Delivery";
}

type ToastType = "success" | "error" | "info" | "warning";

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

const CATEGORIES = ["All Categories", "Fried Rice", "Chopsuey", "Kottu", "Ultimate Bites", "Beverages"];

const INITIAL_MENU_ITEMS: MenuItem[] = [
  // Fried Rice Selection
  { id: 1, title: "Egg Fried Rice", price: 750, category: "Fried Rice", portion: "Full Portion" },
  { id: 2, title: "Classic Chicken Fried Rice", price: 1000, category: "Fried Rice", portion: "Full Portion" },
  { id: 3, title: "Prawns Fried Rice", price: 1100, category: "Fried Rice", portion: "Full Portion" },
  { id: 4, title: "Beef Fried Rice", price: 1200, category: "Fried Rice", portion: "Full Portion" },
  { id: 5, title: "Seafood Fried Rice", price: 1300, category: "Fried Rice", portion: "Full Portion" },
  { id: 6, title: "Surf & Turf Fried Rice", price: 1400, category: "Fried Rice", portion: "Full Portion" },
  { id: 7, title: "Nasi Goreng", price: 1300, category: "Fried Rice", portion: "Full Portion" },

  // Chopsuey Selection
  { id: 8, title: "Chicken Chopsuey Rice", price: 1250, category: "Chopsuey", portion: "Full Portion" },
  { id: 9, title: "Prawn Chopsuey Rice", price: 1350, category: "Chopsuey", portion: "Full Portion" },
  { id: 10, title: "Seafood Chopsuey Rice", price: 1450, category: "Chopsuey", portion: "Full Portion" },
  { id: 11, title: "Surf & Turf Chopsuey Rice", price: 1600, category: "Chopsuey", portion: "Full Portion" },

  // Noodles Selection
  { id: 12, title: "Egg Fried Noodles", price: 750, category: "Noodles", portion: "Full Portion" },
  { id: 13, title: "Chicken Fried Noodles", price: 1000, category: "Noodles", portion: "Full Portion" },
  { id: 14, title: "Prawn Fried Noodles", price: 1100, category: "Noodles", portion: "Full Portion" },
  { id: 15, title: "Beef Fried Noodles", price: 1200, category: "Noodles", portion: "Full Portion" },
  { id: 16, title: "Seafood Fried Noodles", price: 1300, category: "Noodles", portion: "Full Portion" },
  { id: 17, title: "Surf & Turf Fried Noodles", price: 1400, category: "Noodles", portion: "Full Portion" },

  // Kottu Selection
  { id: 18, title: "Egg Kottu", price: 750, category: "Kottu", portion: "Full Portion" },
  { id: 19, title: "Chicken Kottu", price: 1000, category: "Kottu", portion: "Full Portion" },
  { id: 20, title: "Beef Kottu", price: 1200, category: "Kottu", portion: "Full Portion" },
  { id: 21, title: "Seafood Kottu", price: 1300, category: "Kottu", portion: "Full Portion" },
  { id: 22, title: "Surf & Turf Kottu", price: 1400, category: "Kottu", portion: "Full Portion" },
  { id: 23, title: "Fried Chicken Cheese Kottu", price: 1500, category: "Kottu", portion: "Full Portion" },

  // Ultimate Bites
  { id: 24, title: "Sri Lankan Chicken Devilled", price: 1000, category: "Ultimate Bites", portion: "250g" },
  { id: 25, title: "Sri Lankan Fish Devilled", price: 1100, category: "Ultimate Bites", portion: "250g" },
  { id: 26, title: "Sri Lankan Prawn Devilled", price: 1100, category: "Ultimate Bites", portion: "250g" },
  { id: 27, title: "Sri Lankan Beef Devilled", price: 1400, category: "Ultimate Bites", portion: "250g" },
  { id: 28, title: "Sri Lankan Pork Devilled", price: 1300, category: "Ultimate Bites", portion: "250g" },
  { id: 29, title: "Garlic Buttered Vegetable", price: 900, category: "Ultimate Bites", portion: "Regular" },
  { id: 30, title: "French Fries", price: 800, category: "Ultimate Bites", portion: "Regular" },
  { id: 31, title: "Kochi Bite", price: 800, category: "Ultimate Bites", portion: "10 Pcs" },
  { id: 32, title: "Hot Butter Cuttlefish", price: 900, category: "Ultimate Bites", portion: "Regular" },

  // Beverages
  { id: 33, title: "Ice Milo", price: 250, category: "Beverages", portion: "Regular" },
  { id: 34, title: "Milk Shake", price: 350, category: "Beverages", portion: "Regular" },
  { id: 35, title: "Ice Coffee", price: 250, category: "Beverages", portion: "Regular" },
  { id: 36, title: "Mineral Water", price: 100, category: "Beverages", portion: "1 Liter" }
];

// ============================================================================
// --- REUSABLE COMPONENT: LIVE CLOCK ---
// ============================================================================

function LiveClock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () =>
      setTime(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="font-mono text-[10px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap"
      style={{ background: "#0E1628", border: "1px solid #1E2D4E", color: "#F26F21" }}
    >
      {time} • COLOMBO
    </div>
  );
}

// ============================================================================
// --- REUSABLE COMPONENT: MINIMAL MENU CARD ---
// ============================================================================

interface MinimalMenuCardProps {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
}

function MinimalMenuCard({ item, onAdd }: MinimalMenuCardProps) {
  const getCategoryConfig = (category: string): { emoji: string; accent: string; bg: string } => {
    switch (category) {
      case "Kottu":        return { emoji: "🥘", accent: "#EF4444", bg: "rgba(239,68,68,0.08)" };
      case "Ultimate Bites": return { emoji: "🍗", accent: "#A855F7", bg: "rgba(168,85,247,0.08)" };
      case "Fried Rice":   return { emoji: "🍚", accent: "#F59E0B", bg: "rgba(245,158,11,0.08)" };
      case "Chopsuey":     return { emoji: "🥗", accent: "#06B6D4", bg: "rgba(6,182,212,0.08)" };
      case "Beverages":    return { emoji: "🥤", accent: "#3B82F6", bg: "rgba(59,130,246,0.08)" };
      default:             return { emoji: "🍽️", accent: "#10B981", bg: "rgba(16,185,129,0.08)" };
    }
  };

  const cfg = getCategoryConfig(item.category);

  return (
    <div
      onClick={() => onAdd(item)}
      className="group relative bg-[#0E1628] border border-[#1E2D4E] hover:border-[#F26F21]/50 rounded-2xl overflow-hidden flex flex-col cursor-pointer transition-all duration-250 hover:shadow-[0_8px_32px_rgba(242,111,33,0.12)] select-none"
      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}
    >
      {/* Colored accent top-bar */}
      <div className="h-[3px] w-full shrink-0" style={{ background: cfg.accent }} />

      {/* Image / Icon Placeholder */}
      <div
        className="relative w-full flex items-center justify-center shrink-0"
        style={{ height: "120px", background: cfg.bg }}
      >
        {item.image ? (
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <span style={{ fontSize: "3rem", lineHeight: 1 }}>{cfg.emoji}</span>
        )}
        {/* Product ID (SKU) chip */}
        {item.sku && (
          <div
            className="absolute top-2.5 left-2.5 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md"
            style={{ background: "rgba(242,111,33,0.9)", color: "white", backdropFilter: "blur(4px)" }}
          >
            {item.sku}
          </div>
        )}
        {/* Portion chip */}
        <div
          className="absolute bottom-2.5 left-2.5 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
          style={{ background: "rgba(0,0,0,0.6)", color: "rgba(255,255,255,0.75)", backdropFilter: "blur(4px)" }}
        >
          {item.portion}
        </div>
        {/* Add button on hover */}
        <div
          className="absolute bottom-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 scale-75 group-hover:scale-100"
          style={{ background: cfg.accent }}
        >
          <Plus size={15} className="text-white" />
        </div>
      </div>

      {/* Text Details */}
      <div className="px-4 py-4 flex flex-col gap-3 flex-1">
        <h3 className="font-bold text-[12px] text-slate-100 leading-snug line-clamp-2 group-hover:text-[#F26F21] transition-colors duration-150">
          {item.title}
        </h3>
        <div className="flex items-center justify-between mt-auto">
          <span className="text-[15px] font-black font-mono" style={{ color: cfg.accent }}>
            Rs {item.price.toLocaleString()}
          </span>
          <span
            className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-md"
            style={{ background: cfg.bg, color: cfg.accent }}
          >
            {item.category.split(" ")[0]}
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// --- REUSABLE COMPONENT: MINIMAL DATA TABLE ---
// ============================================================================

interface MinimalDataTableProps {
  items: MenuItem[];
  onEdit: (item: MenuItem) => void;
  onDelete: (id: number) => void;
}

function MinimalDataTable({ items, onEdit, onDelete }: MinimalDataTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(items.length / itemsPerPage);
  
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return items.slice(start, start + itemsPerPage);
  }, [items, currentPage]);

  return (
    <div className="space-y-4">
      <div className="bg-[#111625] border border-[#222E4E] rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#222E4E] text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-[#090D1A]">
              <th className="px-5 py-3.5">Product ID (SKU)</th>
              <th className="px-5 py-3.5">Item Name</th>
              <th className="px-5 py-3.5">Category</th>
              <th className="px-5 py-3.5">Portion</th>
              <th className="px-5 py-3.5">Price</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#222E4E] text-xs">
            {paginatedItems.map(item => (
              <tr key={item.id} className="hover:bg-white/[0.01] transition-colors">
                <td className="px-5 py-3 font-mono text-xs font-black text-orange-400">{item.sku || "N/A"}</td>
                <td className="px-5 py-3 font-bold text-slate-200">{item.title}</td>
                <td className="px-5 py-3 text-slate-400">{item.category}</td>
                <td className="px-5 py-3 text-slate-500">{item.portion}</td>
                <td className="px-5 py-3 font-bold text-[#FF6B35]">LKR {item.price.toLocaleString()}</td>
                <td className="px-5 py-3 text-right space-x-2">
                  <button
                    onClick={() => onEdit(item)}
                    className="text-orange-400 hover:text-orange-300 font-bold text-[10px] uppercase"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="text-red-400 hover:text-red-300 font-bold text-[10px] uppercase"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-mono text-slate-500 uppercase">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 bg-[#111625] border border-[#222E4E] rounded-lg text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
            >
              Prev
            </button>
            <button
              onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 bg-[#111625] border border-[#222E4E] rounded-lg text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// --- MAIN PAGE COMPONENT ---
// ============================================================================

export default function PosPage() {
  const router = useRouter();

  // Fullscreen State & Logic
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        triggerToast("Fullscreen access denied", "warning");
      });
    } else {
      document.exitFullscreen().catch(() => {
        triggerToast("Error exiting fullscreen", "error");
      });
    }
  };

  // POS View & Navigation States
  const [activeSidebar, setActiveSidebar] = useState<"new_order" | "order_history" | "menu_management" | "settings">("new_order");
  const [activeCategory, setActiveCategory] = useState("All Categories");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<"Take Away" | "Pick Up" | "Delivery">("Take Away");
  
  // Menu Database State
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemData, setNewItemData] = useState<Partial<MenuItem>>({
    title: "",
    price: 0,
    category: "Fried Rice",
    portion: "Serves Two",
    sku: ""
  });

  // Load menu items from database on mount and subscribe to Realtime updates
  useEffect(() => {
    async function loadMenu() {
      try {
        const res = await fetch("/api/menu");
        if (res.ok) {
          const data = await res.json();
          setMenuItems(data);
        } else {
          triggerToast("Failed to load menu from database", "error");
        }
      } catch (error) {
        triggerToast("Network error loading menu", "error");
      }
    }
    loadMenu();

    // Subscribe to Realtime changes on menu_items table
    const channel = supabase
      .channel("pos-menu-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "menu_items" },
        (payload) => {
          console.log("[Realtime] Menu change detected:", payload);
          loadMenu();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Security Admin PIN State
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");

  // Receipt Modal State
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [latestOrder, setLatestOrder] = useState<Order | null>(null);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);

  // Toast State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const triggerToast = (message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const [isSyncing, setIsSyncing] = useState(false);

  const handlePullFromGoogle = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    triggerToast("Pulling prices from Google...", "info");

    try {
      const res = await fetch("/api/google/sync-menu");
      if (res.ok) {
        const data = await res.json();
        triggerToast(data.message || "Menu synced from Google successfully!", "success");
      } else {
        const err = await res.json();
        triggerToast(`Sync failed: ${err.error || "Unknown error"}`, "error");
      }
    } catch (error) {
      triggerToast("Network error syncing from Google", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Cart Functions
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItem.id === item.id);
      if (existing) {
        return prev.map(i => i.menuItem.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
    triggerToast(`Added ${item.title} to ticket`, "success");
  };

  const updateQuantity = (itemId: number, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.menuItem.id === itemId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (itemId: number) => {
    setCart(prev => prev.filter(item => item.menuItem.id !== itemId));
    triggerToast("Item removed from ticket", "info");
  };

  // Financial Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + tax;

  // Checkout Operations
  const handleCheckout = () => {
    if (cart.length === 0) {
      triggerToast("Ticket is empty", "warning");
      return;
    }
    const newOrder: Order = {
      id: `TCE-${Math.floor(100000 + Math.random() * 900000)}`,
      timestamp: new Date().toLocaleString(),
      items: [...cart],
      subtotal,
      tax,
      total,
      status: "Completed",
      type: orderType
    };
    setLatestOrder(newOrder);
    setShowReceiptModal(true);
  };

  const confirmAndPrintInvoice = () => {
    if (latestOrder) {
      setOrderHistory(prev => [latestOrder, ...prev]);
    }
    setCart([]);
    setShowReceiptModal(false);
    setLatestOrder(null);
    triggerToast("Ticket settled successfully", "success");
  };

  // Sidebar access check
  const handleSidebarClick = (view: "new_order" | "order_history" | "menu_management" | "settings") => {
    if (view === "menu_management") {
      if (isAdminUnlocked) {
        setActiveSidebar("menu_management");
      } else {
        setShowPinModal(true);
        setPinInput("");
        setPinError("");
      }
    } else {
      setActiveSidebar(view);
    }
  };

  const handlePinKeyPress = (num: string) => {
    if (pinInput.length < 4) {
      const newPin = pinInput + num;
      setPinInput(newPin);
      if (newPin.length === 4) {
        setTimeout(() => {
          if (newPin === "1234") {
            setIsAdminUnlocked(true);
            setShowPinModal(false);
            setActiveSidebar("menu_management");
            triggerToast("Admin unlocked", "success");
          } else {
            setPinError("Incorrect PIN");
            setPinInput("");
            triggerToast("Invalid passcode", "error");
          }
        }, 300);
      }
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEdit) {
          setEditingItem(prev => prev ? { ...prev, image: reader.result as string } : null);
        } else {
          setNewItemData(prev => ({ ...prev, image: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // CRUD Operations
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemData.title || !newItemData.price) return;

    try {
      const res = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newItemData.title,
          price: Number(newItemData.price),
          category: newItemData.category || "Fried Rice",
          portion: newItemData.portion || "Serves Two",
          image: newItemData.image,
          sku: newItemData.sku
        })
      });

      if (res.ok) {
        const addedItem = await res.json();
        setMenuItems(prev => [...prev, addedItem]);
        setIsAddingItem(false);
        setNewItemData({ title: "", price: 0, category: "Fried Rice", portion: "Serves Two", sku: "", image: undefined });
        triggerToast("Item added and synced successfully", "success");
      } else {
        const err = await res.json();
        triggerToast(`Failed to add item: ${err.error}`, "error");
      }
    } catch (error) {
      triggerToast("Network error adding item", "error");
    }
  };

  const handleEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      const res = await fetch("/api/menu", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingItem)
      });

      if (res.ok) {
        const updatedItem = await res.json();
        setMenuItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
        setEditingItem(null);
        triggerToast("Item updated and synced successfully", "success");
      } else {
        const err = await res.json();
        triggerToast(`Failed to update item: ${err.error}`, "error");
      }
    } catch (error) {
      triggerToast("Network error updating item", "error");
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm("Delete this menu item?")) return;

    try {
      const res = await fetch(`/api/menu?id=${id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        setMenuItems(prev => prev.filter(item => item.id !== id));
        triggerToast("Item deleted and synced successfully", "info");
      } else {
        const err = await res.json();
        triggerToast(`Failed to delete item: ${err.error}`, "error");
      }
    } catch (error) {
      triggerToast("Network error deleting item", "error");
    }
  };

  // Filters
  const filteredMenuItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === "All Categories" || item.category === activeCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="h-screen w-screen bg-[#060B18] p-3 text-[#F2F4F8] font-sans antialiased selection:bg-[#F26F21] selection:text-white flex overflow-hidden relative">
      
      <style dangerouslySetInnerHTML={{__html: `
        html, body {
          overflow: hidden !important;
          height: 100vh !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        ::-webkit-scrollbar {
          display: none !important;
        }
        * {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `}} />

      {/* Non-blocking Toast Stack */}
      <div className="fixed top-9 right-9 z-50 flex flex-col gap-3 max-w-sm w-full">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`px-4 py-3.5 rounded-xl shadow-2xl flex items-center justify-between gap-3 border transition-all duration-300 ${
              toast.type === "success" 
                ? "bg-emerald-950/80 border-emerald-500/25 text-emerald-200" 
                : toast.type === "error" 
                  ? "bg-red-950/80 border-red-500/25 text-red-200" 
                  : "bg-slate-900/90 border-slate-800 text-slate-200"
            }`}
          >
            <span className="text-xs font-bold">{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="text-slate-400 hover:text-white">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Inner Floating Console Container */}
      <div className="flex-1 h-full flex bg-[#0B1122] rounded-3xl border border-[#1A2640] overflow-hidden" style={{ boxShadow: "0 0 60px rgba(0,0,0,0.5)" }}>
        
        {/* Left Thin Navigation Sidebar */}
        <aside className="w-[80px] bg-[#080E1C] border-r border-[#14203A] flex flex-col justify-between items-center py-8 hidden md:flex shrink-0">
          <div className="flex flex-col items-center gap-10 w-full">
            <div className="w-12 h-12 rounded-full border-2 border-[#F26F21]/30 bg-[#0E1628] flex items-center justify-center p-1.5 overflow-hidden cursor-pointer" style={{ boxShadow: "0 0 20px rgba(242,111,33,0.18)" }}>
              <Image 
                src="/Round Logo.png" 
                alt="T-Cloud Eats Logo" 
                width={44} 
                height={44} 
                className="w-auto h-auto max-w-full max-h-full object-contain"
                priority
              />
            </div>

            <nav className="flex flex-col gap-1 w-full px-2">
              {([
                { key: "new_order",       icon: <ShoppingBag size={19} />, label: "POS" },
                { key: "order_history",   icon: <History size={19} />,     label: "Logs" },
                { key: "menu_management", icon: <FolderKanban size={19} />, label: "Menu" },
                { key: "settings",        icon: <SettingsIcon size={19} />, label: "Conf" },
              ] as { key: typeof activeSidebar; icon: React.ReactNode; label: string }[]).map(({ key, icon, label }) => (
                <button
                  key={key}
                  onClick={() => handleSidebarClick(key)}
                  className="relative w-full flex flex-col items-center justify-center gap-1.5 py-4 rounded-xl transition-all duration-200 cursor-pointer group"
                  style={{
                    background: activeSidebar === key ? "rgba(242,111,33,0.15)" : "transparent",
                    color: activeSidebar === key ? "#F26F21" : "#4B5E82",
                  }}
                >
                  {activeSidebar === key && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full" style={{ background: "#F26F21", boxShadow: "0 0 10px #F26F21" }} />
                  )}
                  <span className="group-hover:text-slate-200 transition-colors" style={{ color: activeSidebar === key ? "#F26F21" : undefined }}>{icon}</span>
                  <span className="text-[7px] font-bold uppercase tracking-widest" style={{ color: activeSidebar === key ? "#F26F21" : "#4B5E82" }}>{label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="flex flex-col gap-3 items-center w-full px-2">
            <button
              onClick={() => router.push("/login")}
              className="w-10 h-10 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer gap-0.5 group"
              style={{ color: "#4B5E82" }}
              title="Logout"
            >
              <LogOut size={17} className="group-hover:text-red-400 transition-colors" />
              <span className="text-[7px] font-bold uppercase tracking-widest group-hover:text-red-400 transition-colors">Exit</span>
            </button>
          </div>
        </aside>

        {/* Main Content Pane */}
        <main className="flex-1 h-full overflow-hidden flex flex-col pb-16 md:pb-0" style={{ background: "#0B1122" }}>
          
          {/* Header */}
          <header className="px-6 py-4 border-b flex items-center justify-between gap-4 shrink-0" style={{ borderColor: "#14203A", background: "#080E1C" }}>
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 rounded-full" style={{ background: "#F26F21" }} />
              <h1 className="text-xs font-black tracking-widest uppercase" style={{ color: "#CBD5E1" }}>
                {activeSidebar === "new_order" && "POS Terminal"}
                {activeSidebar === "order_history" && "Order Logs"}
                {activeSidebar === "menu_management" && "Menu Database"}
                {activeSidebar === "settings" && "Settings"}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              {activeSidebar === "new_order" && (
                <div className="relative w-64">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10 transition-colors duration-200"
                    size={14}
                    style={{ color: "#4B5E82" }}
                  />
                  <input
                    type="text"
                    placeholder="Search dishes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-xs text-white outline-none rounded-xl transition-all duration-300"
                    style={{
                      background: "#0E1628",
                      border: "1px solid #1E2D4E",
                      color: "#F2F4F8",
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = "rgba(242,111,33,0.5)";
                      e.target.previousElementSibling && ((e.target.previousElementSibling as HTMLElement).style.color = "#F26F21");
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = "#1E2D4E";
                      e.target.previousElementSibling && ((e.target.previousElementSibling as HTMLElement).style.color = "#4B5E82");
                    }}
                  />
                </div>
              )}

              {/* Live Clock */}
              <LiveClock />

              {/* Refresh */}
              <button
                onClick={() => triggerToast("Dashboard refreshed", "info")}
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                style={{ background: "#0E1628", border: "1px solid #1E2D4E", color: "#4B5E82" }}
              >
                <RotateCw size={14} />
              </button>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                style={{ background: "#0E1628", border: "1px solid #1E2D4E", color: "#94A3B8" }}
              >
                <Maximize2 size={13} />
                <span>{isFullscreen ? "Exit FS" : "Full Screen"}</span>
              </button>
            </div>
          </header>

          {/* Category Bar */}
          {activeSidebar === "new_order" && (
            <div className="px-6 py-4 flex gap-3 overflow-x-auto shrink-0" style={{ borderBottom: "1px solid #14203A", background: "#080E1C" }}>
              {CATEGORIES.map(category => {
                const isActive = activeCategory === category;
                return (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className="flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 font-bold text-[11px] uppercase tracking-wider rounded-xl px-5 py-2.5 transition-all duration-200"
                    style={{
                      background: isActive ? "rgba(242,111,33,0.18)" : "rgba(14,22,40,0.8)",
                      color: isActive ? "#F26F21" : "#4B5E82",
                      border: `1px solid ${isActive ? "rgba(242,111,33,0.35)" : "#1E2D4E"}`,
                    }}
                  >
                    {category === "All Categories" && <span>⊞</span>}
                    {category === "Fried Rice" && <span>🍚</span>}
                    {category === "Chopsuey" && <span>🥗</span>}
                    {category === "Kottu" && <span>🥘</span>}
                    {category === "Ultimate Bites" && <span>🍗</span>}
                    {category === "Beverages" && <span>🥤</span>}
                    {category}
                  </button>
                );
              })}
            </div>
          )}

          {/* Grid Content */}
          <div className="flex-1 overflow-y-auto p-6">
            
            {activeSidebar === "new_order" && (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(185px,1fr))] gap-4 pb-16">
                {filteredMenuItems.map(item => (
                  <MinimalMenuCard
                    key={item.id}
                    item={item}
                    onAdd={addToCart}
                  />
                ))}
              </div>
            )}

            {activeSidebar === "order_history" && (
              <div className="space-y-6">
                <div className="bg-[#111625] border border-[#222E4E] rounded-2xl p-5">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
                    <TrendingUp size={14} className="text-[#FF6B35]" />
                    Sales Summary
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-[#090D1A] p-4 rounded-xl border border-[#222E4E]">
                      <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Total Orders</p>
                      <p className="text-lg font-black mt-1 text-slate-200">{orderHistory.length + 3}</p>
                    </div>
                    <div className="bg-[#090D1A] p-4 rounded-xl border border-[#222E4E]">
                      <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Gross Revenue</p>
                      <p className="text-lg font-black mt-1 text-emerald-400 font-mono">
                        LKR {(orderHistory.reduce((sum, o) => sum + o.total, 0) + 4140).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-[#090D1A] p-4 rounded-xl border border-[#222E4E]">
                      <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Average Ticket</p>
                      <p className="text-lg font-black mt-1 text-slate-200 font-mono">
                        LKR {Math.round((orderHistory.reduce((sum, o) => sum + o.total, 0) + 4140) / (orderHistory.length + 3)).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSidebar === "menu_management" && isAdminUnlocked && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300">System Menu Database</h3>
                  {!isAddingItem && (
                    <button
                      onClick={() => setIsAddingItem(true)}
                      className="bg-[#FF6B35] hover:bg-orange-600 text-white font-bold text-xs py-2 px-4 rounded-xl transition-all cursor-pointer"
                    >
                      + Add New Item
                    </button>
                  )}
                </div>

                {isAddingItem && (
                  <form onSubmit={handleAddItem} className="bg-[#111625] border border-[#222E4E] p-5 rounded-2xl space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                      <input
                        type="text"
                        placeholder="Product ID (SKU)"
                        value={newItemData.sku || ""}
                        onChange={e => setNewItemData(prev => ({ ...prev, sku: e.target.value }))}
                        className="bg-[#090D1A] border border-[#222E4E] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FF6B35]"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Item Title"
                        value={newItemData.title}
                        onChange={e => setNewItemData(prev => ({ ...prev, title: e.target.value }))}
                        className="bg-[#090D1A] border border-[#222E4E] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FF6B35]"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        value={newItemData.price || ""}
                        onChange={e => setNewItemData(prev => ({ ...prev, price: Number(e.target.value) }))}
                        className="bg-[#090D1A] border border-[#222E4E] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FF6B35]"
                        required
                      />
                      <select
                        value={newItemData.category}
                        onChange={e => setNewItemData(prev => ({ ...prev, category: e.target.value }))}
                        className="bg-[#090D1A] border border-[#222E4E] rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
                      >
                        {CATEGORIES.filter(c => c !== "All Categories").map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Portion"
                        value={newItemData.portion}
                        onChange={e => setNewItemData(prev => ({ ...prev, portion: e.target.value }))}
                        className="bg-[#090D1A] border border-[#222E4E] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FF6B35]"
                      />
                      <div className="relative bg-[#090D1A] border border-[#222E4E] rounded-xl px-3 py-2 text-xs text-slate-400 flex items-center justify-between">
                        <span className="truncate">{newItemData.image ? "Photo Loaded" : "Upload Photo"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => handleImageChange(e, false)}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="bg-emerald-500 text-white font-bold text-xs py-2 px-4 rounded-lg">Save</button>
                      {newItemData.image && (
                        <button
                          type="button"
                          onClick={() => setNewItemData(prev => ({ ...prev, image: undefined }))}
                          className="bg-red-500/10 text-red-400 border border-red-500/20 font-bold text-xs py-2 px-4 rounded-lg hover:bg-red-500/20 cursor-pointer"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                  </form>
                )}

                {/* Edit Form with Photo Option */}
                {editingItem && (
                  <form onSubmit={handleEditItem} className="bg-[#111625] border border-blue-500/25 p-5 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-[#222E4E] pb-2">
                      <h4 className="font-bold text-xs text-blue-400 uppercase tracking-wider">Edit Menu Item</h4>
                      <button type="button" onClick={() => setEditingItem(null)} className="text-xs text-slate-400 hover:text-white cursor-pointer">Cancel</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                      <input
                        type="text"
                        placeholder="Product ID (SKU)"
                        value={editingItem.sku || ""}
                        onChange={e => setEditingItem(prev => prev ? { ...prev, sku: e.target.value } : null)}
                        className="bg-[#090D1A] border border-[#222E4E] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Item Title"
                        value={editingItem.title}
                        onChange={e => setEditingItem(prev => prev ? { ...prev, title: e.target.value } : null)}
                        className="bg-[#090D1A] border border-[#222E4E] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        value={editingItem.price}
                        onChange={e => setEditingItem(prev => prev ? { ...prev, price: Number(e.target.value) } : null)}
                        className="bg-[#090D1A] border border-[#222E4E] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                        required
                      />
                      <select
                        value={editingItem.category}
                        onChange={e => setEditingItem(prev => prev ? { ...prev, category: e.target.value } : null)}
                        className="bg-[#090D1A] border border-[#222E4E] rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
                      >
                        {CATEGORIES.filter(c => c !== "All Categories").map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Portion"
                        value={editingItem.portion}
                        onChange={e => setEditingItem(prev => prev ? { ...prev, portion: e.target.value } : null)}
                        className="bg-[#090D1A] border border-[#222E4E] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                      />
                      <div className="relative bg-[#090D1A] border border-[#222E4E] rounded-xl px-3 py-2 text-xs text-slate-400 flex items-center justify-between">
                        <span className="truncate">{editingItem.image ? "Photo Loaded" : "Upload Photo"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => handleImageChange(e, true)}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="bg-blue-500 text-white font-bold text-xs py-2 px-4 rounded-lg">Update</button>
                      {editingItem.image && (
                        <button
                          type="button"
                          onClick={() => setEditingItem(prev => prev ? { ...prev, image: undefined } : null)}
                          className="bg-red-500/10 text-red-400 border border-red-500/20 font-bold text-xs py-2 px-4 rounded-lg hover:bg-red-500/20 cursor-pointer"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                  </form>
                )}

                <MinimalDataTable
                  items={menuItems}
                  onEdit={setEditingItem}
                  onDelete={handleDeleteItem}
                />
              </div>
            )}

            {activeSidebar === "settings" && (
              <div className="space-y-6 max-w-4xl">
                <div className="bg-[#111625] border border-[#222E4E] rounded-2xl p-6 space-y-6">
                  
                  {/* POS Configuration Section */}
                  <div className="space-y-4">
                    <h3 className="font-extrabold text-xs text-slate-100 uppercase tracking-wider">POS Configuration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      
                      <div className="space-y-1.5">
                        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Printer Connection</label>
                        <select className="w-full bg-[#090D1A] border border-[#222E4E] rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-[#FF6B35]/60 cursor-pointer">
                          <option>PRINTER-USB-01 (Default Receipt)</option>
                          <option>PRINTER-WIFI-02 (Kitchen Display)</option>
                          <option>Virtual PDF Printer</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Tax Rate (%)</label>
                        <input
                          type="number"
                          defaultValue="10"
                          className="w-full bg-[#090D1A] border border-[#222E4E] rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-[#FF6B35]/60"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Currency Unit</label>
                        <input
                          type="text"
                          defaultValue="LKR"
                          className="w-full bg-[#090D1A] border border-[#222E4E] rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-[#FF6B35]/60"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Kitchen Mode</label>
                        <select className="w-full bg-[#090D1A] border border-[#222E4E] rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-[#FF6B35]/60 cursor-pointer">
                          <option>Auto-print on checkout</option>
                          <option>Manual confirmation</option>
                        </select>
                      </div>

                    </div>
                  </div>

                  {/* Security Settings Section */}
                  <div className="border-t border-[#222E4E] pt-6 space-y-4">
                    <h3 className="font-extrabold text-xs text-red-400 uppercase tracking-wider">Security Settings</h3>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-xs font-bold text-slate-300">Admin Panel Access</h4>
                        <p className="text-[10px] text-slate-500 mt-1">Requires 4-digit security PIN passcode to unlock menu database</p>
                      </div>
                      <button
                        onClick={() => {
                          setIsAdminUnlocked(false);
                          triggerToast("Admin session locked", "info");
                        }}
                        disabled={!isAdminUnlocked}
                        className="bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-red-500/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        Lock Admin Session
                      </button>
                    </div>
                  </div>

                  {/* Google Menu Integration Section */}
                  <div className="border-t border-[#222E4E] pt-6 space-y-4">
                    <h3 className="font-extrabold text-xs text-orange-400 uppercase tracking-wider">Google Menu Integration</h3>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-xs font-bold text-slate-300">Synchronize Prices</h4>
                        <p className="text-[10px] text-slate-500 mt-1">Pull the latest menu prices from your Google Business Profile and update the website and POS</p>
                      </div>
                      <button
                        onClick={handlePullFromGoogle}
                        disabled={isSyncing}
                        className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-orange-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <RotateCw size={12} className={isSyncing ? "animate-spin" : ""} />
                        {isSyncing ? "Syncing..." : "Pull from Google"}
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            )}

          </div>
        </main>

        {/* Right Cart Panel */}
        <aside className="w-[340px] flex flex-col h-full shrink-0" style={{ background: "#080E1C", borderLeft: "1px solid #14203A" }}>
          <div className="flex flex-col h-full">
            
            {/* Ticket Header */}
            <div className="px-4 py-3.5 flex items-center justify-between shrink-0" style={{ borderBottom: "1px solid #14203A" }}>
              <div className="flex items-center gap-2">
                <ShoppingBag size={15} style={{ color: "#F26F21" }} />
                <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: "#CBD5E1" }}>Active Ticket</span>
              </div>
              <select
                value={orderType}
                onChange={(e) => setOrderType(e.target.value as any)}
                className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full outline-none cursor-pointer border transition-all duration-200"
                style={{
                  background: orderType === "Take Away" 
                    ? "rgba(245,158,11,0.12)" 
                    : orderType === "Pick Up" 
                      ? "rgba(168,85,247,0.12)" 
                      : "rgba(59,130,246,0.12)",
                  borderColor: orderType === "Take Away" 
                    ? "rgba(245,158,11,0.25)" 
                    : orderType === "Pick Up" 
                      ? "rgba(168,85,247,0.25)" 
                      : "rgba(59,130,246,0.25)",
                  color: orderType === "Take Away" 
                    ? "#F59E0B" 
                    : orderType === "Pick Up" 
                      ? "#A855F7" 
                      : "#3B82F6",
                }}
              >
                <option value="Take Away" style={{ background: "#080E1C", color: "#F59E0B" }}>Take Away</option>
                <option value="Pick Up" style={{ background: "#080E1C", color: "#A855F7" }}>Pick Up</option>
                <option value="Delivery" style={{ background: "#080E1C", color: "#3B82F6" }}>Delivery</option>
              </select>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {cart.map((item) => (
                <div
                  key={item.menuItem.id}
                  className="rounded-xl p-3 flex gap-2 items-start"
                  style={{ background: "#0E1628", border: "1px solid #1A2640" }}
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-[11px] leading-snug" style={{ color: "#CBD5E1" }}>{item.menuItem.title}</h4>
                    <p className="text-[10px] mt-0.5 font-mono" style={{ color: "#4B5E82" }}>
                      {item.quantity} × Rs {item.menuItem.price.toLocaleString()}
                    </p>
                    <p className="text-[10px] font-bold font-mono mt-0.5" style={{ color: "#F26F21" }}>
                      Rs {(item.quantity * item.menuItem.price).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <button onClick={() => removeFromCart(item.menuItem.id)} className="cursor-pointer p-0.5 rounded" style={{ color: "#2A3A5A" }}>
                      <X size={12} className="hover:text-red-400 transition-colors" />
                    </button>
                    <div className="flex items-center gap-1 rounded-lg overflow-hidden" style={{ border: "1px solid #1E2D4E" }}>
                      <button
                        onClick={() => updateQuantity(item.menuItem.id, -1)}
                        className="w-6 h-6 flex items-center justify-center cursor-pointer transition-colors"
                        style={{ background: "#14203A", color: "#6B7BA4" }}
                      >
                        <Minus size={9} />
                      </button>
                      <span className="text-[11px] font-black font-mono w-5 text-center" style={{ color: "#F2F4F8" }}>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.menuItem.id, 1)}
                        className="w-6 h-6 flex items-center justify-center cursor-pointer transition-colors"
                        style={{ background: "rgba(242,111,33,0.15)", color: "#F26F21" }}
                      >
                        <Plus size={9} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {cart.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center" style={{ opacity: 0.35 }}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: "#0E1628", border: "1px solid #1E2D4E" }}>
                    <ShoppingBag size={22} style={{ color: "#4B5E82" }} />
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#4B5E82" }}>Ticket Empty</p>
                  <p className="text-[10px] mt-1" style={{ color: "#2A3A5A" }}>Tap a menu item to add</p>
                </div>
              )}
            </div>

            {/* Totals & Pay Button */}
            <div className="p-4 shrink-0 space-y-3" style={{ borderTop: "1px solid #14203A", background: "#060B18" }}>
              <div className="rounded-xl p-4 space-y-2.5" style={{ background: "#0E1628", border: "1px solid #1A2640" }}>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#4B5E82" }}>Subtotal</span>
                  <span className="text-[11px] font-bold font-mono" style={{ color: "#94A3B8" }}>Rs {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#4B5E82" }}>Srv. Charge (10%)</span>
                  <span className="text-[11px] font-bold font-mono" style={{ color: "#94A3B8" }}>Rs {tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-2" style={{ borderTop: "1px solid #1A2640" }}>
                  <span className="text-[11px] font-black uppercase tracking-wider" style={{ color: "#F2F4F8" }}>Total</span>
                  <span className="text-xl font-black font-mono" style={{ color: "#F26F21" }}>Rs {total.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="w-full font-black py-3.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-[11px] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-widest"
                style={{
                  background: cart.length === 0 ? "#0E1628" : "linear-gradient(135deg, #00C896, #00A87A)",
                  color: cart.length === 0 ? "#2A3A5A" : "white",
                  boxShadow: cart.length > 0 ? "0 4px 24px rgba(0,200,150,0.3)" : "none",
                }}
              >
                <Check size={14} />
                <span>Settle & Pay</span>
              </button>
            </div>

          </div>
        </aside>
      </div>

      {/* PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-[#050814]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111625] border border-[#222E4E] rounded-2xl p-6 max-w-sm w-full text-center space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-wider">Enter PIN</h3>
            <div className="flex justify-center gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`w-8 h-8 rounded border flex items-center justify-center font-mono ${pinInput.length > i ? "border-[#FF6B35] bg-[#FF6B35]/10 text-white" : "border-[#222E4E]"}`}>
                  {pinInput.length > i ? "•" : ""}
                </div>
              ))}
            </div>
            {pinError && <p className="text-red-400 text-xs">{pinError}</p>}
            <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "Clear", "0", "Close"].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    if (val === "Clear") setPinInput("");
                    else if (val === "Close") setShowPinModal(false);
                    else handlePinKeyPress(val);
                  }}
                  className="bg-[#090D1A] border border-[#222E4E] text-white py-2 rounded font-bold text-xs cursor-pointer"
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Invoice Receipt Modal */}
      {showReceiptModal && latestOrder && (
        <div className="fixed inset-0 bg-[#050814]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white text-slate-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 font-mono text-xs">
            <div className="text-center border-b border-dashed border-slate-300 pb-3">
              <h3 className="font-black text-sm uppercase">T-Cloud Eats</h3>
              <p className="text-[10px] text-slate-500">Order: {latestOrder.id}</p>
              <div className="mt-1.5 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider inline-block"
                style={{
                  background: latestOrder.type === "Take Away" ? "rgba(245,158,11,0.1)" : latestOrder.type === "Pick Up" ? "rgba(168,85,247,0.1)" : "rgba(59,130,246,0.1)",
                  color: latestOrder.type === "Take Away" ? "#D97706" : latestOrder.type === "Pick Up" ? "#7C3AED" : "#2563EB",
                  border: `1px solid ${latestOrder.type === "Take Away" ? "rgba(245,158,11,0.2)" : latestOrder.type === "Pick Up" ? "rgba(168,85,247,0.2)" : "rgba(59,130,246,0.2)"}`
                }}
              >
                {latestOrder.type} — {
                  latestOrder.type === "Take Away" 
                    ? "Customer Collect" 
                    : latestOrder.type === "Pick Up" 
                      ? "Uber/PickMe Rider" 
                      : "t-cloud eats Rider"
                }
              </div>
            </div>
            <div className="space-y-2 border-b border-dashed border-slate-300 pb-3">
              {latestOrder.items.map(item => (
                <div key={item.menuItem.id} className="flex justify-between">
                  <span>{item.menuItem.title} x{item.quantity}</span>
                  <span>Rs {(item.menuItem.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-black text-sm">
              <span>Total Settle</span>
              <span>Rs {latestOrder.total.toLocaleString()}</span>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <button onClick={confirmAndPrintInvoice} className="w-full bg-[#00A86B] text-white font-bold py-3 rounded-xl cursor-pointer">
                Settle &amp; Print Receipt
              </button>
              <button onClick={() => setShowReceiptModal(false)} className="w-full bg-slate-100 text-slate-600 py-2 rounded-xl cursor-pointer">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
