"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
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
}

type ToastType = "success" | "error" | "info" | "warning";

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

const CATEGORIES = ["All Categories", "Fried Rice", "Chopsuey", "Noodles", "Kottu", "Ultimate Bites", "Beverages"];

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
// --- REUSABLE COMPONENT: MINIMAL MENU CARD ---
// ============================================================================

interface MinimalMenuCardProps {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
}

function MinimalMenuCard({ item, onAdd }: MinimalMenuCardProps) {
  return (
    <div
      onClick={() => onAdd(item)}
      className="bg-[#111625] border border-[#222E4E] hover:border-[#FF6B35]/60 rounded-xl p-3 flex justify-between gap-2.5 h-[95px] cursor-pointer transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 select-none"
    >
      {/* Left side: Text Details */}
      <div className="flex flex-col justify-between flex-1 min-w-0">
        <div>
          <h3 className="font-extrabold text-xs text-slate-100 leading-tight tracking-wide line-clamp-2">
            {item.title}
          </h3>
          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mt-1 block">
            {item.portion}
          </span>
        </div>

        <div className="flex justify-between items-center mt-1">
          <span className="text-xs font-black text-[#FF6B35] font-mono">
            LKR {item.price.toLocaleString()}
          </span>
          <span className="text-[9px] font-mono font-bold text-slate-600">
            #{item.id}
          </span>
        </div>
      </div>

      {/* Right side: Optional Thumbnail */}
      {item.image && (
        <div className="w-14 h-14 rounded-xl border border-[#222E4E] overflow-hidden shrink-0 self-center">
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
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
              <th className="px-5 py-3.5">ID</th>
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
                <td className="px-5 py-3 font-mono text-[10px] text-slate-500">{item.id}</td>
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
  
  // Menu Database State
  const [menuItems, setMenuItems] = useState<MenuItem[]>(INITIAL_MENU_ITEMS);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemData, setNewItemData] = useState<Partial<MenuItem>>({
    title: "",
    price: 0,
    category: "Fried Rice",
    portion: "Full Portion"
  });

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
      status: "Completed"
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
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemData.title || !newItemData.price) return;
    const newItem: MenuItem = {
      id: Math.max(...menuItems.map(i => i.id)) + 1,
      title: newItemData.title,
      price: Number(newItemData.price),
      category: newItemData.category || "Fried Rice",
      portion: newItemData.portion || "Full Portion",
      image: newItemData.image
    };
    setMenuItems(prev => [...prev, newItem]);
    setIsAddingItem(false);
    setNewItemData({ title: "", price: 0, category: "Fried Rice", portion: "Full Portion", image: undefined });
    triggerToast("Item added to database", "success");
  };

  const handleEditItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setMenuItems(prev => prev.map(item => item.id === editingItem.id ? editingItem : item));
    setEditingItem(null);
    triggerToast("Item updated successfully", "success");
  };

  const handleDeleteItem = (id: number) => {
    if (confirm("Delete this menu item?")) {
      setMenuItems(prev => prev.filter(item => item.id !== id));
      triggerToast("Item deleted", "info");
    }
  };

  // Filters
  const filteredMenuItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === "All Categories" || item.category === activeCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#050814] text-[#F8F9FA] font-sans antialiased selection:bg-[#FF6B35] selection:text-white">
      
      <style dangerouslySetInnerHTML={{__html: `
        ::-webkit-scrollbar {
          display: none !important;
        }
        * {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `}} />

      {/* Non-blocking Toast Stack */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full">
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

      <div className="h-screen w-screen flex overflow-hidden">
        
        {/* Left Thin Navigation Sidebar */}
        <aside className="w-[7%] bg-[#080D1A] border-r border-[#1B253F] flex flex-col justify-between items-center py-8 hidden md:flex shrink-0">
          <div className="flex flex-col items-center gap-12 w-full">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/25 cursor-pointer">
              <span className="text-xl font-black text-white italic">T</span>
            </div>

            <nav className="flex flex-col gap-5.5 w-full px-2.5">
              <button
                onClick={() => handleSidebarClick("new_order")}
                className={`w-full aspect-square flex flex-col items-center justify-center rounded-xl transition-all duration-200 cursor-pointer ${
                  activeSidebar === "new_order" 
                    ? "bg-[#FF6B35] text-white" 
                    : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
                }`}
              >
                <ShoppingBag size={20} />
                <span className="text-[8px] font-bold mt-1.5 uppercase tracking-wider">POS</span>
              </button>

              <button
                onClick={() => handleSidebarClick("order_history")}
                className={`w-full aspect-square flex flex-col items-center justify-center rounded-xl transition-all duration-200 cursor-pointer ${
                  activeSidebar === "order_history" 
                    ? "bg-[#FF6B35] text-white" 
                    : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
                }`}
              >
                <History size={20} />
                <span className="text-[8px] font-bold mt-1.5 uppercase tracking-wider">Logs</span>
              </button>

              <button
                onClick={() => handleSidebarClick("menu_management")}
                className={`w-full aspect-square flex flex-col items-center justify-center rounded-xl transition-all duration-200 cursor-pointer ${
                  activeSidebar === "menu_management" 
                    ? "bg-[#FF6B35] text-white" 
                    : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
                }`}
              >
                <FolderKanban size={20} />
                <span className="text-[8px] font-bold mt-1.5 uppercase tracking-wider">Menu</span>
              </button>

              <button
                onClick={() => handleSidebarClick("settings")}
                className={`w-full aspect-square flex flex-col items-center justify-center rounded-xl transition-all duration-200 cursor-pointer ${
                  activeSidebar === "settings" 
                    ? "bg-[#FF6B35] text-white" 
                    : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
                }`}
              >
                <SettingsIcon size={20} />
                <span className="text-[8px] font-bold mt-1.5 uppercase tracking-wider">Conf</span>
              </button>
            </nav>
          </div>

          <div className="flex flex-col gap-4 items-center w-full px-2">
            <button onClick={() => router.push("/login")} className="w-10 h-10 flex items-center justify-center rounded-xl text-red-500/70 hover:bg-red-500/10 transition-all cursor-pointer">
              <LogOut size={18} />
            </button>
          </div>
        </aside>

        {/* Main Content Pane (Center - 63% width) */}
        <main className="w-[63%] h-full overflow-hidden flex flex-col pb-16 md:pb-0 bg-[#0A0F1D]">
          
          {/* Header Layout: Brand status, Search, Clock, Actions */}
          <header className="px-6 py-4.5 border-b border-[#1B253F] bg-[#0A0F1D] flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3">
              <h1 className="text-xs font-black tracking-wider uppercase text-slate-200">
                {activeSidebar === "new_order" && "POS Terminal"}
                {activeSidebar === "order_history" && "Order Logs"}
                {activeSidebar === "menu_management" && "Menu Database"}
                {activeSidebar === "settings" && "Settings"}
              </h1>
            </div>

            {/* Right side: Search, Clock, Refresh, Fullscreen */}
            <div className="flex items-center gap-3">
              {activeSidebar === "new_order" && (
                <div className="relative w-44">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={13} />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#111625] border border-[#222E4E] rounded-xl pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF6B35]/60 placeholder:text-slate-600"
                  />
                </div>
              )}

              {/* Minimal Colombo Time widget */}
              <div className="bg-[#111625] text-[#FF6B35] font-mono text-[10px] font-bold px-3.5 py-2 rounded-full border border-[#222E4E] tracking-wider whitespace-nowrap">
                {new Date().toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' })} • COLOMBO
              </div>

              {/* Refresh Action */}
              <button 
                onClick={() => triggerToast("Dashboard refreshed", "info")}
                className="w-9 h-9 rounded-full border border-[#222E4E] hover:border-slate-500 flex items-center justify-center text-slate-400 hover:text-white transition-all bg-[#111625] cursor-pointer"
              >
                <RotateCw size={14} />
              </button>

              {/* Fullscreen Toggle Button */}
              <button 
                onClick={toggleFullscreen}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#222E4E] bg-[#111625] hover:bg-white/5 text-xs font-bold text-slate-200 transition-all cursor-pointer"
              >
                <Maximize2 size={13} />
                <span>{isFullscreen ? "Exit FS" : "Full Screen"}</span>
              </button>
            </div>
          </header>

          {/* Category Bar: Separate row with breathing space */}
          {activeSidebar === "new_order" && (
            <div className="px-6 py-3.5 border-b border-[#1B253F] bg-[#090D1A]/40 flex gap-3 overflow-x-auto scrollbar-none shrink-0">
              {CATEGORIES.map(category => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-5 py-2 rounded-xl font-bold text-[11px] tracking-wide transition-all border whitespace-nowrap cursor-pointer shrink-0 ${
                    activeCategory === category 
                      ? "bg-white text-slate-950 border-transparent shadow-md" 
                      : "bg-[#1C233D] text-slate-200 border-[#2E3B5E] hover:text-white hover:bg-[#252E4E]"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          )}

          {/* Grid Content */}
          <div className="flex-1 overflow-y-auto p-6">
            
            {activeSidebar === "new_order" && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              <div className="bg-[#111625] border border-[#222E4E] rounded-2xl p-6 space-y-4">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300">Settings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Printer</label>
                    <select className="w-full bg-[#090D1A] border border-[#222E4E] rounded-xl px-3 py-2 text-xs text-white outline-none">
                      <option>Default Receipt Printer</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>

        {/* Right Active Ticket / Cart Panel (Right - 30% width) */}
        <aside className="w-[30%] bg-[#090D1A] border-l border-[#1B253F] flex flex-col justify-between h-full shrink-0">
          <div className="flex flex-col h-full w-full justify-between">
            
            {/* Ticket Header */}
            <div className="h-20 border-b border-[#1B253F] px-5 flex items-center justify-between shrink-0 bg-[#090D1A]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-slate-100 uppercase tracking-wider">Active Ticket</span>
                <span className="text-[10px] bg-[#111625] border border-[#222E4E] px-2 py-0.5 rounded text-slate-300 font-mono font-bold">R1</span>
              </div>
              <div className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-emerald-400 font-bold uppercase tracking-wider">
                Dine In
              </div>
            </div>

            {/* Ticket Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {cart.map((item) => (
                <div 
                  key={item.menuItem.id} 
                  className="bg-[#111625]/60 border border-[#222E4E]/60 rounded-xl p-3 flex gap-3 items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-slate-200 truncate">{item.menuItem.title}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {item.quantity} x LKR {item.menuItem.price.toLocaleString()}
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.menuItem.id, -1)}
                      className="w-6 h-6 bg-[#111625] hover:bg-slate-800 text-slate-300 rounded flex items-center justify-center cursor-pointer border border-[#222E4E]"
                    >
                      <Minus size={10} />
                    </button>
                    <span className="text-xs font-mono font-bold text-white w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.menuItem.id, 1)}
                      className="w-6 h-6 bg-[#111625] hover:bg-slate-800 text-slate-300 rounded flex items-center justify-center cursor-pointer border border-[#222E4E]"
                    >
                      <Plus size={10} />
                    </button>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeFromCart(item.menuItem.id)}
                    className="text-slate-600 hover:text-red-400 p-1 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}

              {cart.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center py-24 text-center opacity-40">
                  <ShoppingBag size={24} className="text-slate-600 mb-2" />
                  <p className="text-xs font-bold text-slate-500">Ticket is Empty</p>
                </div>
              )}
            </div>

            {/* Calculations & settle button exactly matching the screenshot */}
            <div className="border-t border-[#1B253F] p-5 bg-[#090D1A] space-y-4 shrink-0">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <span>Subtotal</span>
                  <span className="font-mono text-slate-300">Rs {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <span>Srv. Chg (10%)</span>
                  <span className="font-mono text-slate-300">Rs {tax.toLocaleString()}</span>
                </div>
                <div className="border-t border-[#1B253F] pt-3 flex justify-between items-center font-black text-white">
                  <span className="text-sm">Total</span>
                  <span className="text-lg font-bold font-mono">Rs {total.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="w-full bg-[#00A86B] hover:bg-emerald-600 text-white font-black py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wider"
              >
                <span>Pay Bill / Settle</span>
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
