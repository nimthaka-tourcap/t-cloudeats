"use client";

import { useState, useMemo } from "react";
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
  Soup, 
  Coffee, 
  Flame, 
  Utensils, 
  Award
} from "lucide-react";

// ============================================================================
// --- DESIGN SYSTEM & TYPES ---
// ============================================================================

interface MenuItem {
  id: number;
  title: string;
  price: number;
  category: string;
  imageColor: string;
  portion: string;
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

const CATEGORIES = ["All", "Fried Rice", "Chopsuey", "Noodles", "Kottu", "Ultimate Bites", "Beverages"];

// ============================================================================
// --- REUSABLE SUB-COMPONENTS ---
// ============================================================================

/**
 * 1. Reusable FormInput Component with Floating Label Pattern
 */
interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

function FormInput({ label, error, id, value, onChange, ...props }: FormInputProps) {
  const [focused, setFocused] = useState(false);
  const isFilled = value !== undefined && value !== null && value !== "" && String(value).length > 0;

  return (
    <div className="relative w-full mb-5">
      <div className={`relative rounded-2xl transition-all duration-200 bg-[#0D1224] border ${
        error 
          ? "border-red-500/50 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500/20" 
          : focused 
            ? "border-[#FF6B35] ring-1 ring-[#FF6B35]/20" 
            : "border-slate-800 hover:border-slate-700"
      }`}>
        <input
          id={id}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full px-4 pt-6 pb-2 text-sm text-[#F8F9FA] bg-transparent outline-none transition-all placeholder-transparent"
          {...props}
        />
        <label
          htmlFor={id}
          className={`absolute left-4 top-4 text-xs font-semibold text-slate-500 transition-all duration-200 pointer-events-none origin-left ${
            focused || isFilled 
              ? "transform -translate-y-2.5 scale-90 text-[#FF6B35]" 
              : ""
          }`}
        >
          {label}
        </label>
      </div>
      {error && (
        <span className="text-[10px] font-bold text-red-400 mt-1 block pl-2 uppercase tracking-wider">
          {error}
        </span>
      )}
    </div>
  );
}

/**
 * 2. Reusable MenuCard Component for Ordering Catalog
 */
interface MenuCardProps {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "Fried Rice":
      return <Utensils className="text-orange-400 w-8 h-8 drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]" />;
    case "Chopsuey":
      return <Soup className="text-amber-400 w-8 h-8 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />;
    case "Noodles":
      return <Utensils className="text-yellow-400 w-8 h-8 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />;
    case "Kottu":
      return <Flame className="text-red-400 w-8 h-8 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]" />;
    case "Ultimate Bites":
      return <Flame className="text-rose-400 w-8 h-8 drop-shadow-[0_0_8px_rgba(251,113,133,0.5)]" />;
    case "Beverages":
      return <Coffee className="text-cyan-400 w-8 h-8 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />;
    default:
      return <Award className="text-slate-400 w-8 h-8" />;
  }
};

const getCategoryGradient = (category: string) => {
  switch (category) {
    case "Fried Rice":
      return "from-orange-950/25 via-slate-900/95 to-slate-900";
    case "Chopsuey":
      return "from-amber-950/25 via-slate-900/95 to-slate-900";
    case "Noodles":
      return "from-yellow-950/25 via-slate-900/95 to-slate-900";
    case "Kottu":
      return "from-red-950/25 via-slate-900/95 to-slate-900";
    case "Ultimate Bites":
      return "from-rose-950/25 via-slate-900/95 to-slate-900";
    case "Beverages":
      return "from-cyan-950/25 via-slate-900/95 to-slate-900";
    default:
      return "from-slate-950 via-slate-900/95 to-slate-900";
  }
};

function MenuCard({ item, onAdd }: MenuCardProps) {
  return (
    <div
      onClick={() => onAdd(item)}
      className="glass-card rounded-[24px] p-3.5 flex flex-col h-60 cursor-pointer hover:scale-[1.02] active:scale-95 group"
    >
      {/* Category Gradient Visual Container */}
      <div className={`h-32 w-full rounded-[18px] bg-gradient-to-tr ${getCategoryGradient(item.category)} relative overflow-hidden flex items-center justify-center shrink-0 border border-white/5 shadow-inner`}>
        <div className="group-hover:scale-110 transition-transform duration-350">
          {getCategoryIcon(item.category)}
        </div>
        <span className="absolute bottom-2.5 right-2.5 text-[9px] font-black bg-[#050814]/95 text-slate-200 px-2.5 py-0.5 rounded-md border border-white/5 backdrop-blur-md tracking-wider uppercase">
          {item.portion}
        </span>
      </div>

      {/* Title & Pricing Block */}
      <div className="pt-3 flex flex-col justify-between flex-1 min-h-0">
        <div className="flex justify-between items-start gap-2 h-full">
          <div className="min-w-0 flex flex-col justify-between h-full pb-0.5">
            <div>
              <h3 className="font-extrabold text-xs line-clamp-2 leading-snug text-slate-100 group-hover:text-[#FF6B35] transition-colors">
                {item.title}
              </h3>
              <span className="text-[9px] font-bold text-slate-500 tracking-wider uppercase mt-1.5 block">
                {item.category}
              </span>
            </div>
          </div>
          <span className="text-[11px] font-black text-[#FF6B35] glow-orange shrink-0 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20 font-mono">
            LKR {item.price.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * 3. Reusable DataTable Component with Card-Table Hybrid & Pagination
 */
interface DataTableProps {
  items: MenuItem[];
  onEdit: (item: MenuItem) => void;
  onDelete: (id: number) => void;
}

function DataTable({ items, onEdit, onDelete }: DataTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const totalPages = Math.ceil(items.length / itemsPerPage);
  
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return items.slice(start, start + itemsPerPage);
  }, [items, currentPage]);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  if (items.length === 0) {
    return (
      <div className="bg-[#0D1224]/40 border border-slate-800/80 rounded-2xl p-12 text-center text-slate-500">
        <FolderKanban className="mx-auto text-slate-600 mb-3" size={32} />
        <p className="text-xs font-bold text-slate-400">No Menu Items Found</p>
        <p className="text-[10px] text-slate-500 mt-1">Try adjusting your search criteria or add a new item.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-[#0D1224]/40 border border-slate-800/80 rounded-[24px] overflow-hidden shadow-2xl backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-slate-950/40 sticky top-0 z-10 backdrop-blur-md">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Item Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Portion</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {paginatedItems.map(item => (
                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4 font-mono text-[10px] text-slate-500">{item.id}</td>
                  <td className="px-6 py-4 font-extrabold text-slate-200">{item.title}</td>
                  <td className="px-6 py-4">
                    <span className="bg-white/5 text-slate-400 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase border border-white/5">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400">{item.portion}</td>
                  <td className="px-6 py-4 font-bold text-[#FF6B35] glow-orange">LKR {item.price.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEdit(item)}
                        className="text-orange-400 hover:text-orange-300 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-xl transition-all font-bold text-[10px] uppercase cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(item.id)}
                        className="text-red-400 hover:text-red-300 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-xl transition-all font-bold text-[10px] uppercase cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center px-2">
          <span className="text-[10px] font-mono text-slate-500 uppercase">
            Showing Page {currentPage} of {totalPages} ({items.length} total)
          </span>
          <div className="flex gap-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="p-2 bg-white/5 border border-white/5 rounded-xl text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="p-2 bg-white/5 border border-white/5 rounded-xl text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <ChevronRight size={16} />
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

// --- Demo Menu Data ---
const INITIAL_MENU_ITEMS: MenuItem[] = [
  // Fried Rice Selection
  { id: 1, title: "Egg Fried Rice", price: 750, category: "Fried Rice", imageColor: "bg-slate-800/80", portion: "Full Portion" },
  { id: 2, title: "Classic Chicken Fried Rice", price: 1000, category: "Fried Rice", imageColor: "bg-slate-800/80", portion: "Full Portion" },
  { id: 3, title: "Prawns Fried Rice", price: 1100, category: "Fried Rice", imageColor: "bg-slate-800/80", portion: "Full Portion" },
  { id: 4, title: "Beef Fried Rice", price: 1200, category: "Fried Rice", imageColor: "bg-slate-800/80", portion: "Full Portion" },
  { id: 5, title: "Seafood Fried Rice", price: 1300, category: "Fried Rice", imageColor: "bg-slate-800/80", portion: "Full Portion" },
  { id: 6, title: "Surf & Turf Fried Rice", price: 1400, category: "Fried Rice", imageColor: "bg-slate-800/80", portion: "Full Portion" },
  { id: 7, title: "Nasi Goreng", price: 1300, category: "Fried Rice", imageColor: "bg-slate-800/80", portion: "Full Portion" },

  // Chopsuey Selection
  { id: 8, title: "Chicken Chopsuey Rice", price: 1250, category: "Chopsuey", imageColor: "bg-slate-800/80", portion: "Full Portion" },
  { id: 9, title: "Prawn Chopsuey Rice", price: 1350, category: "Chopsuey", imageColor: "bg-slate-800/80", portion: "Full Portion" },
  { id: 10, title: "Seafood Chopsuey Rice", price: 1450, category: "Chopsuey", imageColor: "bg-slate-800/80", portion: "Full Portion" },
  { id: 11, title: "Surf & Turf Chopsuey Rice", price: 1600, category: "Chopsuey", imageColor: "bg-slate-800/80", portion: "Full Portion" },

  // Noodles Selection
  { id: 12, title: "Egg Fried Noodles", price: 750, category: "Noodles", imageColor: "bg-slate-800/80", portion: "Full Portion" },
  { id: 13, title: "Chicken Fried Noodles", price: 1000, category: "Noodles", imageColor: "bg-slate-800/80", portion: "Full Portion" },
  { id: 14, title: "Prawn Fried Noodles", price: 1100, category: "Noodles", imageColor: "bg-slate-800/80", portion: "Full Portion" },
  { id: 15, title: "Beef Fried Noodles", price: 1200, category: "Noodles", imageColor: "bg-slate-800/80", portion: "Full Portion" },
  { id: 16, title: "Seafood Fried Noodles", price: 1300, category: "Noodles", imageColor: "bg-slate-800/80", portion: "Full Portion" },
  { id: 17, title: "Surf & Turf Fried Noodles", price: 1400, category: "Noodles", imageColor: "bg-slate-800/80", portion: "Full Portion" },

  // Kottu Selection
  { id: 18, title: "Egg Kottu", price: 750, category: "Kottu", imageColor: "bg-slate-800/80", portion: "Full Portion" },
  { id: 19, title: "Chicken Kottu", price: 1000, category: "Kottu", imageColor: "bg-slate-800/80", portion: "Full Portion" },
  { id: 20, title: "Beef Kottu", price: 1200, category: "Kottu", imageColor: "bg-slate-800/80", portion: "Full Portion" },
  { id: 21, title: "Seafood Kottu", price: 1300, category: "Kottu", imageColor: "bg-slate-800/80", portion: "Full Portion" },
  { id: 22, title: "Surf & Turf Kottu", price: 1400, category: "Kottu", imageColor: "bg-slate-800/80", portion: "Full Portion" },
  { id: 23, title: "Fried Chicken Cheese Kottu", price: 1500, category: "Kottu", imageColor: "bg-slate-800/80", portion: "Full Portion" },

  // Ultimate Bites
  { id: 24, title: "Sri Lankan Chicken Devilled", price: 1000, category: "Ultimate Bites", imageColor: "bg-slate-800/80", portion: "250g" },
  { id: 25, title: "Sri Lankan Fish Devilled", price: 1100, category: "Ultimate Bites", imageColor: "bg-slate-800/80", portion: "250g" },
  { id: 26, title: "Sri Lankan Prawn Devilled", price: 1100, category: "Ultimate Bites", imageColor: "bg-slate-800/80", portion: "250g" },
  { id: 27, title: "Sri Lankan Beef Devilled", price: 1400, category: "Ultimate Bites", imageColor: "bg-slate-800/80", portion: "250g" },
  { id: 28, title: "Sri Lankan Pork Devilled", price: 1300, category: "Ultimate Bites", imageColor: "bg-slate-800/80", portion: "250g" },
  { id: 29, title: "Garlic Buttered Vegetable", price: 900, category: "Ultimate Bites", imageColor: "bg-slate-800/80", portion: "Regular" },
  { id: 30, title: "French Fries", price: 800, category: "Ultimate Bites", imageColor: "bg-slate-800/80", portion: "Regular" },
  { id: 31, title: "Kochi Bite", price: 800, category: "Ultimate Bites", imageColor: "bg-slate-800/80", portion: "10 Pcs" },
  { id: 32, title: "Hot Butter Cuttlefish", price: 900, category: "Ultimate Bites", imageColor: "bg-slate-800/80", portion: "Regular" },

  // Beverages
  { id: 33, title: "Ice Milo", price: 250, category: "Beverages", imageColor: "bg-slate-800/80", portion: "Regular" },
  { id: 34, title: "Milk Shake", price: 350, category: "Beverages", imageColor: "bg-slate-800/80", portion: "Regular" },
  { id: 35, title: "Ice Coffee", price: 250, category: "Beverages", imageColor: "bg-slate-800/80", portion: "Regular" },
  { id: 36, title: "Mineral Water", price: 100, category: "Beverages", imageColor: "bg-slate-800/80", portion: "1 Liter" }
];

export default function PosPage() {
  const router = useRouter();

  // POS State
  const [activeSidebar, setActiveSidebar] = useState<"new_order" | "order_history" | "menu_management" | "settings">("new_order");
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Menu CRUD State
  const [menuItems, setMenuItems] = useState<MenuItem[]>(INITIAL_MENU_ITEMS);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemData, setNewItemData] = useState<Partial<MenuItem>>({
    title: "",
    price: 0,
    category: "Fried Rice",
    portion: "Full Portion",
    imageColor: "bg-slate-805"
  });

  // Admin PIN Security State
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");

  // Checkout Receipt Modal
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [latestOrder, setLatestOrder] = useState<Order | null>(null);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);

  // Toast System State
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

  // Handle Logout
  const handleLogout = () => {
    router.push("/login");
  };

  // Cart Operations
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItem.id === item.id);
      if (existing) {
        return prev.map(i => i.menuItem.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
    triggerToast(`Added ${item.title} to cart`, "success");
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
    const item = cart.find(i => i.menuItem.id === itemId);
    setCart(prev => prev.filter(item => item.menuItem.id !== itemId));
    if (item) {
      triggerToast(`Removed ${item.menuItem.title}`, "info");
    }
  };

  // Financial Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + tax;

  // Checkout & Invoice
  const handleCheckout = () => {
    if (cart.length === 0) {
      triggerToast("Your cart is empty!", "warning");
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
    triggerToast("Order processed and invoice printed!", "success");
  };

  // Sidebar navigation handler with PIN check
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
            triggerToast("Admin access granted", "success");
          } else {
            setPinError("Incorrect PIN. Please try again.");
            setPinInput("");
            triggerToast("Invalid passcode", "error");
          }
        }, 300);
      }
    }
  };

  // CRUD Operations
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemData.title || !newItemData.price) {
      triggerToast("Title and price are required", "warning");
      return;
    }
    const newItem: MenuItem = {
      id: Math.max(...menuItems.map(i => i.id)) + 1,
      title: newItemData.title,
      price: Number(newItemData.price),
      category: newItemData.category || "Fried Rice",
      portion: newItemData.portion || "Full Portion",
      imageColor: newItemData.imageColor || "bg-slate-805"
    };
    setMenuItems(prev => [...prev, newItem]);
    setIsAddingItem(false);
    setNewItemData({ title: "", price: 0, category: "Fried Rice", portion: "Full Portion", imageColor: "bg-slate-805" });
    triggerToast("Menu item added successfully", "success");
  };

  const handleEditItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setMenuItems(prev => prev.map(item => item.id === editingItem.id ? editingItem : item));
    setEditingItem(null);
    triggerToast("Menu item updated successfully", "success");
  };

  const handleDeleteItem = (id: number) => {
    if (confirm("Are you sure you want to delete this item?")) {
      setMenuItems(prev => prev.filter(item => item.id !== id));
      triggerToast("Menu item deleted", "info");
    }
  };

  // Filtered Menu Items
  const filteredMenuItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === "All" || item.category === activeCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#050814] text-[#F8F9FA] font-sans antialiased selection:bg-[#FF6B35] selection:text-white">
      
      {/* Global CSS style injection to hide scrollbars and add rich animations */}
      <style dangerouslySetInnerHTML={{__html: `
        ::-webkit-scrollbar {
          display: none !important;
        }
        * {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
        .mesh-bg {
          background-color: #050814;
          background-image: 
            radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.12) 0px, transparent 50%),
            radial-gradient(at 100% 0%, rgba(255, 107, 53, 0.1) 0px, transparent 50%),
            radial-gradient(at 50% 100%, rgba(139, 92, 246, 0.08) 0px, transparent 50%);
        }
        .glass-panel {
          background: rgba(13, 20, 38, 0.45);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.04);
        }
        .glass-card {
          background: rgba(20, 26, 48, 0.35);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.03);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .glass-card:hover {
          background: rgba(28, 37, 68, 0.45);
          border-color: rgba(255, 107, 53, 0.35);
          box-shadow: 0 15px 30px -10px rgba(0, 0, 0, 0.5), 0 0 15px 1px rgba(255, 107, 53, 0.05);
        }
        .glow-orange {
          text-shadow: 0 0 10px rgba(255, 107, 53, 0.55);
        }
      `}} />

      {/* Non-blocking Toast Notifications Stack */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`px-5 py-4 rounded-2xl shadow-2xl flex items-center justify-between gap-3 border transition-all duration-300 transform translate-y-0 opacity-100 ${
              toast.type === "success" 
                ? "bg-emerald-950/80 border-emerald-500/30 text-emerald-200" 
                : toast.type === "error" 
                  ? "bg-red-950/80 border-red-500/30 text-red-200" 
                  : toast.type === "warning" 
                    ? "bg-amber-950/80 border-amber-500/30 text-amber-200" 
                    : "bg-slate-900/95 border-slate-800 text-slate-200"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {toast.type === "success" && <Check size={16} className="text-emerald-400" />}
              {toast.type === "error" && <X size={16} className="text-red-400" />}
              {toast.type === "warning" && <AlertTriangle size={16} className="text-amber-400" />}
              {toast.type === "info" && <Info size={16} className="text-blue-400" />}
              <span className="text-xs font-bold tracking-wide leading-relaxed">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className="h-screen w-screen flex overflow-hidden mesh-bg">
        
        {/* 1. Sidebar Navigation (Left - Sleek, Thin Icon-Only - 7% width) */}
        <aside className="w-[7%] bg-[#060A17]/80 border-r border-white/5 flex flex-col justify-between items-center py-6 hidden md:flex shrink-0 z-10">
          
          {/* Top Brand Logo */}
          <div className="flex flex-col items-center gap-10 w-full">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/25 cursor-pointer hover:scale-105 transition-transform">
              <span className="text-xl font-black text-white italic">T</span>
            </div>

            {/* Navigation Menu */}
            <nav className="flex flex-col gap-5 w-full px-3">
              <button
                onClick={() => handleSidebarClick("new_order")}
                title="New Order"
                className={`w-full aspect-square flex flex-col items-center justify-center rounded-2xl transition-all duration-300 cursor-pointer relative group ${
                  activeSidebar === "new_order" 
                    ? "bg-gradient-to-br from-orange-500/15 to-red-500/5 text-[#FF6B35] border border-orange-500/20 shadow-[0_0_15px_rgba(255,107,53,0.1)]" 
                    : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
                }`}
              >
                <ShoppingBag size={20} className={activeSidebar === "new_order" ? "drop-shadow-[0_0_8px_rgba(255,107,53,0.5)]" : ""} />
                <span className="text-[9px] font-bold mt-1 tracking-wider scale-90 group-hover:scale-95 transition-transform">POS</span>
                {activeSidebar === "new_order" && (
                  <div className="absolute right-0 top-1/4 bottom-1/4 w-0.5 bg-[#FF6B35] rounded-l-full shadow-[0_0_8px_#FF6B35]" />
                )}
              </button>

              <button
                onClick={() => handleSidebarClick("order_history")}
                title="Order History"
                className={`w-full aspect-square flex flex-col items-center justify-center rounded-2xl transition-all duration-300 cursor-pointer relative group ${
                  activeSidebar === "order_history" 
                    ? "bg-gradient-to-br from-orange-500/15 to-red-500/5 text-[#FF6B35] border border-orange-500/20 shadow-[0_0_15px_rgba(255,107,53,0.1)]" 
                    : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
                }`}
              >
                <History size={20} className={activeSidebar === "order_history" ? "drop-shadow-[0_0_8px_rgba(255,107,53,0.5)]" : ""} />
                <span className="text-[9px] font-bold mt-1 tracking-wider scale-90 group-hover:scale-95 transition-transform">LOGS</span>
                {activeSidebar === "order_history" && (
                  <div className="absolute right-0 top-1/4 bottom-1/4 w-0.5 bg-[#FF6B35] rounded-l-full shadow-[0_0_8px_#FF6B35]" />
                )}
              </button>

              <button
                onClick={() => handleSidebarClick("menu_management")}
                title="Menu Manager"
                className={`w-full aspect-square flex flex-col items-center justify-center rounded-2xl transition-all duration-300 cursor-pointer relative group ${
                  activeSidebar === "menu_management" 
                    ? "bg-gradient-to-br from-orange-500/15 to-red-500/5 text-[#FF6B35] border border-orange-500/20 shadow-[0_0_15px_rgba(255,107,53,0.1)]" 
                    : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
                }`}
              >
                <FolderKanban size={20} className={activeSidebar === "menu_management" ? "drop-shadow-[0_0_8px_rgba(255,107,53,0.5)]" : ""} />
                <span className="text-[9px] font-bold mt-1 tracking-wider scale-90 group-hover:scale-95 transition-transform">MENU</span>
                {!isAdminUnlocked && <Lock size={10} className="absolute top-2 right-2 text-slate-600" />}
                {activeSidebar === "menu_management" && (
                  <div className="absolute right-0 top-1/4 bottom-1/4 w-0.5 bg-[#FF6B35] rounded-l-full shadow-[0_0_8px_#FF6B35]" />
                )}
              </button>

              <button
                onClick={() => handleSidebarClick("settings")}
                title="Settings"
                className={`w-full aspect-square flex flex-col items-center justify-center rounded-2xl transition-all duration-300 cursor-pointer relative group ${
                  activeSidebar === "settings" 
                    ? "bg-gradient-to-br from-orange-500/15 to-red-500/5 text-[#FF6B35] border border-orange-500/20 shadow-[0_0_15px_rgba(255,107,53,0.1)]" 
                    : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
                }`}
              >
                <SettingsIcon size={20} className={activeSidebar === "settings" ? "drop-shadow-[0_0_8px_rgba(255,107,53,0.5)]" : ""} />
                <span className="text-[9px] font-bold mt-1 tracking-wider scale-90 group-hover:scale-95 transition-transform">CONF</span>
                {activeSidebar === "settings" && (
                  <div className="absolute right-0 top-1/4 bottom-1/4 w-0.5 bg-[#FF6B35] rounded-l-full shadow-[0_0_8px_#FF6B35]" />
                )}
              </button>
            </nav>
          </div>

          {/* Bottom Cashier Info & Logout */}
          <div className="flex flex-col gap-4 items-center w-full px-2">
            <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-xs font-bold text-[#FF6B35] border border-white/5 cursor-pointer" title="Cashier 01 • Terminal #03">
              C1
            </div>

            <button
              onClick={handleLogout}
              title="Logout"
              className="w-10 h-10 flex items-center justify-center rounded-2xl text-red-500/70 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 cursor-pointer"
            >
              <LogOut size={18} />
            </button>
          </div>
        </aside>

        {/* Mobile bottom navigation bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#060A17]/95 border-t border-white/5 z-30 flex items-center justify-around px-2 backdrop-blur-lg">
          <button 
            onClick={() => handleSidebarClick("new_order")}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] ${activeSidebar === "new_order" ? "text-[#FF6B35]" : "text-slate-500"}`}
          >
            <ShoppingBag size={18} />
            <span>New Order</span>
          </button>
          <button 
            onClick={() => handleSidebarClick("order_history")}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] ${activeSidebar === "order_history" ? "text-[#FF6B35]" : "text-slate-500"}`}
          >
            <History size={18} />
            <span>History</span>
          </button>
          <button 
            onClick={() => handleSidebarClick("menu_management")}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] ${activeSidebar === "menu_management" ? "text-[#FF6B35]" : "text-slate-500"}`}
          >
            <FolderKanban size={18} />
            <span>Menu</span>
          </button>
          <button 
            onClick={() => handleSidebarClick("settings")}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] ${activeSidebar === "settings" ? "text-[#FF6B35]" : "text-slate-500"}`}
          >
            <SettingsIcon size={18} />
            <span>Settings</span>
          </button>
          <button 
            onClick={handleLogout}
            className="flex flex-col items-center justify-center gap-0.5 text-[10px] text-red-400"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>

        {/* 2. Main Content Area (Center - 63% width since sidebar is thinner) */}
        <main className="w-[63%] h-full overflow-hidden flex flex-col pb-16 md:pb-0">
          
          {/* Top Navigation / Search Header */}
          <header className="h-20 border-b border-white/5 px-6 py-4 flex items-center justify-between gap-4 bg-transparent shrink-0">
            <div className="flex items-center gap-3">
              <h1 className="text-base font-extrabold tracking-wider uppercase text-slate-100">
                {activeSidebar === "new_order" && "Create New Order"}
                {activeSidebar === "order_history" && "Order History & Logs"}
                {activeSidebar === "menu_management" && "Menu Management Database"}
                {activeSidebar === "settings" && "System Settings"}
              </h1>
              {activeSidebar === "new_order" && (
                <span className="text-[10px] font-mono font-bold bg-[#FF6B35]/10 text-[#FF6B35] px-2.5 py-1 rounded-full border border-orange-500/20">
                  {filteredMenuItems.length} Items
                </span>
              )}
            </div>

            {/* Live Clock & Search */}
            <div className="flex items-center gap-4">
              {activeSidebar === "new_order" && (
                <div className="relative w-48 sm:w-64">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                  <input
                    type="text"
                    placeholder="Search dishes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-full pl-10 pr-4 py-2 text-xs text-[#F8F9FA] focus:outline-none focus:border-[#FF6B35]/40 focus:ring-1 focus:ring-[#FF6B35]/15 transition-all placeholder:text-slate-600"
                  />
                </div>
              )}
              <div className="text-xs text-slate-500 font-mono hidden lg:block">
                {new Date().toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
            </div>
          </header>

          {/* Dashboard Content Switching */}
          <div className="flex-1 overflow-y-auto p-6">
            
            {/* --- VIEW: New Order (Main Menu Grid) --- */}
            {activeSidebar === "new_order" && (
              <div className="space-y-6">
                {/* Category filter pills */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none shrink-0">
                  {CATEGORIES.map(category => (
                    <button
                      key={category}
                      onClick={() => setActiveCategory(category)}
                      className={`px-5 py-2.5 rounded-full font-bold text-xs tracking-wide transition-all duration-350 cursor-pointer whitespace-nowrap border ${
                        activeCategory === category 
                          ? "bg-gradient-to-r from-orange-500 to-red-500 text-white border-transparent shadow-lg shadow-orange-500/25" 
                          : "bg-white/5 text-slate-400 border-white/5 hover:text-white hover:bg-white/10 hover:border-white/10"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                {/* Menu Items Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredMenuItems.map(item => (
                    <MenuCard
                      key={item.id}
                      item={item}
                      onAdd={addToCart}
                    />
                  ))}

                  {filteredMenuItems.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-500">
                      No menu items found. Try another search or category.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* --- VIEW: Order History --- */}
            {activeSidebar === "order_history" && (
              <div className="space-y-6">
                <div className="bg-[#0D1224]/40 border border-slate-800/80 rounded-[24px] p-5 backdrop-blur-md">
                  <h3 className="font-extrabold text-xs uppercase tracking-wider mb-4 flex items-center gap-2 text-slate-300">
                    <TrendingUp size={14} className="text-[#FF6B35]" />
                    Today's Sales Summary
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-[#050814]/60 p-4 rounded-2xl border border-white/5">
                      <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Total Orders</p>
                      <p className="text-xl font-black mt-1.5 text-slate-200">{orderHistory.length + 3}</p>
                    </div>
                    <div className="bg-[#050814]/60 p-4 rounded-2xl border border-white/5">
                      <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Gross Revenue</p>
                      <p className="text-xl font-black mt-1.5 text-emerald-400 font-mono">
                        LKR {(orderHistory.reduce((sum, o) => sum + o.total, 0) + 4140).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-[#050814]/60 p-4 rounded-2xl border border-white/5">
                      <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Average Ticket</p>
                      <p className="text-xl font-black mt-1.5 text-slate-200 font-mono">
                        LKR {Math.round((orderHistory.reduce((sum, o) => sum + o.total, 0) + 4140) / (orderHistory.length + 3)).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#0D1224]/40 border border-slate-800/80 rounded-[24px] overflow-hidden backdrop-blur-md">
                  <div className="p-4 border-b border-white/5 bg-slate-950/20">
                    <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-300">Recent Transactions</h3>
                  </div>
                  <div className="divide-y divide-white/5">
                    <div className="p-4 flex items-center justify-between hover:bg-white/[0.01] transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-slate-200">TCE-921473</span>
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Completed</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1.5">10:42 AM • 2 Items (Egg Kottu, Ice Milo)</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-xs text-slate-200 font-mono">LKR 1,000</span>
                        <p className="text-[9px] text-slate-500 mt-1">Paid via Cash</p>
                      </div>
                    </div>

                    <div className="p-4 flex items-center justify-between hover:bg-white/[0.01] transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-slate-200">TCE-847291</span>
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Completed</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1.5">11:15 AM • 2 Items (Classic Chicken Fried Rice, Mineral Water)</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-xs text-slate-200 font-mono">LKR 1,100</span>
                        <p className="text-[9px] text-slate-500 mt-1">Paid via Card</p>
                      </div>
                    </div>

                    <div className="p-4 flex items-center justify-between hover:bg-white/[0.01] transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-slate-200">TCE-631029</span>
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Completed</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1.5">12:30 PM • 2 Items (Surf & Turf Kottu, Milk Shake)</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-xs text-slate-200 font-mono">LKR 1,750</span>
                        <p className="text-[9px] text-slate-500 mt-1">Paid via Card</p>
                      </div>
                    </div>

                    {orderHistory.map((order) => (
                      <div key={order.id} className="p-4 flex items-center justify-between hover:bg-white/[0.01] transition-colors">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs text-slate-200">{order.id}</span>
                            <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">{order.status}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1.5">
                            {order.timestamp} • {order.items.reduce((sum, i) => sum + i.quantity, 0)} Items
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-xs text-slate-200 font-mono">LKR {order.total.toLocaleString()}</span>
                          <p className="text-[9px] text-slate-500 mt-1">Cashier #01</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* --- VIEW: Menu Management CRUD --- */}
            {activeSidebar === "menu_management" && isAdminUnlocked && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-300">System Menu Database</h3>
                  {!isAddingItem && (
                    <button
                      onClick={() => setIsAddingItem(true)}
                      className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-orange-500/10"
                    >
                      <Plus size={14} /> Add New Item
                    </button>
                  )}
                </div>

                {/* Add Form with Floating Labels */}
                {isAddingItem && (
                  <form onSubmit={handleAddItem} className="bg-[#0D1224]/40 border border-orange-500/20 p-6 rounded-[24px] space-y-4 backdrop-blur-md">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <h4 className="font-extrabold text-xs text-orange-400 uppercase tracking-wider">Add New Menu Item</h4>
                      <button type="button" onClick={() => setIsAddingItem(false)} className="text-xs text-slate-400 hover:text-white cursor-pointer">Cancel</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <FormInput
                        id="new-title"
                        label="Item Title"
                        value={newItemData.title}
                        onChange={e => setNewItemData(prev => ({ ...prev, title: e.target.value }))}
                        required
                      />
                      <FormInput
                        id="new-price"
                        label="Price (LKR)"
                        type="number"
                        value={newItemData.price || ""}
                        onChange={e => setNewItemData(prev => ({ ...prev, price: Number(e.target.value) }))}
                        required
                      />
                      <div className="relative rounded-2xl bg-[#0D1224] border border-slate-800 px-4 pt-5 pb-1.5">
                        <label className="absolute left-4 top-2 text-[9px] font-bold text-slate-500 uppercase">Category</label>
                        <select
                          value={newItemData.category}
                          onChange={e => setNewItemData(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full text-xs text-white bg-transparent outline-none border-none cursor-pointer pt-1"
                        >
                          {CATEGORIES.filter(c => c !== "All").map(cat => (
                            <option key={cat} value={cat} className="bg-[#0D1224] text-white">{cat}</option>
                          ))}
                        </select>
                      </div>
                      <FormInput
                        id="new-portion"
                        label="Portion / Volume"
                        value={newItemData.portion}
                        onChange={e => setNewItemData(prev => ({ ...prev, portion: e.target.value }))}
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-3 px-5 rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/15"
                    >
                      Save New Item
                    </button>
                  </form>
                )}

                {/* Edit Form with Floating Labels */}
                {editingItem && (
                  <form onSubmit={handleEditItem} className="bg-[#0D1224]/40 border border-blue-500/20 p-6 rounded-[24px] space-y-4 backdrop-blur-md">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <h4 className="font-extrabold text-xs text-blue-400 uppercase tracking-wider">Edit Menu Item</h4>
                      <button type="button" onClick={() => setEditingItem(null)} className="text-xs text-slate-400 hover:text-white cursor-pointer">Cancel</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <FormInput
                        id="edit-title"
                        label="Item Title"
                        value={editingItem.title}
                        onChange={e => setEditingItem(prev => ({ ...prev!, title: e.target.value }))}
                        required
                      />
                      <FormInput
                        id="edit-price"
                        label="Price (LKR)"
                        type="number"
                        value={editingItem.price}
                        onChange={e => setEditingItem(prev => ({ ...prev!, price: Number(e.target.value) }))}
                        required
                      />
                      <div className="relative rounded-2xl bg-[#0D1224] border border-slate-800 px-4 pt-5 pb-1.5">
                        <label className="absolute left-4 top-2 text-[9px] font-bold text-slate-500 uppercase">Category</label>
                        <select
                          value={editingItem.category}
                          onChange={e => setEditingItem(prev => ({ ...prev!, category: e.target.value }))}
                          className="w-full text-xs text-white bg-transparent outline-none border-none cursor-pointer pt-1"
                        >
                          {CATEGORIES.filter(c => c !== "All").map(cat => (
                            <option key={cat} value={cat} className="bg-[#0D1224] text-white">{cat}</option>
                          ))}
                        </select>
                      </div>
                      <FormInput
                        id="edit-portion"
                        label="Portion / Volume"
                        value={editingItem.portion}
                        onChange={e => setEditingItem(prev => ({ ...prev!, portion: e.target.value }))}
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs py-3 px-5 rounded-xl transition-all cursor-pointer shadow-lg shadow-blue-500/15"
                    >
                      Update Item
                    </button>
                  </form>
                )}

                {/* Card-Table Hybrid View with Pagination */}
                <DataTable
                  items={menuItems}
                  onEdit={setEditingItem}
                  onDelete={handleDeleteItem}
                />
              </div>
            )}

            {/* --- VIEW: Settings --- */}
            {activeSidebar === "settings" && (
              <div className="space-y-6 max-w-3xl">
                <div className="bg-[#0D1224]/40 border border-slate-800/80 rounded-[24px] p-6 space-y-5 backdrop-blur-md">
                  <h3 className="font-extrabold text-xs uppercase tracking-wider border-b border-white/5 pb-3 text-slate-300">POS Configuration</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Printer Connection</label>
                      <select className="w-full bg-[#0D1224] border border-slate-800 rounded-2xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-[#FF6B35]/40 cursor-pointer">
                        <option>PRINTER-USB-01 (Default Receipt)</option>
                        <option>PRINTER-WIFI-02 (Kitchen Display)</option>
                        <option>Virtual PDF Printer</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tax Rate (%)</label>
                      <input
                        type="number"
                        defaultValue="10"
                        className="w-full bg-[#0D1224] border border-slate-800 rounded-2xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-[#FF6B35]/40"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Currency Unit</label>
                      <input
                        type="text"
                        defaultValue="LKR"
                        className="w-full bg-[#0D1224] border border-slate-800 rounded-2xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-[#FF6B35]/40"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kitchen Mode</label>
                      <select className="w-full bg-[#0D1224] border border-slate-800 rounded-2xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-[#FF6B35]/40 cursor-pointer">
                        <option>Auto-print on checkout</option>
                        <option>Manual confirmation</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-[#0D1224]/40 border border-slate-800/80 rounded-[24px] p-6 backdrop-blur-md">
                  <h3 className="font-extrabold text-xs uppercase tracking-wider border-b border-white/5 pb-3 text-red-400">Security Settings</h3>
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-300">Admin Panel Access</p>
                      <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Requires a 4-digit security PIN passcode to unlock the menu database</p>
                    </div>
                    <button
                      onClick={() => {
                        setIsAdminUnlocked(false);
                        triggerToast("Admin session locked", "info");
                      }}
                      disabled={!isAdminUnlocked}
                      className="bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-red-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                      Lock Admin Session
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>

        {/* 3. Cart & Billing (Right - 30% width - Styled as a Floating Dock) */}
        <aside className="w-[30%] h-full p-4 shrink-0 hidden lg:flex flex-col justify-between">
          <div className="flex flex-col h-full w-full bg-gradient-to-b from-[#10152B]/85 to-[#080B1A]/85 border border-white/5 rounded-[28px] shadow-2xl shadow-black/40 overflow-hidden backdrop-blur-2xl">
            
            {/* Header */}
            <div className="h-20 border-b border-white/5 px-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} className="text-[#FF6B35] drop-shadow-[0_0_8px_rgba(255,107,53,0.4)]" />
                <h2 className="font-extrabold text-sm text-slate-100 uppercase tracking-wider">Current Order</h2>
              </div>
              <span className="text-xs bg-[#0B132B] px-3 py-1 rounded-full font-mono text-slate-300 font-black border border-white/5">
                {cart.reduce((sum, i) => sum + i.quantity, 0)} Items
              </span>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.map((item) => (
                <div 
                  key={item.menuItem.id} 
                  className="bg-white/5 border border-white/5 rounded-2xl p-3.5 flex gap-3 items-center justify-between hover:bg-white/10 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-extrabold text-xs truncate text-slate-200">{item.menuItem.title}</h4>
                    <p className="text-[10px] text-[#FF6B35] glow-orange font-black mt-1">
                      LKR {item.menuItem.price.toLocaleString()}
                    </p>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => updateQuantity(item.menuItem.id, -1)}
                      className="w-7 h-7 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg flex items-center justify-center cursor-pointer transition-colors border border-white/5"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-xs font-mono font-black text-white w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.menuItem.id, 1)}
                      className="w-7 h-7 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg flex items-center justify-center cursor-pointer transition-colors border border-white/5"
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromCart(item.menuItem.id)}
                    className="text-slate-600 hover:text-red-400 p-1.5 cursor-pointer transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              {cart.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center py-24 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-slate-600 border border-white/5">
                    <ShoppingBag size={22} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cart is Empty</p>
                    <p className="text-[10px] text-slate-500 mt-1.5 max-w-[170px] leading-relaxed">Add items from the menu to start building an order</p>
                  </div>
                </div>
              )}
            </div>

            {/* Calculations & Checkout */}
            <div className="border-t border-white/5 p-6 bg-white/[0.02] space-y-4 shrink-0">
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-mono font-bold text-slate-200">LKR {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Vat / Tax (10%)</span>
                  <span className="font-mono font-bold text-slate-200">LKR {tax.toLocaleString()}</span>
                </div>
                <div className="border-t border-white/5 pt-3 flex justify-between items-center text-sm font-black text-white">
                  <span>Total Amount</span>
                  <span className="text-[#FF6B35] glow-orange font-mono text-lg">LKR {total.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-4 px-4 rounded-2xl shadow-lg shadow-orange-500/25 hover:shadow-orange-600/35 transition-all duration-250 flex items-center justify-center gap-2 text-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-widest"
              >
                <Printer size={16} />
                <span>Confirm Order</span>
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* --- MODAL: Admin Security PIN Entry --- */}
      {showPinModal && (
        <div className="fixed inset-0 bg-[#050814]/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0D1224]/90 border border-white/5 rounded-3xl p-7 max-w-sm w-full text-center shadow-2xl space-y-6 backdrop-blur-xl">
            <div className="w-12 h-12 bg-orange-500/10 text-[#FF6B35] rounded-2xl flex items-center justify-center mx-auto border border-orange-500/20">
              <Lock size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold uppercase tracking-wider text-slate-100">Enter Security PIN</h3>
              <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">Access to the Menu Manager requires a 4-digit code</p>
            </div>

            {/* Simulated PIN Display */}
            <div className="flex justify-center gap-3">
              {[...Array(4)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold font-mono text-lg transition-all ${
                    pinInput.length > i 
                      ? "border-[#FF6B35] bg-[#FF6B35]/10 text-white shadow-[0_0_8px_rgba(255,107,53,0.25)]" 
                      : "border-white/5 bg-[#050814] text-slate-600"
                  }`}
                >
                  {pinInput.length > i ? "•" : ""}
                </div>
              ))}
            </div>

            {pinError && (
              <p className="text-red-400 text-xs font-semibold bg-red-950/20 p-2.5 rounded-xl border border-red-500/15">
                {pinError}
              </p>
            )}

            {/* Custom PIN Pad Keyboard */}
            <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handlePinKeyPress(num)}
                  className="bg-white/5 hover:bg-[#FF6B35] hover:text-white border border-white/5 text-slate-300 font-bold py-3 rounded-xl transition-all text-sm cursor-pointer"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPinInput("")}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold py-3 rounded-xl text-xs cursor-pointer border border-red-500/10"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handlePinKeyPress("0")}
                className="bg-white/5 hover:bg-[#FF6B35] hover:text-white border border-white/5 text-slate-300 font-bold py-3 rounded-xl transition-all text-sm cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => setShowPinModal(false)}
                className="bg-white/5 hover:bg-white/10 text-slate-300 font-bold py-3 rounded-xl text-xs cursor-pointer border border-white/5"
              >
                Close
              </button>
            </div>
            
            <p className="text-[10px] text-slate-500">Hint: Use demo passcode <span className="text-[#FF6B35] font-bold">1234</span></p>
          </div>
        </div>
      )}

      {/* --- MODAL: Receipt Invoice Overlay --- */}
      {showReceiptModal && latestOrder && (
        <div className="fixed inset-0 bg-[#050814]/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white text-slate-900 rounded-[32px] p-6 max-w-sm w-full shadow-2xl space-y-5 flex flex-col justify-between max-h-[90vh]">
            
            {/* Receipt Content Scroll Area */}
            <div className="overflow-y-auto flex-1 pr-1 space-y-4 font-mono text-xs">
              {/* Receipt Header */}
              <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-4">
                <h3 className="font-black text-base tracking-tight uppercase">T-Cloud Eats</h3>
                <p className="text-[10px] text-slate-500">557/3/5 Godella Rd, Mulleriyawa</p>
                <p className="text-[10px] text-slate-500">Tel: 070 628 8109</p>
                <div className="text-[9px] text-slate-400 mt-2">
                  <p>Order: {latestOrder.id}</p>
                  <p>Date: {latestOrder.timestamp}</p>
                  <p>Cashier: Cashier #01</p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2 border-b border-dashed border-slate-300 pb-4">
                <div className="flex justify-between font-bold text-[10px] text-slate-500">
                  <span>Item Description</span>
                  <span>Total</span>
                </div>
                {latestOrder.items.map((item) => (
                  <div key={item.menuItem.id} className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <p className="font-bold">{item.menuItem.title}</p>
                      <p className="text-[10px] text-slate-500">
                        {item.quantity} x LKR {item.menuItem.price.toLocaleString()}
                      </p>
                    </div>
                    <span className="font-bold">LKR {(item.menuItem.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Totals Section */}
              <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>LKR {latestOrder.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Vat / Tax (10%)</span>
                  <span>LKR {latestOrder.tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-black text-sm border-t border-slate-200 pt-1.5">
                  <span>Total Due</span>
                  <span>LKR {latestOrder.total.toLocaleString()}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-[10px] text-slate-400 pt-2 space-y-1">
                <p className="font-bold">THANK YOU FOR YOUR ORDER!</p>
                <p>Eat. Enjoy. Repeat.</p>
                <p className="text-[8px] text-slate-300">Software Powered by Antigravity</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="space-y-2 pt-2 border-t border-slate-200 shrink-0">
              <button
                onClick={confirmAndPrintInvoice}
                className="w-full bg-[#FF6B35] hover:bg-orange-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 text-xs cursor-pointer"
              >
                <Printer size={16} />
                <span>Confirm &amp; Print Invoice</span>
              </button>
              <button
                onClick={() => {
                  setShowReceiptModal(false);
                  setLatestOrder(null);
                }}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 px-4 rounded-xl transition-colors text-xs cursor-pointer text-center"
              >
                Close / Cancel
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
