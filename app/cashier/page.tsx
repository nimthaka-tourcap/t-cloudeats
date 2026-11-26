"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";
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
  Image as ImageIcon,
  BarChart3,
  Bell,
  MessageCircle,
  Wifi,
  WifiOff,
  Eye,
  EyeOff,
  Truck,
  Smartphone,
  Utensils,
  Boxes,
  Landmark,
  PauseCircle,
  PlayCircle,
  HardDrive,
  BookOpen,
  ShieldCheck,
  Calendar
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import PosTerminalView from "@/components/cashier/PosTerminalView";
import { stepDateStr, getTodayDateStr, type ParkedOrder } from "@/lib/cashier/types";

const TabLoader = () => (
  <div className="p-8 text-center text-xs text-slate-500">Loading view...</div>
);

const UnifiedStockView = dynamic(() => import("@/components/cashier/UnifiedStockView"), { ssr: false, loading: TabLoader });
const UnifiedFinanceSection = dynamic(() => import("@/components/cashier/UnifiedFinanceSection"), { ssr: false, loading: TabLoader });
const OrderLogsView = dynamic(() => import("@/components/cashier/OrderLogsView"), { ssr: false, loading: TabLoader });
const MenuManagerView = dynamic(() => import("@/components/cashier/MenuManagerView"), { ssr: false, loading: TabLoader });
const ShiftTallyView = dynamic(() => import("@/components/cashier/ShiftTallyView"), { ssr: false, loading: TabLoader });
const ReceiptPrintModal = dynamic(() => import("@/components/cashier/ReceiptPrintModal"), { ssr: false });
const QuickSearchModal = dynamic(() => import("@/components/cashier/QuickSearchModal"), { ssr: false });
const CustomerCmsModal = dynamic(() => import("@/components/cashier/CustomerCmsModal"), { ssr: false });
const SplitPaymentModal = dynamic(() => import("@/components/cashier/SplitPaymentModal"), { ssr: false });
const NetworkSpeedOverlay = dynamic(() => import("@/components/cashier/NetworkSpeedOverlay"), { ssr: false });

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
  isNew?: boolean;
  comment?: string;
  addonPrice?: number;
  isFree?: boolean;
  customItemPrice?: number;
}

function getItemUnitPrice(item: CartItem): number {
  if (item.isFree) return 0;
  const basePrice = item.customItemPrice !== undefined ? item.customItemPrice : (item.menuItem ? item.menuItem.price : (item as any).price || 0);
  const totalUnitPrice = basePrice + (item.addonPrice || 0);
  return Math.max(0, totalUnitPrice);
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  sku: string;
  unit: string;
  parLevel: number;
  quantity: number;
  unitCost: number;
  supplier: string;
  expirationDate: string;
  storageLocation: "Cooler" | "Freezer" | "Dry Shelf";
}

interface CustomerDetails {
  phone: string;
  name: string;
  address: string;
  payment_method?: string;
  payment_receipt?: string;
  payment_receipt_filename?: string;
  discount_type?: "percentage" | "fixed";
  discount_value?: number;
  discount_amount?: number;
  delivery_fee?: number;
  payment_status?: "Paid" | "Not Paid" | string;
  split_cash_amount?: number;
  split_bank_amount?: number;
  settled_at?: string;
  settled_biz_date?: string;
}

interface Order {
  id: string;
  timestamp: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  delivery_fee?: number;
  total: number;
  status: "Preparing" | "Ready" | "Dispatched" | "Completed" | "Voided" | "Ignored";
  type: "POS" | "Direct" | "3rd Party" | "Take Away" | "Pick Up" | "Delivery" | "Dine In";
  customer?: CustomerDetails;
  payment_status?: "Paid" | "Not Paid" | string;
  syncedToDb?: boolean;
}

type ToastType = "success" | "error" | "info" | "warning";

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

type ReportDateFilter = "7_days" | "14_days" | "30_days" | "this_month" | "last_month" | "all_time";

function isOrderInReportRange(timestamp: string, filter: ReportDateFilter): boolean {
  if (filter === "all_time") return true;
  const orderDate = new Date(timestamp);
  if (isNaN(orderDate.getTime())) return true;

  const now = new Date();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (filter === "7_days") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
    return orderDate >= start && orderDate <= endOfToday;
  }

  if (filter === "14_days") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13, 0, 0, 0, 0);
    return orderDate >= start && orderDate <= endOfToday;
  }

  if (filter === "30_days") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0, 0);
    return orderDate >= start && orderDate <= endOfToday;
  }

  if (filter === "this_month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    return orderDate >= start && orderDate <= endOfToday;
  }

  if (filter === "last_month") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    return orderDate >= start && orderDate <= end;
  }

  return true;
}

const CATEGORIES = ["All Categories", "Fried Rice", "Chopsuey", "Kottu", "Pasta", "Ultimate Bites", "Beverages"];

const MONTHS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const DAYS = Array.from({ length: 31 }, (_, i) => {
  const d = String(i + 1).padStart(2, "0");
  return { value: d, label: d };
});

const POSTAL_CODES: Record<string, string> = {
  "Colombo 01": "00100",
  "Colombo 02": "00200",
  "Colombo 03": "00300",
  "Colombo 04": "00400",
  "Colombo 05": "00500",
  "Colombo 06": "00600",
  "Colombo 07": "00700",
  "Colombo 08": "00800",
  "Colombo 09": "00900",
  "Colombo 10": "01000",
  "Colombo 11": "01100",
  "Colombo 12": "01200",
  "Colombo 13": "01300",
  "Colombo 14": "01400",
  "Colombo 15": "01500",
  "Akarawita": "10732",
  "Angoda": "10620",
  "Arangala": "10150",
  "Athurugiriya": "10150",
  "Avissawella": "10700",
  "Bambalapitiya": "00400",
  "Batawala": "10513",
  "Battaramulla": "10120",
  "Batugampola": "10526",
  "Bope": "10522",
  "Boralesgamuwa": "10290",
  "Borella": "00800",
  "Dedigamuwa": "10656",
  "Dehiwala": "10350",
  "Deltara": "10302",
  "Embuldeniya": "10250",
  "Gongodawila": "10250",
  "Habarakada": "10204",
  "Handapangoda": "10524",
  "Hanwella": "10650",
  "Hewainna": "10714",
  "Hiripitya": "10232",
  "Hokandara": "10118",
  "Homagama": "10200",
  "Horagala": "10502",
  "Kaduwela": "10640",
  "Kahawala": "10508",
  "Kalatuwawa": "10718",
  "Kalubowila": "10350",
  "Kiriwattuduwa": "10208",
  "Kohuwala": "10250",
  "Kolonnawa": "10600",
  "Kosgama": "10730",
  "Kotahena": "01300",
  "Kotikawatta": "10120",
  "Kottawa": "10230",
  "Madapatha": "10306",
  "Maharagama": "10280",
  "Malabe": "10115",
  "Meegoda": "10504",
  "Moratuwa": "10400",
  "Mount Lavinia": "10370",
  "Mullegama": "10202",
  "Mulleriyawa": "10620",
  "Mutwal": "01500",
  "Napawela": "10704",
  "Narahenpita": "00500",
  "Nugegoda": "10250",
  "Padukka": "10500",
  "Pannipitiya": "10230",
  "Piliyandala": "10300",
  "Pita Kotte": "10100",
  "Pitipana Homagama": "10206",
  "Polgasowita": "10320",
  "Puwakpitiya": "10712",
  "Rajagiriya": "10100",
  "Ranala": "10654",
  "Ratmalana": "10390",
  "Siddamulla": "10304",
  "Sri Jayewardenepura": "10100",
  "Talawatugoda": "10116",
  "Tummodara": "10682",
  "Waga": "10680",
  "Watareka": "10511",
  "Wijerama": "10250",
  "Akaragama": "11536",
  "Alawala": "11122",
  "Ambagaspitiya": "11052",
  "Ambepussa": "11212",
  "Andiambalama": "11558",
  "Attanagalla": "11120",
  "Badalgama": "11538",
  "Banduragoda": "11244",
  "Batuwatta": "11011",
  "Bemmulla": "11040",
  "Biyagama": "11650",
  "Biyagama IPZ": "11672",
  "Bokalagama": "11216",
  "Bopagama": "11134",
  "Buthpitiya": "11720",
  "Dagonna": "11524",
  "Danowita": "11896",
  "Debahera": "11889",
  "Dekatana": "11690",
  "Delgoda": "11700",
  "Delwagura": "11228",
  "Demalagama": "11692",
  "Demanhandiya": "11270",
  "Dewalapola": "11102",
  "Divulapitiya": "11250",
  "Divuldeniya": "11208",
  "Dompe": "11680",
  "Dunagaha": "11264",
  "Ekala": "11380",
  "Ellakkala": "11116",
  "Essella": "11108",
  "Gampaha": "11000",
  "Ganemulla": "11020",
  "GonawalaWP": "11630",
  "Heiyanthuduwa": "11618",
  "Hendala": "11300",
  "Henegama": "11715",
  "Hinatiyana Madawala": "11568",
  "Hiswella": "11734",
  "Horampella": "11564",
  "Hunumulla": "11262",
  "Ihala Madampella": "11265",
  "Imbulgoda": "11856",
  "Ja-Ela": "11350",
  "Kadawatha": "11850",
  "Kahatowita": "11144",
  "Kalagedihena": "11875",
  "Kaleliya": "11160",
  "Kaluaggala": "11224",
  "Kandana": "11320",
  "Kapugoda": "10662",
  "Kapuwatta": "11350",
  "Katana": "11534",
  "Katunayake": "11450",
  "Katunayake Air Force Camp": "11440",
  "Katuwellegama": "11526",
  "Kelaniya": "11600",
  "Kimbulapitiya": "11522",
  "Kiribathgoda": "11600",
  "Kirindiwela": "11730",
  "Kitalawalana": "11206",
  "Kitulwala": "11242",
  "Kochchikade": "11540",
  "Kotadeniyawa": "11232",
  "Kotugoda": "11390",
  "Kumbaloluwa": "11105",
  "Loluwagoda": "11204",
  "Lunugama": "11062",
  "Mabodale": "11114",
  "Madelgamuwa": "11033",
  "Makewita": "11358",
  "Makola": "11640",
  "Malwana": "11670",
  "Mandawala": "11061",
  "Marandagahamula": "11260",
  "Mellawagedara": "11234",
  "Minuwangoda": "11550",
  "Mirigama": "11200",
  "Mithirigala": "11742",
  "Muddaragama": "11112",
  "Mudungoda": "11056",
  "Naranwala": "11063",
  "Nawana": "11222",
  "Nedungamuwa": "11066",
  "Negombo": "11500",
  "Nikahetikanda": "11128",
  "Nittambuwa": "11880",
  "Niwandama": "11354",
  "Pallewela": "11150",
  "Pamunugama": "11370",
  "Pamunuwatta": "11214",
  "Pasyala": "11890",
  "Peliyagoda": "11830",
  "Pepiliyawala": "11741",
  "Pethiyagoda": "11043",
  "Polpithimukulana": "11324",
  "Pugoda": "10660",
  "Radawadunna": "11892",
  "Radawana": "11725",
  "Raddolugama": "11400",
  "Ragama": "11010",
  "Ruggahawila": "11142",
  "Rukmale": "11129",
  "Seeduwa": "11410",
  "Siyambalape": "11607",
  "Talahena": "11504",
  "Thimbirigaskatuwa": "11532",
  "Tittapattara": "10664",
  "Udathuthiripitiya": "11054",
  "Udugampola": "11030",
  "Uggalboda": "11034",
  "Urapola": "11126",
  "Uswetakeiyawa": "11328",
  "Veyangoda": "11100",
  "Walgammulla": "11146",
  "Walpita": "11226",
  "Wanaluwewa": "11068",
  "Wathurugama": "11724",
  "Watinapaha": "11104",
  "Wattala": "11300",
  "Weboda": "11858",
  "Wegowwa": "11562",
  "Weliveriya": "11710",
  "Weweldeniya": "11894",
  "Yakkala": "11870"
};

function parseAddress(fullAddress: string) {
  let homeNo = "";
  let street = "";
  let postalArea = "";
  let postalCode = "";

  if (!fullAddress) return { homeNo, street, postalArea, postalCode };

  // 1. Find 5-digit postal code
  const pcMatch = fullAddress.match(/\b\d{5}\b/);
  if (pcMatch) {
    postalCode = pcMatch[0];
    fullAddress = fullAddress.replace(postalCode, "").trim();
  }

  // 2. Find matching postal area
  const areas = Object.keys(POSTAL_CODES);
  areas.sort((a, b) => b.length - a.length);

  for (const area of areas) {
    const regex = new RegExp(`\\b${area}\\b`, "i");
    if (regex.test(fullAddress)) {
      postalArea = area;
      if (!postalCode) {
        postalCode = POSTAL_CODES[area];
      }
      fullAddress = fullAddress.replace(regex, "").trim();
      break;
    }
  }

  // Clean trailing/leading commas/spaces
  let remaining = fullAddress.replace(/^[\s,]+|[\s,]+$/g, "").replace(/\s+/g, " ").trim();

  // 3. Split remaining into Home No and Street
  const parts = remaining.split(",");
  if (parts.length > 1) {
    homeNo = parts[0].trim();
    street = parts.slice(1).join(",").trim();
  } else {
    // If no comma, check if starts with a number
    const firstWordMatch = remaining.match(/^([0-9\/\-\.\,A-Za-z]+)\b/);
    if (firstWordMatch && /\d/.test(firstWordMatch[1])) {
      homeNo = firstWordMatch[1];
      street = remaining.slice(homeNo.length).trim();
    } else {
      street = remaining;
    }
  }

  return { homeNo, street, postalArea, postalCode };
}

const INITIAL_MENU_ITEMS: MenuItem[] = [
  // Wok-Fried Rice Selection
  { id: 1, title: "Egg Fried Rice", price: 800, category: "Fried Rice", portion: "Large Portion", image: "/Product Images/FR-01.avif", sku: "FR-01" },
  { id: 2, title: "Classic Chicken Fried Rice", price: 1100, category: "Fried Rice", portion: "Large Portion", image: "/Product Images/FR-02.avif", sku: "FR-02" },
  { id: 3, title: "Prawns Fried Rice", price: 1200, category: "Fried Rice", portion: "Large Portion", sku: "FR-03" },
  { id: 4, title: "Beef Fried Rice", price: 1400, category: "Fried Rice", portion: "Large Portion", sku: "FR-04" },
  { id: 5, title: "Seafood Fried Rice", price: 1500, category: "Fried Rice", portion: "Large Portion", image: "/Product Images/FR-05.avif", sku: "FR-05" },
  { id: 6, title: "Surf & Turf Fried Rice", price: 1700, category: "Fried Rice", portion: "Large Portion", sku: "FR-06" },
  { id: 7, title: "Nasi Goreng", price: 1400, category: "Fried Rice", portion: "Large Portion", image: "/Product Images/FR-07.avif", sku: "FR-07" },

  // Wok-Fried Rice Selection - Chopsuey
  { id: 8, title: "Chicken Chopsuey Rice", price: 1300, category: "Chopsuey", portion: "Large Portion", sku: "CS-01" },
  { id: 9, title: "Prawn Chopsuey Rice", price: 1400, category: "Chopsuey", portion: "Large Portion", image: "/Product Images/CS-02.avif", sku: "CS-02" },
  { id: 10, title: "Seafood Chopsuey Rice", price: 1600, category: "Chopsuey", portion: "Large Portion", sku: "CS-03" },
  { id: 11, title: "Surf & Turf Chopsuey Rice", price: 1800, category: "Chopsuey", portion: "Large Portion", sku: "CS-04" },

  // Kottu Selection
  { id: 12, title: "Egg Kottu", price: 800, category: "Kottu", portion: "Large Portion", image: "/Product Images/KT-01.avif", sku: "KT-01" },
  { id: 13, title: "Chicken Kottu", price: 1100, category: "Kottu", portion: "Large Portion", image: "/Product Images/KT-02.avif", sku: "KT-02" },
  { id: 14, title: "Beef Kottu", price: 1400, category: "Kottu", portion: "Large Portion", sku: "KT-03" },
  { id: 15, title: "Seafood Kottu", price: 1500, category: "Kottu", portion: "Large Portion", image: "/Product Images/KT-04.avif", sku: "KT-04" },
  { id: 16, title: "Surf & Turf Kottu", price: 1700, category: "Kottu", portion: "Large Portion", image: "/Product Images/KT-05.avif", sku: "KT-05" },
  { id: 17, title: "Fried Chicken Cheese Kottu", price: 1600, category: "Kottu", portion: "Large Portion", sku: "KT-06" },

  // Pasta
  { id: 33, title: "Creamy Mushroom Sauce", price: 1400, category: "Pasta", portion: "Large Portion", sku: "PA-01" },
  { id: 34, title: "Chicken with Cheese sauce", price: 1400, category: "Pasta", portion: "Large Portion", sku: "PA-02" },
  { id: 35, title: "Seafood with Creamy White Sauce", price: 1600, category: "Pasta", portion: "Large Portion", sku: "PA-03" },

  // Ultimate Bites
  { id: 18, title: "Sri Lankan Chicken Devilled", price: 1200, category: "Ultimate Bites", portion: "Large Portion", sku: "UB-01" },
  { id: 19, title: "Fried Fish", price: 1500, category: "Ultimate Bites", portion: "Large Portion", sku: "UB-02" },
  { id: 20, title: "Sri Lankan Prawn Devilled", price: 1400, category: "Ultimate Bites", portion: "Large Portion", sku: "UB-03" },
  { id: 21, title: "Sri Lankan Beef Devilled", price: 1600, category: "Ultimate Bites", portion: "Large Portion", sku: "UB-04" },
  { id: 22, title: "Sri Lankan Pork Devilled", price: 1600, category: "Ultimate Bites", portion: "Large Portion", sku: "UB-05" },
  { id: 23, title: "Chicken Stew", price: 1200, category: "Ultimate Bites", portion: "Large Portion", sku: "UB-06" },
  { id: 24, title: "Sri Lankan Omelette", price: 800, category: "Ultimate Bites", portion: "Large Portion", sku: "UB-07" },
  { id: 25, title: "Cheese & Chicken Omelette", price: 1100, category: "Ultimate Bites", portion: "Large Portion", sku: "UB-08" },

  // Beverages
  { id: 26, title: "Mineral Water Bottle (1000 ml)", price: 100, category: "Beverages", portion: "1000 ml", sku: "BV-01" },
  { id: 27, title: "Milk Shake", price: 600, category: "Beverages", portion: "Regular", sku: "BV-02" },
  { id: 28, title: "Coca Cola (1050 ml)", price: 300, category: "Beverages", portion: "1050 ml", image: "/Product Images/BV-03.avif", sku: "BV-03" },
  { id: 29, title: "Sprite (1050 ml)", price: 300, category: "Beverages", portion: "1050 ml", image: "/Product Images/BV-04.avif", sku: "BV-04" },
  { id: 30, title: "Fanta (1050 ml)", price: 300, category: "Beverages", portion: "1050 ml", image: "/Product Images/BV-05.avif", sku: "BV-05" },
  { id: 31, title: "EGB (1000 ml)", price: 320, category: "Beverages", portion: "1000 ml", image: "/Product Images/BV-06.avif", sku: "BV-06" },
  { id: 32, title: "Orange Crush (1000 ml)", price: 320, category: "Beverages", portion: "1000 ml", image: "/Product Images/BV-07.avif", sku: "BV-07" }
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
    <div className="font-mono text-[11px] font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap bg-slate-50 border border-slate-200 text-slate-700">
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
      case "Kottu": return { emoji: "🥘", accent: "#EF4444", bg: "rgba(239,68,68,0.08)" };
      case "Ultimate Bites": return { emoji: "🍗", accent: "#A855F7", bg: "rgba(168,85,247,0.08)" };
      case "Fried Rice": return { emoji: "🍚", accent: "#F59E0B", bg: "rgba(245,158,11,0.08)" };
      case "Chopsuey": return { emoji: "🥗", accent: "#06B6D4", bg: "rgba(6,182,212,0.08)" };
      case "Beverages": return { emoji: "🥤", accent: "#3B82F6", bg: "rgba(59,130,246,0.08)" };
      case "Pasta": return { emoji: "🍝", accent: "#EC4899", bg: "rgba(236,72,153,0.08)" };
      default: return { emoji: "🍽️", accent: "#10B981", bg: "rgba(16,185,129,0.08)" };
    }
  };

  const cfg = getCategoryConfig(item.category);

  return (
    <div
      onClick={() => onAdd(item)}
      className="group relative bg-slate-50 border border-slate-200 hover:border-[#F26F21]/50 rounded-2xl overflow-hidden flex flex-col cursor-pointer transition-all duration-250 hover:shadow-[0_8px_32px_rgba(242,111,33,0.12)] select-none"
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
        <h3 className="font-bold text-[12px] text-slate-900 leading-snug line-clamp-2 group-hover:text-[#F26F21] transition-colors duration-150">
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
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-y-auto max-h-[550px]" style={{ scrollbarWidth: "thin" }}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200 text-[10px] text-slate-500 font-bold uppercase tracking-wider bg-slate-50 sticky top-0 z-10 shadow-sm">
            <th className="px-5 py-3.5 bg-slate-50">Product ID (SKU)</th>
            <th className="px-5 py-3.5 bg-slate-50">Item Name</th>
            <th className="px-5 py-3.5 bg-slate-50">Category</th>
            <th className="px-5 py-3.5 bg-slate-50">Portion</th>
            <th className="px-5 py-3.5 bg-slate-50">Price</th>
            <th className="px-5 py-3.5 text-right bg-slate-50">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 text-xs">
          {items.map(item => (
            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-5 py-3 font-mono text-xs font-bold text-amber-700">{item.sku || "N/A"}</td>
              <td className="px-5 py-3 font-bold text-slate-900">{item.title}</td>
              <td className="px-5 py-3 text-slate-600">{item.category}</td>
              <td className="px-5 py-3 text-slate-600">{item.portion}</td>
              <td className="px-5 py-3 font-bold text-[#EA580C]">LKR {item.price.toLocaleString()}</td>
              <td className="px-5 py-3 text-right space-x-2">
                <button
                  type="button"
                  onClick={() => onEdit(item)}
                  className="text-sky-700 hover:text-sky-900 font-bold text-[10px] uppercase cursor-pointer"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  className="text-rose-700 hover:text-rose-900 font-bold text-[10px] uppercase cursor-pointer"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getBusinessDateStr(dateInput: Date | string = new Date()): string {
  const d = new Date(dateInput);
  const hours = d.getHours();
  const dateCopy = new Date(d);
  // Shift rolls over to new calendar day at 1:00 AM (00:00-00:59 counts as previous night shift)
  if (hours < 1) {
    dateCopy.setDate(dateCopy.getDate() - 1);
  }
  const yy = String(dateCopy.getFullYear()).slice(-2);
  const mm = String(dateCopy.getMonth() + 1).padStart(2, "0");
  const dd = String(dateCopy.getDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}

function isWithinOneHour(timestamp: string): boolean {
  if (!timestamp) return false;
  const diffMs = Date.now() - new Date(timestamp).getTime();
  return diffMs <= 60 * 60 * 1000;
}

function getNextInvoiceNumber(history: Order[], customDate?: Date | string | null): string {
  const dateObj = customDate
    ? (typeof customDate === "string" ? new Date(customDate.includes("T") ? customDate : `${customDate}T12:00:00`) : customDate)
    : new Date();
  const currentBizDateStr = getBusinessDateStr(dateObj);

  // Get all of target date's orders (excluding Ignored)
  const todaysOrders = history.filter(o =>
    getBusinessDateStr(o.timestamp) === currentBizDateStr &&
    o.status !== "Ignored" &&
    o.id.startsWith("INV-")
  );

  if (todaysOrders.length === 0) {
    return `INV-${currentBizDateStr}-001`;
  }

  // Find the highest sequence number and its order
  let maxSeq = 0;
  let maxSeqOrder: Order | null = null;

  todaysOrders.forEach(o => {
    const parts = o.id.split("-");
    if (parts.length === 3) {
      const seq = parseInt(parts[2], 10);
      if (seq > maxSeq) {
        maxSeq = seq;
        maxSeqOrder = o;
      }
    }
  });

  // If the highest sequence order of target date is Voided, reuse it!
  if (maxSeqOrder && (maxSeqOrder as Order).status === "Voided") {
    return `INV-${currentBizDateStr}-${String(maxSeq).padStart(3, "0")}`;
  }

  return `INV-${currentBizDateStr}-${String(maxSeq + 1).padStart(3, "0")}`;
}

function getStatusBadgeStyle(status: Order["status"]): { bg: string; text: string; border: string } {
  switch (status) {
    case "Preparing": return { bg: "rgba(245,158,11,0.08)", text: "#F59E0B", border: "rgba(245,158,11,0.2)" };
    case "Ready": return { bg: "rgba(168,85,247,0.08)", text: "#A855F7", border: "rgba(168,85,247,0.2)" };
    case "Dispatched": return { bg: "rgba(59,130,246,0.08)", text: "#3B82F6", border: "rgba(59,130,246,0.2)" };
    case "Completed": return { bg: "rgba(16,185,129,0.08)", text: "#10B981", border: "rgba(16,185,129,0.2)" };
    case "Voided": return { bg: "rgba(239,68,68,0.08)", text: "#EF4444", border: "rgba(239,68,68,0.2)" };
    case "Ignored": return { bg: "rgba(148,163,184,0.08)", text: "#94A3B8", border: "rgba(148,163,184,0.2)" };
    default: return { bg: "rgba(148,163,184,0.08)", text: "#94A3B8", border: "rgba(148,163,184,0.2)" };
  }
}

function getBillHash(invoiceId: string): string {
  let hash = 0;
  for (let i = 0; i < invoiceId.length; i++) {
    hash = (hash << 5) - hash + invoiceId.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 4096).toString(16).padStart(3, "0");
}

function getBillUrl(invoiceId: string): string {
  const hash = getBillHash(invoiceId);
  return `https://t-cloudeats.com/bills/${invoiceId}${hash}`;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 5000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Database connection timed out")), timeoutMs)
    )
  ]);
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
  const [selectedLogDate, setSelectedLogDate] = useState(() => {
    const local = new Date();
    const yy = local.getFullYear();
    const mm = String(local.getMonth() + 1).padStart(2, "0");
    const dd = String(local.getDate()).padStart(2, "0");
    return `${yy}-${mm}-${dd}`;
  });
  type UnifiedTab = "new_order" | "order_history" | "reports" | "menu_management" | "inventory" | "finance_reports" | "finance_ledger" | "finance_assets_payroll" | "settings";
  const [activeSidebar, setActiveSidebar] = useState<UnifiedTab>("new_order");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const tabParam = new URLSearchParams(window.location.search).get("tab") as UnifiedTab | null;
      if (tabParam) setActiveSidebar(tabParam);
    }
  }, []);
  const [activeCategory, setActiveCategory] = useState("All Categories");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [parkedOrders, setParkedOrders] = useState<ParkedOrder[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("t-cloud-eats-parked-orders");
        if (raw) return JSON.parse(raw);
      } catch { }
    }
    return [];
  });
  const [showQuickSearch, setShowQuickSearch] = useState(false);

  // Keyboard-First POS States
  const [focusZone, setFocusZone] = useState<"GRID" | "CART">("GRID");
  const [focusedProductIndex, setFocusedProductIndex] = useState(0);
  const [focusedCartIndex, setFocusedCartIndex] = useState(0);
  const [focusedOrderIndex, setFocusedOrderIndex] = useState(0);
  const [justAddedId, setJustAddedId] = useState<number | null>(null);
  const [orderTypeModalIndex, setOrderTypeModalIndex] = useState(1); // Default Take Away
  const [showShortcutsLegend, setShowShortcutsLegend] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const posGridRef = useRef<HTMLDivElement | null>(null);

  const triggerCartPulse = useCallback((id: number) => {
    setJustAddedId(id);
    setTimeout(() => setJustAddedId((cur) => (cur === id ? null : cur)), 180);
  }, []);

  const handleParkCurrentOrder = () => {
    if (cart.length === 0) return;
    const label = customerName?.trim() || `Hold #${parkedOrders.length + 1}`;
    const entry: ParkedOrder = {
      id: `HOLD-${Date.now()}`,
      label,
      parkedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      cart: cart as any,
      orderType,
      discountType,
      discountValue,
      customerName,
      customerPhone,
    };
    const next = [entry, ...parkedOrders];
    setParkedOrders(next);
    localStorage.setItem("t-cloud-eats-parked-orders", JSON.stringify(next));
    setCart([]);
    setDiscountValue(0);
    triggerToast(`Order "${label}" parked`, "info");
  };

  const handleRecallParkedOrder = (holdId: string) => {
    const target = parkedOrders.find((p) => p.id === holdId);
    if (!target) return;
    setCart(target.cart as any);
    setOrderType(target.orderType);
    setDiscountType(target.discountType);
    setDiscountValue(target.discountValue);
    if (target.customerName) setCustomerName(target.customerName);
    if (target.customerPhone) setCustomerPhone(target.customerPhone);
    const remaining = parkedOrders.filter((p) => p.id !== holdId);
    setParkedOrders(remaining);
    localStorage.setItem("t-cloud-eats-parked-orders", JSON.stringify(remaining));
    setActiveSidebar("new_order");
    triggerToast(`Recalled "${target.label}"`, "success");
  };
  const [orderType, setOrderType] = useState<"POS" | "Direct" | "3rd Party" | "Dine In">("POS");
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [editingInventoryItem, setEditingInventoryItem] = useState<InventoryItem | null>(null);

  // Inventory form fields
  const [invName, setInvName] = useState("");
  const [invCategory, setInvCategory] = useState("Produce");
  const [invSku, setInvSku] = useState("");
  const [invUnit, setInvUnit] = useState("lbs");
  const [invParLevel, setInvParLevel] = useState(0);
  const [invQuantity, setInvQuantity] = useState(0);
  const [invUnitCost, setInvUnitCost] = useState(0);
  const [invSupplier, setInvSupplier] = useState("");
  const [invExpirationDate, setInvExpirationDate] = useState("");
  const [invStorageLocation, setInvStorageLocation] = useState<"Cooler" | "Freezer" | "Dry Shelf">("Cooler");

  // Inventory search & filter
  const [invSearchQuery, setInvSearchQuery] = useState("");
  const [invFilterLocation, setInvFilterLocation] = useState<"All" | "Cooler" | "Freezer" | "Dry Shelf">("All");
  const [invFilterStockStatus, setInvFilterStockStatus] = useState<"All" | "Low Stock" | "Out of Stock" | "Normal">("All");
  const [stockSectionTab, setStockSectionTab] = useState<"inventory" | "costing">("costing");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [orderBookingDate, setOrderBookingDate] = useState<string | null>(null);
  const [commentEditingItemId, setCommentEditingItemId] = useState<number | null>(null);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [isDatabaseSyncing, setIsDatabaseSyncing] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [networkSpeedMbps, setNetworkSpeedMbps] = useState<number | null>(null);
  const [isNetworkUnstable, setIsNetworkUnstable] = useState<boolean>(false);
  const [isSpeedChecking, setIsSpeedChecking] = useState<boolean>(false);
  const isLoadingRef = useRef(false);
  const isSyncingOfflineRef = useRef(false);
  const hasShownInitialSyncToastRef = useRef(false);
  const hasShownOfflineSyncToastRef = useRef(false);

  // Measure real-time network speed (at least 1.0 Mbps required)
  const measureNetworkSpeed = useCallback(async (): Promise<number> => {
    if (typeof window === "undefined") return 0;
    if (!window.navigator.onLine) {
      setIsOnline(false);
      setNetworkSpeedMbps(0);
      setIsNetworkUnstable(true);
      return 0;
    }

    const navConn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    let reportedDownlink: number | null = null;
    if (navConn && typeof navConn.downlink === "number") {
      reportedDownlink = navConn.downlink;
    }

    setIsSpeedChecking(true);
    try {
      const tStart = performance.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`/api/ping?t=${Date.now()}`, {
        cache: "no-store",
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error("Ping failed");
      const text = await res.text();
      const tEnd = performance.now();

      const durationSeconds = Math.max(0.001, (tEnd - tStart) / 1000);
      const bytesReceived = new Blob([text]).size;
      const bitsReceived = bytesReceived * 8;
      const calculatedMbps = (bitsReceived / durationSeconds) / (1024 * 1024);

      const finalSpeed = reportedDownlink !== null
        ? Math.max(reportedDownlink, calculatedMbps)
        : calculatedMbps;

      setIsOnline(true);
      setNetworkSpeedMbps(finalSpeed);
      setIsNetworkUnstable(finalSpeed < 1.0);
      return finalSpeed;
    } catch (err) {
      if (reportedDownlink !== null && reportedDownlink >= 1.0 && window.navigator.onLine) {
        setIsOnline(true);
        setNetworkSpeedMbps(reportedDownlink);
        setIsNetworkUnstable(false);
        return reportedDownlink;
      }
      setNetworkSpeedMbps(0);
      setIsNetworkUnstable(true);
      return 0;
    } finally {
      setIsSpeedChecking(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    measureNetworkSpeed();

    const handleOnline = () => {
      setIsOnline(true);
      measureNetworkSpeed();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setNetworkSpeedMbps(0);
      setIsNetworkUnstable(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const navConn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (navConn && navConn.addEventListener) {
      navConn.addEventListener("change", measureNetworkSpeed);
    }

    // Auto-recheck interval: 3s if unstable to auto-unblur immediately, else 15s
    const intervalTimer = setInterval(() => {
      measureNetworkSpeed();
    }, isNetworkUnstable ? 3000 : 15000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (navConn && navConn.removeEventListener) {
        navConn.removeEventListener("change", measureNetworkSpeed);
      }
      clearInterval(intervalTimer);
    };
  }, [measureNetworkSpeed, isNetworkUnstable]);

  // Load inventory from Supabase (tce_inventory), fallback to localStorage
  useEffect(() => {
    const loadInventory = async () => {
      try {
        const { data, error } = await supabase
          .from("tce_inventory")
          .select("*")
          .order("created_at", { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          const mapped: InventoryItem[] = data.map((row: any) => ({
            id: row.id,
            name: row.name,
            category: row.category,
            sku: row.sku,
            unit: row.unit,
            parLevel: Number(row.par_level),
            quantity: Number(row.quantity),
            unitCost: Number(row.unit_cost),
            supplier: row.supplier || "",
            expirationDate: row.expiration_date || "",
            storageLocation: row.storage_location as "Cooler" | "Freezer" | "Dry Shelf"
          }));
          setInventoryItems(mapped);
          localStorage.setItem("t-cloud-eats-inventory", JSON.stringify(mapped));
          return;
        }
      } catch (e) {
        console.warn("Supabase inventory fetch failed, falling back to localStorage:", e);
      }

      // localStorage fallback
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("t-cloud-eats-inventory");
        if (saved) {
          try {
            setInventoryItems(JSON.parse(saved));
          } catch (e) {
            console.error("Error parsing inventory items:", e);
          }
        }
      }
    };
    loadInventory();
  }, []);

  // Customer CMS States
  const saveInventory = (items: InventoryItem[], upsertItem?: InventoryItem) => {
    setInventoryItems(items);
    localStorage.setItem("t-cloud-eats-inventory", JSON.stringify(items));

    // Persist to Supabase in background
    if (upsertItem) {
      supabase
        .from("tce_inventory")
        .upsert({
          id: upsertItem.id,
          name: upsertItem.name,
          category: upsertItem.category,
          sku: upsertItem.sku,
          unit: upsertItem.unit,
          par_level: upsertItem.parLevel,
          quantity: upsertItem.quantity,
          unit_cost: upsertItem.unitCost,
          supplier: upsertItem.supplier,
          expiration_date: upsertItem.expirationDate || null,
          storage_location: upsertItem.storageLocation
        }, { onConflict: "id" })
        .then(({ error }) => {
          if (error) console.error("Supabase inventory upsert error:", error);
        });
    }
  };
  const [customers, setCustomers] = useState<{ phone: string; name: string; address: string; birthday?: string | null; address_label?: string | null }[]>([]);
  const [showOrderTypeModal, setShowOrderTypeModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerCountryCode, setCustomerCountryCode] = useState("+94");
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);

  // Structured Address States (POS Checkout)
  const [addrHomeNo, setAddrHomeNo] = useState("");
  const [addrStreet, setAddrStreet] = useState("");
  const [addrPostalArea, setAddrPostalArea] = useState("");
  const [addrPostalCode, setAddrPostalCode] = useState("");
  const [originalAutofilledAddress, setOriginalAutofilledAddress] = useState<string | null>(null);
  const [showAddressSelector, setShowAddressSelector] = useState(false);
  const [activeAddressTab, setActiveAddressTab] = useState<"saved" | "new">("saved");
  const [showAllTopSelling, setShowAllTopSelling] = useState(false);

  // Security PIN Pending Actions States
  const [voidTargetOrderId, setVoidTargetOrderId] = useState<string | null>(null);
  const [pendingRemoveItemId, setPendingRemoveItemId] = useState<number | null>(null);
  const [pendingRemoveDelta, setPendingRemoveDelta] = useState<number | null>(null);
  const [isUpdateOrderPending, setIsUpdateOrderPending] = useState(false);
  const [pendingDeleteCustomerPhone, setPendingDeleteCustomerPhone] = useState<string | null>(null);

  // Financial Reports Filter State (Defaults to 'this_month')
  const [reportFilter, setReportFilter] = useState<ReportDateFilter>("this_month");

  // Unclosed Shift Tally Warning Modal State
  const [showUnsettledTallyModal, setShowUnsettledTallyModal] = useState(false);


  // CMS Profiles Modal & Edit States
  const [showCMSModal, setShowCMSModal] = useState(false);
  const [splitModalOrder, setSplitModalOrder] = useState<Order | null>(null);
  const [cmsSearchQuery, setCmsSearchQuery] = useState("");
  const [editingCustomer, setEditingCustomer] = useState<{ phone: string; name: string; address: string; birthday?: string | null; address_label?: string | null } | null>(null);
  const [editCustName, setEditCustName] = useState("");
  const [editCustAddress, setEditCustAddress] = useState("");
  // Structured Address States (CMS Modal)
  const [editAddrHomeNo, setEditAddrHomeNo] = useState("");
  const [editAddrStreet, setEditAddrStreet] = useState("");
  const [editAddrPostalArea, setEditAddrPostalArea] = useState("");
  const [editAddrPostalCode, setEditAddrPostalCode] = useState("");

  const [editCustBirthMonth, setEditCustBirthMonth] = useState("");
  const [editCustBirthDay, setEditCustBirthDay] = useState("");
  const [editCustAddressLabel, setEditCustAddressLabel] = useState("");
  const [isUpdatingCust, setIsUpdatingCust] = useState(false);

  // Custom / Special Order Product State & Logic
  const [showCustomItemModal, setShowCustomItemModal] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [customCategory, setCustomCategory] = useState("Special Orders");
  const [customPortion, setCustomPortion] = useState("Custom Portion");

  const handleOpenCustomItemModal = () => {
    setCustomTitle("");
    setCustomPrice("");
    setCustomCategory("Special Orders");
    setCustomPortion("Custom Portion");
    setShowCustomItemModal(true);
  };

  const handleAddCustomItemToCart = () => {
    if (!customTitle.trim()) {
      triggerToast("Please enter a product name", "warning");
      return;
    }
    const parsedPrice = parseFloat(customPrice);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      triggerToast("Please enter a valid price", "warning");
      return;
    }

    const customMenuItem: MenuItem = {
      id: 900000 + (Date.now() % 100000),
      title: customTitle.trim(),
      price: parsedPrice,
      category: customCategory || "Special Orders",
      portion: customPortion || "Custom Portion",
      sku: "CUSTOM"
    };

    addToCart(customMenuItem);
    setShowCustomItemModal(false);
    setCustomTitle("");
    setCustomPrice("");
  };



  // Synchronize POS Checkout address fields to single customerAddress string
  useEffect(() => {
    let parts = [];
    if (addrHomeNo) parts.push(addrHomeNo);
    if (addrStreet) parts.push(addrStreet);
    if (addrPostalArea) {
      if (addrPostalCode) {
        parts.push(`${addrPostalArea} ${addrPostalCode}`);
      } else {
        parts.push(addrPostalArea);
      }
    }
    setCustomerAddress(parts.join(", "));
  }, [addrHomeNo, addrStreet, addrPostalArea, addrPostalCode]);

  // Synchronize CMS edit address fields to single editCustAddress string
  useEffect(() => {
    let parts = [];
    if (editAddrHomeNo) parts.push(editAddrHomeNo);
    if (editAddrStreet) parts.push(editAddrStreet);
    if (editAddrPostalArea) {
      if (editAddrPostalCode) {
        parts.push(`${editAddrPostalArea} ${editAddrPostalCode}`);
      } else {
        parts.push(editAddrPostalArea);
      }
    }
    setEditCustAddress(parts.join(", "));
  }, [editAddrHomeNo, editAddrStreet, editAddrPostalArea, editAddrPostalCode]);

  // Sync loaded invoice items to cart for editing
  // Realtime Broadcast Session ID and Sync Channel Refs
  const sessionIdRef = useRef<string>("");
  const syncChannelRef = useRef<any>(null);
  const isNetworkUpdateRef = useRef<boolean>(false);

  useEffect(() => {
    sessionIdRef.current = Math.random().toString(36).substring(2, 15);
  }, []);

  const lastLoadedIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (selectedInvoiceId) {
      if (lastLoadedIdRef.current !== selectedInvoiceId) {
        const order = orderHistory.find(o => o.id === selectedInvoiceId);
        if (order) {
          setCart(order.items.map(item => ({ ...item, isNew: false })));
          setDiscountType(order.customer?.discount_type || "percentage");
          setDiscountValue(order.customer?.discount_value || 0);
          let mappedType: "POS" | "Direct" | "3rd Party" | "Dine In" = "POS";
          if (order.type === "Delivery" || order.type === "Direct") {
            mappedType = "Direct";
          } else if (order.type === "3rd Party") {
            mappedType = "3rd Party";
          } else if (order.type === "Dine In") {
            mappedType = "Dine In";
          }
          setOrderType(mappedType);
        }
        lastLoadedIdRef.current = selectedInvoiceId;
      }
    } else {
      if (lastLoadedIdRef.current !== null) {
        setCart([]);
        setDiscountType("percentage");
        setDiscountValue(0);
        lastLoadedIdRef.current = null;
      }
    }
  }, [selectedInvoiceId, orderHistory]);

  // Menu Database State
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemData, setNewItemData] = useState<Partial<MenuItem>>({
    title: "",
    price: 0,
    category: "Fried Rice",
    portion: "Large Portion",
    sku: ""
  });

  const syncOfflineOrders = useCallback(async (offlineOrders: Order[]) => {
    if (isSyncingOfflineRef.current || !offlineOrders || offlineOrders.length === 0) return;
    isSyncingOfflineRef.current = true;
    console.log("[Sync] Triggering sync for offline orders:", offlineOrders);
    let successfullySynced = 0;

    try {
      for (const order of offlineOrders) {
        try {
          const { error } = await supabase
            .from("tce_orders")
            .upsert({
              id: order.id,
              timestamp: order.timestamp,
              items: order.items,
              subtotal: order.subtotal,
              tax: order.tax,
              total: order.total,
              status: order.status,
              type: order.type,
              customer: order.customer
            }, { onConflict: "id" });

          if (error) {
            console.error(`[Sync] Failed to sync order ${order.id}:`, error);
          } else {
            console.log(`[Sync] Successfully synced order ${order.id} to database.`);
            successfullySynced++;
            setOrderHistory(prev => prev.map(o => o.id === order.id ? { ...o, syncedToDb: true } : o));
          }
        } catch (e) {
          console.error(`[Sync] Network error syncing order ${order.id}:`, e);
        }
      }

      if (successfullySynced > 0) {
        // Update localStorage so these orders are permanently marked synced locally
        const localSavedStr = localStorage.getItem("t-cloud-eats-orders");
        if (localSavedStr) {
          try {
            const list = JSON.parse(localSavedStr) as Order[];
            const updatedList = list.map(o => {
              const wasSynced = offlineOrders.some(so => so.id === o.id);
              return wasSynced ? { ...o, syncedToDb: true } : o;
            });
            localStorage.setItem("t-cloud-eats-orders", JSON.stringify(updatedList));
          } catch (storageErr) {
            console.error(storageErr);
          }
        }

        if (!hasShownOfflineSyncToastRef.current) {
          hasShownOfflineSyncToastRef.current = true;
          triggerToast(`Synced ${successfullySynced} offline orders with database`, "success");
        }
      }
    } finally {
      setTimeout(() => {
        isSyncingOfflineRef.current = false;
      }, 3000);
    }
  }, []);

  const loadOrdersAndCMS = useCallback(async (forceRefresh = false) => {
    if (isLoadingRef.current && !forceRefresh) return;
    isLoadingRef.current = true;
    setLoadingOrders(true);

    try {
      // 1. Clean up ignored orders older than 2 days in Supabase in background (non-blocking)
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
      void withTimeout(
        Promise.resolve(
          supabase
            .from("tce_orders")
            .delete()
            .eq("status", "Ignored")
            .lt("timestamp", twoDaysAgo)
        ),
        4000
      ).catch((e) => {
        console.error("Failed to prune expired ignored orders from database:", e);
      });

      // 2. Concurrently fetch orders and customers with 5s timeout
      const [ordersRes, customersRes] = await Promise.allSettled([
        withTimeout(
          Promise.resolve(
            supabase
              .from("tce_orders")
              .select("*")
              .order("timestamp", { ascending: false })
          ),
          5000
        ),
        withTimeout(
          Promise.resolve(
            supabase
              .from("tce_customers")
              .select("*")
          ),
          5000
        )
      ]);

      // Handle Orders response
      if (ordersRes.status === "fulfilled") {
        const { data: dbOrders, error: ordersErr } = ordersRes.value as { data: any[] | null; error: any };
        if (ordersErr) {
          console.error("Supabase orders fetch error, falling back to localStorage", ordersErr);
          const saved = localStorage.getItem("t-cloud-eats-orders");
          if (saved) {
            const list = JSON.parse(saved);
            const filtered = list.filter((o: any) => {
              if (o.status === "Ignored") {
                const ageMs = Date.now() - new Date(o.timestamp).getTime();
                return ageMs <= 2 * 24 * 60 * 60 * 1000;
              }
              return true;
            }).map((o: any) => ({
              ...o,
              payment_status: o.payment_status || (o.customer && o.customer.payment_status) || "Paid",
              syncedToDb: false
            }));
            setOrderHistory(filtered);
          }
        } else if (dbOrders) {
          const formatted = dbOrders.map((o: any) => {
            const parsedCust = typeof o.customer === 'string' ? JSON.parse(o.customer) : o.customer;
            return {
              ...o,
              items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items,
              customer: parsedCust,
              subtotal: Number(o.subtotal),
              tax: Number(o.tax),
              total: Number(o.total),
              payment_status: o.payment_status || (parsedCust && parsedCust.payment_status) || "Paid",
              syncedToDb: true
            };
          });
          const filtered = formatted.filter((o: any) => {
            if (o.status === "Ignored") {
              const ageMs = Date.now() - new Date(o.timestamp).getTime();
              return ageMs <= 2 * 24 * 60 * 60 * 1000;
            }
            return true;
          });

          // Smart Merge: retrieve offline/unsynced orders from localStorage
          const localSavedStr = localStorage.getItem("t-cloud-eats-orders");
          let merged = [...filtered];
          if (localSavedStr) {
            try {
              const localOrders = JSON.parse(localSavedStr) as Order[];
              const dbIds = new Set(filtered.map((o: any) => o.id));
              const offlineUnsynced = localOrders
                .filter(lo => lo && lo.id && !dbIds.has(lo.id))
                .map(lo => ({ ...lo, syncedToDb: false }));
              if (offlineUnsynced.length > 0) {
                merged = [...merged, ...offlineUnsynced].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                console.log("Preserved offline unsynced orders:", offlineUnsynced);

                // Trigger sync in the background only if not already syncing
                if (!isSyncingOfflineRef.current) {
                  syncOfflineOrders(offlineUnsynced);
                }
              }
            } catch (err) {
              console.error("Failed to parse local orders during merge", err);
            }
          }

          setOrderHistory(merged);
          localStorage.setItem("t-cloud-eats-orders", JSON.stringify(merged));

          // On initial load / login, notify the cashier about today's sync count
          if (!hasShownInitialSyncToastRef.current) {
            hasShownInitialSyncToastRef.current = true;
            const todayBizDate = getBusinessDateStr(new Date());
            const todayOrdersCount = merged.filter((o: any) => getBusinessDateStr(o.timestamp) === todayBizDate && o.status !== "Ignored" && o.status !== "Voided").length;

            if (todayOrdersCount > 0) {
              triggerToast(`Synced with database: ${todayOrdersCount} order${todayOrdersCount > 1 ? 's' : ''} for today`, "success");
            } else {
              triggerToast("Synced with database", "success");
            }
          }

          // Clean up payment receipts older than 7 days in the database to clear storage
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          const oldReceiptOrders = filtered.filter((o: any) => {
            const orderDate = new Date(o.timestamp);
            return orderDate < sevenDaysAgo && o.customer && o.customer.payment_receipt;
          });

          if (oldReceiptOrders.length > 0) {
            console.log(`[Cleanup] Found ${oldReceiptOrders.length} orders older than 7 days with payment receipts. Clearing...`);
            oldReceiptOrders.forEach((o: any) => {
              const cleanedCustomer = { ...o.customer };
              delete cleanedCustomer.payment_receipt;
              delete cleanedCustomer.payment_receipt_filename;

              supabase
                .from("tce_orders")
                .update({ customer: cleanedCustomer })
                .eq("id", o.id)
                .then(({ error }) => {
                  if (error) {
                    console.error(`[Cleanup] Failed to clear receipt for order ${o.id}:`, error);
                  } else {
                    console.log(`[Cleanup] Cleared receipt for order ${o.id}`);
                  }
                });
            });
          }
        }
      } else {
        console.error("Orders query timed out or failed:", ordersRes.reason);
        const saved = localStorage.getItem("t-cloud-eats-orders");
        if (saved) {
          const list = JSON.parse(saved);
          const filtered = list.filter((o: any) => {
            if (o.status === "Ignored") {
              const ageMs = Date.now() - new Date(o.timestamp).getTime();
              return ageMs <= 2 * 24 * 60 * 60 * 1000;
            }
            return true;
          });
          setOrderHistory(filtered);
        }
      }

      // Handle Customers response
      if (customersRes.status === "fulfilled") {
        const { data: dbCustomers, error: custErr } = customersRes.value as { data: any[] | null; error: any };
        if (custErr) {
          console.error("Supabase customers fetch error, falling back to localStorage", custErr);
          const savedCms = localStorage.getItem("t-cloud-eats-cms");
          if (savedCms) setCustomers(JSON.parse(savedCms));
        } else if (dbCustomers) {
          setCustomers(dbCustomers);
          localStorage.setItem("t-cloud-eats-cms", JSON.stringify(dbCustomers));
        }
      } else {
        console.error("Customers query timed out or failed:", customersRes.reason);
        const savedCms = localStorage.getItem("t-cloud-eats-cms");
        if (savedCms) setCustomers(JSON.parse(savedCms));
      }
    } finally {
      isLoadingRef.current = false;
      setLoadingOrders(false);
    }
  }, [syncOfflineOrders]);

  // Load order history and CMS from database on mount, fallback to localStorage
  useEffect(() => {
    let currentUser = localStorage.getItem("t-cloud-eats-user");
    if (!currentUser) {
      currentUser = "cashier@t-cloudeats.com";
      localStorage.setItem("t-cloud-eats-user", currentUser);
    }

    const cacheTimeStr = localStorage.getItem("t-cloud-eats-cache-time");
    const cacheTime = cacheTimeStr ? Number(cacheTimeStr) : 0;
    const now = Date.now();
    if (now - cacheTime > 10 * 60 * 1000) {
      // We do NOT clear t-cloud-eats-orders to prevent losing unsynced offline orders.
      localStorage.removeItem("t-cloud-eats-cms");
      console.log("Cache expired (10 minutes). Wiping CMS cache.");
    }
    localStorage.setItem("t-cloud-eats-cache-time", now.toString());

    // Load notifications - filter out any legacy mock alerts
    const savedNotifications = localStorage.getItem(`t-cloud-eats-notifications-${currentUser}`);
    if (savedNotifications) {
      try {
        const list = JSON.parse(savedNotifications);
        const filteredList = Array.isArray(list)
          ? list.filter((n: any) =>
              n &&
              n.text &&
              !n.text.includes("Kitchen Alert") &&
              !n.text.includes("Rider Alert") &&
              !n.text.includes("Google Sync")
            )
          : [];
        setNotificationsList(filteredList);
        setUnreadCount(filteredList.filter((n: any) => !n.read).length);
        localStorage.setItem(`t-cloud-eats-notifications-${currentUser}`, JSON.stringify(filteredList));
      } catch (e) {
        console.error(e);
        setNotificationsList([]);
        setUnreadCount(0);
      }
    } else {
      setNotificationsList([]);
      setUnreadCount(0);
      localStorage.setItem(`t-cloud-eats-notifications-${currentUser}`, JSON.stringify([]));
    }

    loadOrdersAndCMS();

    // Helper to format raw row from Realtime payload
    const formatRealtimeOrder = (o: any): Order => {
      const parsedCust = typeof o.customer === "string" ? JSON.parse(o.customer || "{}") : (o.customer || {});
      const parsedItems = typeof o.items === "string" ? JSON.parse(o.items || "[]") : (o.items || []);
      return {
        ...o,
        items: parsedItems,
        customer: parsedCust,
        subtotal: Number(o.subtotal) || 0,
        tax: Number(o.tax) || 0,
        total: Number(o.total) || 0,
        payment_status: o.payment_status || parsedCust.payment_status || "Paid",
        syncedToDb: true
      };
    };

    // Subscribe to realtime changes on orders & customers with debouncing!
    let realtimeDebounceTimer: NodeJS.Timeout | null = null;
    const triggerDebouncedReload = () => {
      if (realtimeDebounceTimer) clearTimeout(realtimeDebounceTimer);
      realtimeDebounceTimer = setTimeout(() => {
        loadOrdersAndCMS(true);
      }, 1000);
    };

    const ordersChannel = supabase
      .channel("realtime-orders-cms")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tce_orders" },
        (payload: any) => {
          if (!payload) return;

          // 1. Millisecond instant order sync directly from websocket payload
          if (payload.eventType === "INSERT" && payload.new) {
            const newOrder = formatRealtimeOrder(payload.new);
            setOrderHistory(prev => {
              if (prev.some(o => o.id === newOrder.id)) {
                return prev.map(o => o.id === newOrder.id ? { ...o, ...newOrder } : o);
              }
              const next = [newOrder, ...prev];
              try { localStorage.setItem("t-cloud-eats-orders", JSON.stringify(next)); } catch {}
              return next;
            });
          } else if (payload.eventType === "UPDATE" && payload.new) {
            const updatedOrder = formatRealtimeOrder(payload.new);
            setOrderHistory(prev => {
              const next = prev.map(o => o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o);
              try { localStorage.setItem("t-cloud-eats-orders", JSON.stringify(next)); } catch {}
              return next;
            });
          } else if (payload.eventType === "DELETE" && payload.old?.id) {
            const delId = payload.old.id;
            setOrderHistory(prev => {
              const next = prev.filter(o => o.id !== delId);
              try { localStorage.setItem("t-cloud-eats-orders", JSON.stringify(next)); } catch {}
              return next;
            });
          }

          // 2. Detect customer payment slip upload
          if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
            const newRow = payload.new;
            const oldRow = payload.old;
            if (newRow && newRow.customer) {
              try {
                const newCust = typeof newRow.customer === "string" ? JSON.parse(newRow.customer || "{}") : newRow.customer;
                const oldCust = oldRow?.customer ? (typeof oldRow.customer === "string" ? JSON.parse(oldRow.customer || "{}") : oldRow.customer) : null;
                if (newCust?.payment_receipt && (!oldCust || !oldCust.payment_receipt || oldCust.payment_receipt !== newCust.payment_receipt)) {
                  const orderId = newRow.id;
                  const custName = newCust.name || "Customer";
                  const slipNotification = {
                    id: `slip-${orderId}-${Date.now()}`,
                    text: `📄 Payment Slip: ${custName} uploaded payment slip for Order #${orderId}`,
                    time: "Just now",
                    read: false,
                    orderId,
                    bizDate: getBusinessDateStr(newRow.timestamp)
                  };

                  setNotificationsList(prev => {
                    if (prev.some(n => n.orderId === orderId && n.text.includes("Payment Slip"))) {
                      return prev;
                    }
                    const updated = [slipNotification, ...prev];
                    const user = localStorage.getItem("t-cloud-eats-user") || "default";
                    localStorage.setItem(`t-cloud-eats-notifications-${user}`, JSON.stringify(updated));
                    return updated;
                  });
                  setUnreadCount(prev => prev + 1);
                  triggerToast(`📄 Slip uploaded for Order #${orderId} (${custName})`, "info");
                }
              } catch (err) {
                console.error("Error inspecting realtime slip payload", err);
              }
            }
          }
          triggerDebouncedReload();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tce_customers" },
        () => {
          triggerDebouncedReload();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tce_tallies" },
        (payload: any) => {
          // Instant live sync for shift tallies directly from websocket
          if (payload && (payload.eventType === "INSERT" || payload.eventType === "UPDATE") && payload.new) {
            const t = payload.new;
            const record = {
              openingBalance: Number(t.opening_balance) || 0,
              bankTransfer: Number(t.bank_transfer) || 0,
              actualCash: Number(t.actual_cash) || 0,
              expenses: typeof t.expenses === "string" ? JSON.parse(t.expenses) : (t.expenses || []),
              carry_forward: Number(t.carry_forward) || 0,
              discrepancy: Number(t.discrepancy) || 0,
              submitted: t.submitted ?? false,
              submitted_at: t.submitted_at,
              submitted_by: t.submitted_by
            };
            setAllTalliesMap(prev => ({ ...prev, [t.id]: record }));
            if (t.id === selectedLogBizDateStr) {
              setOpeningBalance(record.openingBalance);
              setBankTransfer(record.bankTransfer);
              setActualCash(record.actualCash);
              setOperationalExpenses(record.expenses);
              setTallySubmitted(record.submitted);
            }
          }
          triggerDebouncedReload();
        }
      )
      .subscribe();

    return () => {
      if (realtimeDebounceTimer) clearTimeout(realtimeDebounceTimer);
      supabase.removeChannel(ordersChannel);
    };
  }, [loadOrdersAndCMS]);

  // Load menu items from database on mount and subscribe to Realtime updates
  useEffect(() => {
    // Instant localStorage hydration for zero-wait initial render
    try {
      const cachedMenu = localStorage.getItem("t-cloud-eats-menu-cache");
      if (cachedMenu) {
        const parsed = JSON.parse(cachedMenu);
        if (Array.isArray(parsed) && parsed.length > 0) setMenuItems(parsed);
      }
      const cachedOrders = localStorage.getItem("t-cloud-eats-orders");
      if (cachedOrders) {
        const parsed = JSON.parse(cachedOrders);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setOrderHistory((prev) => (prev.length === 0 ? parsed : prev));
        }
      }
      const cachedCustomers = localStorage.getItem("t-cloud-eats-customers");
      if (cachedCustomers) {
        const parsed = JSON.parse(cachedCustomers);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCustomers((prev) => (prev.length === 0 ? parsed : prev));
        }
      }
    } catch {
      // Ignore cache parse errors
    }

    async function loadMenu() {
      try {
        const res = await fetch("/api/menu");
        if (res.ok) {
          const data = await res.json();
          setMenuItems(data);
          try {
            localStorage.setItem("t-cloud-eats-menu-cache", JSON.stringify(data));
          } catch {
            // Ignore quota errors
          }
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
        { event: "*", schema: "public", table: "tce_menu_items" },
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

  // Realtime Broadcast Sync Listener (Receive state drafts from other tabs/devices)
  useEffect(() => {
    const channel = supabase.channel("pos-draft-sync", {
      config: {
        broadcast: { self: false }
      }
    });

    channel
      .on("broadcast", { event: "draft-update" }, ({ payload }) => {
        if (!payload || payload.senderId === sessionIdRef.current) return;

        console.log("[Broadcast Sync] Received state update:", payload);

        // Block outgoing sync triggers during network state updates to prevent loopback/echoes
        isNetworkUpdateRef.current = true;

        if (payload.cart !== undefined) setCart(payload.cart);
        if (payload.selectedInvoiceId !== undefined) setSelectedInvoiceId(payload.selectedInvoiceId);
        if (payload.activeSidebar !== undefined) setActiveSidebar(payload.activeSidebar);
        if (payload.orderType !== undefined) {
          let mappedType: "POS" | "Direct" | "3rd Party" | "Dine In" = "POS";
          if (payload.orderType === "Delivery" || payload.orderType === "Direct") {
            mappedType = "Direct";
          } else if (payload.orderType === "3rd Party") {
            mappedType = "3rd Party";
          } else if (payload.orderType === "Dine In") {
            mappedType = "Dine In";
          }
          setOrderType(mappedType);
        }
        if (payload.customerPhone !== undefined) setCustomerPhone(payload.customerPhone);
        if (payload.customerName !== undefined) setCustomerName(payload.customerName);
        if (payload.customerAddress !== undefined) setCustomerAddress(payload.customerAddress);
        if (payload.showCustomerModal !== undefined) setShowCustomerModal(payload.showCustomerModal);
        if (payload.activeAddressTab !== undefined) setActiveAddressTab(payload.activeAddressTab);

        // Reset the update block once layout/rendering cycles complete
        setTimeout(() => {
          isNetworkUpdateRef.current = false;
        }, 100);
      })
      .subscribe();

    syncChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Realtime Broadcast Sync Sender (Send local state drafts to other tabs/devices)
  useEffect(() => {
    if (!sessionIdRef.current || !syncChannelRef.current) return;
    if (isNetworkUpdateRef.current) return; // Do not broadcast state updates received from network

    const channel = syncChannelRef.current;

    const timeoutId = setTimeout(() => {
      if (isNetworkUpdateRef.current) return;
      channel.send({
        type: "broadcast",
        event: "draft-update",
        payload: {
          senderId: sessionIdRef.current,
          cart,
          selectedInvoiceId,
          activeSidebar,
          orderType,
          customerPhone,
          customerName,
          customerAddress,
          showCustomerModal,
          activeAddressTab
        }
      });
    }, 800); // 800ms debounce to minimize network usage and avoid duplicate echo loops

    return () => clearTimeout(timeoutId);
  }, [cart, selectedInvoiceId, activeSidebar, orderType, customerPhone, customerName, customerAddress, showCustomerModal, activeAddressTab]);

  // Security Admin PIN State
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(true);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinPurpose, setPinPurpose] = useState<"menu" | "prices" | "delete_customer">("menu");

  const renderAdminMetric = (value: React.ReactNode, textClass: string = "") => {
    if (isAdminUnlocked) {
      return (
        <span className={`inline-flex items-center gap-1.5 ${textClass}`}>
          {value}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsAdminUnlocked(false);
              triggerToast("Data locked", "info");
            }}
            className="text-slate-500 hover:text-slate-700 transition-colors p-0.5 cursor-pointer flex items-center justify-center"
            title="Lock sensitive data"
          >
            <Eye size={12} />
          </button>
        </span>
      );
    }

    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setPinPurpose("prices");
          setShowPinModal(true);
          setPinInput("");
          setPinError("");
        }}
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer border border-slate-200 ${textClass}`}
        title="Click to enter PIN to unlock data"
      >
        <span className="font-mono tracking-widest text-slate-500 text-xs">••••</span>
        <EyeOff size={11} className="text-slate-500" />
      </button>
    );
  };

  // Receipt Modal State
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [latestOrder, setLatestOrder] = useState<Order | null>(null);

  // Toast State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Notification States
  interface CashierNotificationItem {
    id: string | number;
    text: string;
    time: string;
    read: boolean;
    orderId?: string | number;
    bizDate?: string;
  }

  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsList, setNotificationsList] = useState<CashierNotificationItem[]>([]);

  const triggerToast = (message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const saveNotifications = (newList: CashierNotificationItem[]) => {
    setNotificationsList(newList);
    setUnreadCount(newList.filter(n => !n.read).length);
    const user = localStorage.getItem("t-cloud-eats-user") || "default";
    localStorage.setItem(`t-cloud-eats-notifications-${user}`, JSON.stringify(newList));
  };

  const slideCacheWindow = () => {
    localStorage.setItem("t-cloud-eats-cache-time", Date.now().toString());
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

  const triggerBackgroundPosSync = useCallback(() => {
    fetch("/api/accounting/pos-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ limit: 500 }),
    }).catch(() => { });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      triggerBackgroundPosSync();
    }, 1200);
    return () => clearTimeout(timer);
  }, [triggerBackgroundPosSync]);

  const updateOrderStatus = async (orderId: string, newStatus: Order["status"]) => {
    const isIgnoring = newStatus === "Ignored";
    const newOrderId = isIgnoring ? orderId.replace(/^INV-/, "IGNORED-") : orderId;

    // 1. Update local state
    const updatedHistory = orderHistory.map(o => {
      if (o.id === orderId) {
        return { ...o, id: newOrderId, status: newStatus };
      }
      return o;
    });
    setOrderHistory(updatedHistory);
    localStorage.setItem("t-cloud-eats-orders", JSON.stringify(updatedHistory));

    if (isIgnoring && selectedInvoiceId === orderId) {
      setSelectedInvoiceId(null);
    }

    // 2. Add Live notification trigger
    slideCacheWindow();
    if (newStatus === "Ready") {
      const updatedList = [
        { id: Date.now(), text: `🍲 Kitchen Alert: Order ${orderId} is ready for Pick Up!`, time: "Just now", read: false },
        ...notificationsList
      ];
      saveNotifications(updatedList);
    } else if (newStatus === "Dispatched") {
      const updatedList = [
        { id: Date.now(), text: `🛵 Rider Alert: Order ${orderId} has been dispatched!`, time: "Just now", read: false },
        ...notificationsList
      ];
      saveNotifications(updatedList);
    } else if (newStatus === "Completed") {
      const targetOrder = updatedHistory.find(o => o.id === newOrderId);
      if (targetOrder) {
        setLatestOrder(targetOrder);
        setShowReceiptModal(true);
      }
    }

    // 3. Update Supabase in background
    const updatePayload: any = { status: newStatus };
    if (isIgnoring) {
      updatePayload.id = newOrderId;
    }

    Promise.resolve(
      supabase
        .from("tce_orders")
        .update(updatePayload)
        .eq("id", orderId)
    )
      .then(({ error }) => {
        if (error) {
          console.error("Supabase order status update error:", error);
          triggerToast("Saved locally, database update failed", "warning");
        } else {
          triggerToast(isIgnoring ? `Order ignored & invoice number removed` : `Order ${orderId} marked as ${newStatus}`, "success");
          triggerBackgroundPosSync();
        }
      })
      .catch((e: any) => {
        console.error("Network error updating order status:", e);
        triggerToast("Saved locally, offline mode active", "warning");
      });
  };

  const handlePaymentStatusChange = async (
    orderId: string,
    newPaymentMode: "Cash" | "Account Transfer" | "Credit" | "Split" | "Paid" | "Not Paid",
    splitDetails?: { cashAmount: number; bankAmount: number; settledBizDate?: string }
  ) => {
    // 1. Optimistically update local state & localStorage
    const target = orderHistory.find(o => o.id === orderId);
    if (!target) return;

    if (newPaymentMode === "Split" && !splitDetails) {
      setSplitModalOrder(target);
      return;
    }

    let finalMethod = target.customer?.payment_method || "Cash";
    let finalStatus: "Paid" | "Not Paid" = "Paid";
    let splitCash = target.customer?.split_cash_amount;
    let splitBank = target.customer?.split_bank_amount;
    let settledAt = target.customer?.settled_at;
    let settledBizDate = target.customer?.settled_biz_date;
    const todayStr = getTodayDateStr();

    if (newPaymentMode === "Cash") {
      finalMethod = "Cash";
      finalStatus = "Paid";
      splitCash = undefined;
      splitBank = undefined;
      settledAt = new Date().toISOString();
      settledBizDate = todayStr;
    } else if (newPaymentMode === "Account Transfer") {
      finalMethod = "Bank transfer";
      finalStatus = "Paid";
      splitCash = undefined;
      splitBank = undefined;
      settledAt = new Date().toISOString();
      settledBizDate = todayStr;
    } else if (newPaymentMode === "Credit" || newPaymentMode === "Not Paid") {
      finalMethod = "Credit";
      finalStatus = "Not Paid";
      splitCash = undefined;
      splitBank = undefined;
      settledAt = undefined;
      settledBizDate = undefined;
    } else if (newPaymentMode === "Split") {
      finalMethod = "Split";
      finalStatus = "Paid";
      splitCash = splitDetails?.cashAmount ?? 0;
      splitBank = splitDetails?.bankAmount ?? 0;
      settledAt = new Date().toISOString();
      settledBizDate = splitDetails?.settledBizDate || todayStr;
    } else if (newPaymentMode === "Paid") {
      finalMethod = finalMethod === "Credit" ? "Cash" : finalMethod;
      finalStatus = "Paid";
      settledAt = new Date().toISOString();
      settledBizDate = todayStr;
    }

    const updatedCustomer: CustomerDetails = {
      ...(target.customer || { phone: "", name: "", address: "" }),
      payment_method: finalMethod,
      payment_status: finalStatus,
      split_cash_amount: splitCash,
      split_bank_amount: splitBank,
      settled_at: settledAt,
      settled_biz_date: settledBizDate
    };

    const updatedHistory = orderHistory.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          payment_status: finalStatus,
          customer: updatedCustomer
        };
      }
      return o;
    });

    setOrderHistory(updatedHistory);
    localStorage.setItem("t-cloud-eats-orders", JSON.stringify(updatedHistory));
    slideCacheWindow();

    // 2. Immediately push update to database (Supabase)
    try {
      const { error } = await supabase
        .from("tce_orders")
        .update({
          customer: updatedCustomer
        })
        .eq("id", orderId);

      if (error) {
        console.error("Supabase payment status update error:", error);
        triggerToast("Saved locally, database sync pending", "warning");
      } else {
        triggerToast(`Order ${orderId} payment set to ${newPaymentMode}`, "success");
      }
    } catch (err) {
      console.error("Network error updating payment status:", err);
      triggerToast("Saved locally (offline mode active)", "warning");
    }
  };

  const handleVoidOrder = (orderId: string) => {
    if (window.confirm(`Are you sure you want to void order ${orderId}?`)) {
      updateOrderStatus(orderId, "Voided");
    }
  };

  const handleStatusAdvance = () => {
    if (!selectedOrder) return;
    let nextStatus: Order["status"] = "Completed";
    if (selectedOrder.status === "Preparing") {
      nextStatus = "Ready";
    } else if (selectedOrder.status === "Ready") {
      if (selectedOrder.type === "Delivery" || selectedOrder.type === "Direct") {
        nextStatus = "Dispatched";
      } else {
        nextStatus = "Completed";
      }
    } else if (selectedOrder.status === "Dispatched") {
      nextStatus = "Completed";
    }

    updateOrderStatus(selectedOrder.id, nextStatus);
  };

  const handleSaveCustomer = async () => {
    if (!editingCustomer) return;
    setIsUpdatingCust(true);

    let birthdayIso = null;
    if (editCustBirthMonth && editCustBirthDay) {
      birthdayIso = new Date(`2000-${editCustBirthMonth}-${editCustBirthDay}T00:00:00`).toISOString();
    }

    const updatedCmsCustomer = {
      phone: editingCustomer.phone,
      name: editCustName,
      address: editCustAddress,
      birthday: birthdayIso,
      address_label: editCustAddressLabel || null
    };

    // Update locally immediately
    setCustomers(prev =>
      prev.map(c => c.phone === editingCustomer.phone ? updatedCmsCustomer : c)
    );

    // Update customer details in all past orders locally
    const updatedHistory = orderHistory.map(o => {
      if (o.customer && o.customer.phone === editingCustomer.phone) {
        return {
          ...o,
          customer: {
            ...o.customer,
            name: editCustName,
            address: editCustAddress,
            address_label: editCustAddressLabel || null
          }
        };
      }
      return o;
    });
    setOrderHistory(updatedHistory);
    localStorage.setItem("t-cloud-eats-orders", JSON.stringify(updatedHistory));

    // Close modal
    setEditingCustomer(null);
    setIsUpdatingCust(false);

    // Save to Supabase in background
    Promise.resolve(
      supabase
        .from("tce_customers")
        .update({
          name: editCustName,
          address: editCustAddress,
          birthday: birthdayIso,
          address_label: editCustAddressLabel || null
        })
        .eq("phone", editingCustomer.phone)
    )
      .then(({ error }) => {
        if (error) {
          console.error("Supabase customer update error", error);
          triggerToast("Saved locally, cloud update failed", "warning");
        } else {
          triggerToast("Customer profile updated successfully!", "success");

          // Update customer details in all past orders in Supabase
          const updatedCustObj = {
            phone: editingCustomer.phone,
            name: editCustName,
            address: editCustAddress,
            address_label: editCustAddressLabel || null
          };

          Promise.resolve(
            supabase
              .from("tce_orders")
              .update({ customer: updatedCustObj })
              .eq("customer->>phone", editingCustomer.phone)
          )
            .then(({ error: orderUpdateErr }) => {
              if (orderUpdateErr) {
                console.error("Supabase order customer info update error:", orderUpdateErr);
              }
            })
            .catch((dbErr: any) => {
              console.error("Error updating orders table for customer profile change:", dbErr);
            });
        }
      })
      .catch((e: any) => {
        console.error("Network error updating customer:", e);
        triggerToast("Saved locally, offline mode active", "warning");
      });
  };

  const handleConfirmDeleteCustomer = async (phone: string) => {
    const customerToDelete = customers.find(c => c.phone === phone);
    const customerName = customerToDelete ? customerToDelete.name : phone;

    // 1. Update local state & localStorage
    const updatedCustomers = customers.filter(c => c.phone !== phone);
    setCustomers(updatedCustomers);
    localStorage.setItem("t-cloud-eats-cms", JSON.stringify(updatedCustomers));
    if (editingCustomer && editingCustomer.phone === phone) {
      setEditingCustomer(null);
    }

    // 2. Delete from Supabase in background
    try {
      const { error } = await supabase
        .from("tce_customers")
        .delete()
        .eq("phone", phone);

      if (error) {
        console.error("Supabase customer delete error:", error);
        triggerToast("Deleted locally, database sync failed", "warning");
      } else {
        triggerToast(`Profile for ${customerName} deleted successfully`, "success");
      }
    } catch (err) {
      console.error("Network error deleting customer:", err);
      triggerToast("Deleted locally (offline mode active)", "warning");
    }
  };

  const handleDeleteCustomerClick = (phone: string) => {
    if (window.confirm("Are you sure you want to permanently delete this customer profile?")) {
      handleConfirmDeleteCustomer(phone);
    }
  };

  const handlePhoneChange = (val: string, cc: string = customerCountryCode) => {
    setCustomerPhone(val);

    // Check if the Sri Lankan number starts with 0
    let processedNum = val.trim().replace(/\D/g, "");
    if (cc === "+94" && processedNum.startsWith("0")) {
      processedNum = processedNum.substring(1);
    }
    const formattedPhone = `${cc}${processedNum}`;

    const existing = customers.find(c => c.phone === formattedPhone);
    if (existing) {
      setCustomerName(existing.name);
      setCustomerAddress(existing.address);
      const parsed = parseAddress(existing.address);
      setAddrHomeNo(parsed.homeNo);
      setAddrStreet(parsed.street);
      setAddrPostalArea(parsed.postalArea);
      setAddrPostalCode(parsed.postalCode);
      setOriginalAutofilledAddress(existing.address);
      setShowAddressSelector(false);
      setActiveAddressTab("saved");
    } else {
      setAddrHomeNo("");
      setAddrStreet("");
      setAddrPostalArea("");
      setAddrPostalCode("");
      setOriginalAutofilledAddress(null);
      setShowAddressSelector(false);
      setActiveAddressTab("new");
    }
  };

  const handleUpdateOrder = async () => {
    if (!selectedInvoiceId) return;

    const existingOrder = orderHistory.find(o => o.id === selectedInvoiceId);
    if (existingOrder) {
      const withinHour = isWithinOneHour(existingOrder.timestamp);
      if (!withinHour && !isAdminUnlocked) {
        setIsUpdateOrderPending(true);
        setPinPurpose("prices");
        setShowPinModal(true);
        setPinInput("");
        setPinError("");
        triggerToast("PIN required to update order older than 1 hour", "warning");
        return;
      }
    }

    const newSubtotal = cart.reduce((sum, item) => sum + getItemUnitPrice(item) * item.quantity, 0);
    const newTax = 0;
    const newDiscountAmount = discountType === "percentage" ? (newSubtotal * discountValue) / 100 : discountValue;
    const newTotal = Math.max(0, newSubtotal - newDiscountAmount) + (existingOrder?.delivery_fee || 0);

    // Strip temporary isNew flag from items before saving
    const cleanCart = cart.map(item => {
      const { isNew, ...rest } = item;
      return rest;
    });

    const updatedCustomer = existingOrder ? {
      ...existingOrder.customer,
      discount_type: discountType,
      discount_value: discountValue,
      discount_amount: newDiscountAmount,
      delivery_fee: existingOrder.delivery_fee
    } : undefined;

    // 1. Update local state
    const updatedHistory = orderHistory.map(o => {
      if (o.id === selectedInvoiceId) {
        return {
          ...o,
          items: cleanCart,
          subtotal: newSubtotal,
          tax: newTax,
          total: newTotal,
          customer: updatedCustomer as any
        };
      }
      return o;
    });
    setOrderHistory(updatedHistory);
    localStorage.setItem("t-cloud-eats-orders", JSON.stringify(updatedHistory));

    // 2. Update Supabase in background
    Promise.resolve(
      supabase
        .from("tce_orders")
        .update({
          items: cleanCart,
          subtotal: newSubtotal,
          tax: newTax,
          total: newTotal,
          customer: updatedCustomer
        })
        .eq("id", selectedInvoiceId)
    )
      .then(({ error }) => {
        if (error) {
          console.error("Supabase order update error:", error);
          triggerToast("Saved locally, database update failed", "warning");
        } else {
          triggerToast("Order updated successfully", "success");
        }
      })
      .catch((e: any) => {
        console.error("Network error updating order:", e);
        triggerToast("Saved locally, offline mode active", "warning");
      });

    slideCacheWindow();
    setCart([]);
    setDiscountType("percentage");
    setDiscountValue(0);
    setSelectedInvoiceId(null);
  };

  const handlePlaceOrderClick = () => {
    if (cart.length === 0) {
      triggerToast("Ticket is empty", "warning");
      return;
    }
    if (unclosedPastShiftInfo) {
      triggerToast(`Previous shift (${unclosedPastShiftInfo.formattedDate}) tally is unsettled!`, "error");
      setShowUnsettledTallyModal(true);
      return;
    }
    setShowOrderTypeModal(true);
  };

  const handleSelectOrderType = (selectedType: "Delivery" | "Take Away" | "3rd Party" | "Dine In") => {
    setOrderType(
      selectedType === "Delivery"
        ? "Direct"
        : selectedType === "Take Away"
          ? "POS"
          : selectedType === "3rd Party"
            ? "3rd Party"
            : "Dine In"
    );
    setShowOrderTypeModal(false);
    setShowCustomerModal(true);
    setCustomerPhone("");
    setCustomerName("");
    setCustomerAddress("");
    setShowNameSuggestions(false);
    setAddrHomeNo("");
    setAddrStreet("");
    setAddrPostalArea("");
    setAddrPostalCode("");
  };

  const handleConfirmPlaceOrder = async () => {
    if (unclosedPastShiftInfo) {
      triggerToast(`Previous shift (${unclosedPastShiftInfo.formattedDate}) tally is unsettled!`, "error");
      setShowUnsettledTallyModal(true);
      return;
    }

    if (!customerPhone || !customerName) {
      triggerToast("Please enter name and phone number", "warning");
      return;
    }

    // Process phone number
    let processedNum = customerPhone.trim().replace(/\D/g, "");
    if (customerCountryCode === "+94" && processedNum.startsWith("0")) {
      processedNum = processedNum.substring(1);
    }
    const formattedPhone = `${customerCountryCode}${processedNum}`;

    const newCustomer = { phone: formattedPhone, name: customerName, address: customerAddress };

    setIsPlacingOrder(true);

    try {
      // 1. Update local CMS state and localStorage
      const updatedCms = [newCustomer, ...customers.filter(c => c.phone !== formattedPhone)];
      setCustomers(updatedCms);
      localStorage.setItem("t-cloud-eats-cms", JSON.stringify(updatedCms));

      // 2. Create new order in "Preparing" status
      const orderDateObj = orderBookingDate
        ? new Date(orderBookingDate.includes("T") ? orderBookingDate : `${orderBookingDate}T12:00:00`)
        : new Date();
      const newInvoiceId = getNextInvoiceNumber(orderHistory, orderDateObj);
      const cleanHistory = orderHistory.filter(o => o.id !== newInvoiceId);

      const finalDeliveryFee = orderType === "Direct" ? (deliveryFee || 0) : 0;
      const finalTotal = Math.max(0, subtotal - discountAmount) + finalDeliveryFee;

      const customerDetails: CustomerDetails = {
        ...newCustomer,
        discount_type: discountType,
        discount_value: discountValue,
        discount_amount: discountAmount,
        delivery_fee: finalDeliveryFee,
        payment_status: "Paid" // Default to Paid
      };

      const newOrder: Order = {
        id: newInvoiceId,
        timestamp: orderDateObj.toISOString(),
        items: cart,
        subtotal,
        tax,
        delivery_fee: finalDeliveryFee,
        total: finalTotal,
        status: "Preparing",
        type: orderType === "POS" ? "Take Away" : orderType === "Direct" ? "Delivery" : orderType,
        payment_status: "Paid",
        customer: customerDetails,
        syncedToDb: false
      };

      // 3. Update local order logs state and localStorage immediately
      const updatedHistory = [newOrder, ...cleanHistory];
      setOrderHistory(updatedHistory);
      localStorage.setItem("t-cloud-eats-orders", JSON.stringify(updatedHistory));

      // 4. Immediately push customer and order to Supabase with 5-second timeout limit
      try {
        const [custRes, orderRes] = await withTimeout(
          Promise.all([
            supabase
              .from("tce_customers")
              .upsert(newCustomer, { onConflict: "phone" }),
            supabase
              .from("tce_orders")
              .upsert({
                id: newInvoiceId,
                timestamp: newOrder.timestamp,
                items: newOrder.items,
                subtotal: newOrder.subtotal,
                tax: newOrder.tax,
                total: newOrder.total,
                status: newOrder.status,
                type: newOrder.type,
                customer: newOrder.customer
              }, { onConflict: "id" })
          ]),
          5000 // Strict 5-second max timeout
        );

        if (orderRes.error) {
          console.error("Supabase order upsert error:", orderRes.error);
          triggerToast("Poor connection! Order saved locally and will auto-sync when online.", "warning");
        } else {
          newOrder.syncedToDb = true;
          setOrderHistory(prev => prev.map(o => o.id === newInvoiceId ? { ...o, syncedToDb: true } : o));
          triggerToast(`Order ${newInvoiceId} placed & synced in real-time!`, "success");
          triggerBackgroundPosSync();
        }
      } catch (dbErr) {
        console.error("Network or timeout error saving order to DB:", dbErr);
        triggerToast("Poor connection! Order saved locally and will auto-sync when online.", "warning");
      }

      // 5. Silent in-memory background refresh (Ctrl+R effect without page reload)
      slideCacheWindow();
      setCart([]);
      setDiscountType("percentage");
      setDiscountValue(0);
      setShowCustomerModal(false);
      setOrderBookingDate(null);

      // Trigger background re-validation from DB
      loadOrdersAndCMS(true);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Cart Functions
  const addToCart = (item: MenuItem) => {
    if (selectedInvoiceId) {
      const loadedOrder = orderHistory.find(o => o.id === selectedInvoiceId);
      if (!loadedOrder) return;
      if (loadedOrder.status === "Voided" || loadedOrder.status === "Ignored") {
        triggerToast("This order is voided or ignored and cannot be modified", "warning");
        return;
      }
    }
    setCart(prev => {
      const isEditingLoadedOrder = !!selectedInvoiceId;
      const existing = prev.find(i => i.menuItem.id === item.id && (!isEditingLoadedOrder || i.isNew === true));
      if (existing) {
        return prev.map(i => (i.menuItem.id === item.id && (!isEditingLoadedOrder || i.isNew === true)) ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { menuItem: item, quantity: 1, isNew: isEditingLoadedOrder }];
    });
    triggerToast(`Added ${item.title} to ticket`, "success");
  };

  const updateQuantity = (itemId: number, delta: number) => {
    if (selectedInvoiceId) {
      const loadedOrder = orderHistory.find(o => o.id === selectedInvoiceId);
      if (!loadedOrder) return;
      if (loadedOrder.status === "Voided" || loadedOrder.status === "Ignored") {
        triggerToast("This order is voided or ignored and cannot be modified", "warning");
        return;
      }

      const withinHour = isWithinOneHour(loadedOrder.timestamp);
      if (delta < 0) {
        const cartItem = cart.find(ci => ci.menuItem.id === itemId);
        const isPersistedItem = cartItem && !cartItem.isNew;
        if (!withinHour && isPersistedItem && !isAdminUnlocked) {
          setPendingRemoveItemId(itemId);
          setPendingRemoveDelta(delta);
          setPinPurpose("prices");
          setShowPinModal(true);
          setPinInput("");
          setPinError("");
          triggerToast("PIN required to decrease item in order older than 1 hour", "warning");
          return;
        }
      }
    }
    setCart(prev => {
      const isEditingLoadedOrder = !!selectedInvoiceId;
      return prev.map(item => {
        if (item.menuItem.id === itemId && (!isEditingLoadedOrder || item.isNew === true || isAdminUnlocked || (selectedInvoiceId && isWithinOneHour(orderHistory.find(o => o.id === selectedInvoiceId)?.timestamp || "")))) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (itemId: number) => {
    if (selectedInvoiceId) {
      const loadedOrder = orderHistory.find(o => o.id === selectedInvoiceId);
      if (!loadedOrder) return;
      if (loadedOrder.status === "Voided" || loadedOrder.status === "Ignored") {
        triggerToast("This order is voided or ignored and cannot be modified", "warning");
        return;
      }

      const withinHour = isWithinOneHour(loadedOrder.timestamp);
      const cartItem = cart.find(ci => ci.menuItem.id === itemId);
      const isPersistedItem = cartItem && !cartItem.isNew;
      if (!withinHour && isPersistedItem && !isAdminUnlocked) {
        setPendingRemoveItemId(itemId);
        setPendingRemoveDelta(null);
        setPinPurpose("prices");
        setShowPinModal(true);
        setPinInput("");
        setPinError("");
        triggerToast("PIN required to remove item from order older than 1 hour", "warning");
        return;
      }
    }
    setCart(prev => {
      return prev.filter(item => item.menuItem.id !== itemId);
    });
    triggerToast("Item removed from ticket", "info");
  };

  const toggleFreeItem = (itemId: number, isNew?: boolean) => {
    if (selectedInvoiceId) {
      const loadedOrder = orderHistory.find(o => o.id === selectedInvoiceId);
      if (!loadedOrder) return;
      if (loadedOrder.status === "Voided" || loadedOrder.status === "Ignored") {
        triggerToast("This order is voided or ignored and cannot be modified", "warning");
        return;
      }
    }
    setCart(prev => prev.map(ci => {
      const itemMatch = ci.menuItem.id === itemId && (!selectedInvoiceId || ci.isNew === isNew);
      if (itemMatch) {
        const nextState = !ci.isFree;
        const title = ci.menuItem ? ci.menuItem.title : (ci as any).title || "Item";
        triggerToast(nextState ? `Marked ${title} as FREE ITEM` : `Removed free status from ${title}`, nextState ? "success" : "info");
        return { ...ci, isFree: nextState };
      }
      return ci;
    }));
  };

  // Financial Calculations
  const subtotal = cart.reduce((sum, item) => sum + getItemUnitPrice(item) * item.quantity, 0);
  const tax = 0;
  const discountAmount = useMemo(() => {
    if (discountType === "percentage") {
      return (subtotal * discountValue) / 100;
    } else {
      return discountValue;
    }
  }, [subtotal, discountType, discountValue]);
  const total = Math.max(0, subtotal - discountAmount);

  const selectedOrder = useMemo(() => {
    if (!selectedInvoiceId) return null;
    return orderHistory.find(o => o.id === selectedInvoiceId) || null;
  }, [selectedInvoiceId, orderHistory]);

  const displayedItems = cart;
  const displayedSubtotal = subtotal;
  const displayedTax = tax;
  const displayedTotal = total;
  const selectedOrderType = selectedOrder ? selectedOrder.type : orderType;

  const currentBizDate = useMemo(() => getBusinessDateStr(new Date()), []);

  const selectedLogBizDateStr = useMemo(() => {
    const parts = selectedLogDate.split("-");
    if (parts.length === 3) {
      return `${parts[0].slice(-2)}${parts[1]}${parts[2]}`;
    }
    return getBusinessDateStr(new Date());
  }, [selectedLogDate]);

  const todaysOrders = useMemo(() => {
    return orderHistory.filter(order => {
      const isSelectedDate = getBusinessDateStr(order.timestamp) === selectedLogBizDateStr;
      const isNotVoidOrIgnore = order.status !== "Voided" && order.status !== "Ignored";
      return isSelectedDate && isNotVoidOrIgnore;
    });
  }, [orderHistory, selectedLogBizDateStr]);

  const todaysAllOrders = useMemo(() => {
    return orderHistory.filter(order => getBusinessDateStr(order.timestamp) === selectedLogBizDateStr);
  }, [orderHistory, selectedLogBizDateStr]);

  // --- SHIFT CLOSING TALLY STATE & LOGIC ---
  const EXPENSE_CATEGORIES = useMemo(() => [
    "Ingredients / Groceries",
    "Salary",
    "Electricity (Light Bill)",
    "Water Bill",
    "LP Gas Refill (Operational)",
    "Internet & Telecommunication",
    "Kitchen Rent",
    "Smallwares & Kitchen Utensils",
    "Cleaning & Hygiene Supplies",
    "Supplier Payments",
    "Fuel & Transport",
    "Staff Meals & Expenses",
    "Repairs & Maintenance",
    "Petty Cash / Miscellaneous",
    "Others"
  ], []);

  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [bankTransfer, setBankTransfer] = useState<number>(0);
  const [actualCash, setActualCash] = useState<number>(0);
  const [operationalExpenses, setOperationalExpenses] = useState<{ id: string; category: string; description: string; amount: number }[]>([]);
  const [newExpenseCategory, setNewExpenseCategory] = useState<string>("Ingredients / Groceries");
  const [newExpenseDesc, setNewExpenseDesc] = useState<string>("");
  const [newExpenseAmt, setNewExpenseAmt] = useState<string>("");
  const [tallySubmitted, setTallySubmitted] = useState<boolean>(false);

  // Automatic Credit (Unpaid) Orders detection for selectedLogBizDateStr
  const todaysCreditOrders = useMemo(() => {
    return todaysOrders.filter(o => o.payment_status === "Not Paid" || o.customer?.payment_status === "Not Paid");
  }, [todaysOrders]);

  const todaysCreditAmount = useMemo(() => {
    return todaysCreditOrders.reduce((sum, o) => sum + o.total, 0);
  }, [todaysCreditOrders]);

  // Map of all shift tallies for fast check and carry-forward calculation
  const [allTalliesMap, setAllTalliesMap] = useState<Record<string, any>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("t-cloud-eats-shift-tallies");
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {};
  });

  const fetchAllTallies = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("tce_tallies").select("*");
      if (!error && data) {
        const map: Record<string, any> = {};
        for (const item of data) {
          map[item.id] = {
            openingBalance: Number(item.opening_balance) || 0,
            bankTransfer: Number(item.bank_transfer) || 0,
            actualCash: Number(item.actual_cash) || 0,
            expenses: typeof item.expenses === "string" ? JSON.parse(item.expenses) : (item.expenses || []),
            carry_forward: Number(item.carry_forward) || 0,
            discrepancy: Number(item.discrepancy) || 0,
            submitted: item.submitted ?? false,
            submitted_at: item.submitted_at,
            submitted_by: item.submitted_by
          };
        }
        setAllTalliesMap(prev => ({ ...prev, ...map }));
        try {
          const localStr = localStorage.getItem("t-cloud-eats-shift-tallies") || "{}";
          const localMap = JSON.parse(localStr);
          localStorage.setItem("t-cloud-eats-shift-tallies", JSON.stringify({ ...localMap, ...map }));
        } catch (e) {
          console.error(e);
        }
      }
    } catch (err) {
      console.error("Failed to load tallies map from Supabase", err);
    }
  }, []);

  useEffect(() => {
    fetchAllTallies();
  }, [fetchAllTallies]);

  // Calculate previous shift carry-forward excess or shortage for the selected date
  const carryForwardInfo = useMemo(() => {
    const orderDates = orderHistory
      .filter(o => o.status !== "Voided" && o.status !== "Ignored")
      .map(o => getBusinessDateStr(o.timestamp));
    const tallyDates = Object.keys(allTalliesMap);
    const pastDates = Array.from(new Set([...orderDates, ...tallyDates]))
      .filter(d => d < selectedLogBizDateStr)
      .sort();

    if (pastDates.length === 0) {
      return { prevBizDate: null, carryForward: 0, formattedDate: null };
    }

    const prevDate = pastDates[pastDates.length - 1];
    const prevTally = allTalliesMap[prevDate];

    let discrepancy = 0;
    if (prevTally) {
      if (prevTally.discrepancy !== undefined && prevTally.discrepancy !== null && !isNaN(Number(prevTally.discrepancy))) {
        discrepancy = Number(prevTally.discrepancy);
      } else {
        const prevOrders = orderHistory.filter(
          o => getBusinessDateStr(o.timestamp) === prevDate && o.status !== "Voided" && o.status !== "Ignored"
        );
        const prevRev = prevOrders.reduce((sum, o) => sum + o.total, 0);
        const prevCredit = prevOrders
          .filter(o => o.payment_status === "Unpaid")
          .reduce((sum, o) => sum + o.total, 0);
        const prevBank = Number(prevTally.bankTransfer || prevTally.bank_transfer || 0);
        const prevCashRev = Math.max(0, prevRev - prevBank - prevCredit);
        const prevExpList = Array.isArray(prevTally.expenses) ? prevTally.expenses : [];
        const prevExp = prevExpList.reduce((s: number, e: any) => s + (Number(e.amount) || 0), 0);
        const prevOpen = Number(prevTally.openingBalance || prevTally.opening_balance || 0);
        const prevCarry = Number(prevTally.carry_forward || 0);
        const prevExpectedClosing = prevOpen + prevCarry + prevCashRev - prevExp;
        const prevActual = Number(prevTally.actualCash || prevTally.actual_cash || 0);
        discrepancy = prevActual - prevExpectedClosing;
      }
    }

    const formattedDate = `20${prevDate.slice(0, 2)}-${prevDate.slice(2, 4)}-${prevDate.slice(4, 6)}`;
    return {
      prevBizDate: prevDate,
      carryForward: discrepancy,
      formattedDate
    };
  }, [selectedLogBizDateStr, orderHistory, allTalliesMap]);

  // Check if the most recent past business day with orders has an unsettled tally ("balance of last day")
  const unclosedPastShiftInfo = useMemo(() => {
    const pastBizDates = Array.from(
      new Set(
        orderHistory
          .filter(o => o.status !== "Voided" && o.status !== "Ignored")
          .map(o => getBusinessDateStr(o.timestamp))
          .filter(d => d < currentBizDate)
      )
    ).sort();

    if (pastBizDates.length === 0) return null;

    // Check only the most recent past business day that had orders ("last day")
    const lastPastDate = pastBizDates[pastBizDates.length - 1];

    // Check if this date has a submitted tally in allTalliesMap or localStorage
    const dayTally = allTalliesMap[lastPastDate];
    if (dayTally?.submitted === true) {
      return null; // Past day is closed & balanced!
    }

    try {
      const allTalliesStr = localStorage.getItem("t-cloud-eats-shift-tallies");
      if (allTalliesStr) {
        const allTallies = JSON.parse(allTalliesStr);
        if (allTallies[lastPastDate]?.submitted === true) {
          return null; // Past day is closed & balanced!
        }
      }
    } catch (e) {
      console.error("Error reading tallies for past date check", e);
    }

    const formattedPastDate = `20${lastPastDate.slice(0, 2)}-${lastPastDate.slice(2, 4)}-${lastPastDate.slice(4, 6)}`;
    return {
      bizDateStr: lastPastDate,
      formattedDate: formattedPastDate
    };
  }, [orderHistory, currentBizDate, allTalliesMap, tallySubmitted]);

  // Auto-show warning popup if entering POS screen with unsettled past shift
  useEffect(() => {
    if (unclosedPastShiftInfo && activeSidebar === "new_order") {
      setShowUnsettledTallyModal(true);
    }
  }, [unclosedPastShiftInfo, activeSidebar]);

  // Load shift tally from Supabase (tce_tallies), fallback to localStorage
  useEffect(() => {
    let isMounted = true;

    const loadTallyData = async () => {
      try {
        const { data, error } = await supabase
          .from("tce_tallies")
          .select("*")
          .eq("id", selectedLogBizDateStr)
          .maybeSingle();

        if (!error && data && isMounted) {
          setOpeningBalance(Number(data.opening_balance) || 0);
          setBankTransfer(Number(data.bank_transfer) || 0);
          setActualCash(Number(data.actual_cash) || 0);
          const parsedExps = typeof data.expenses === "string" ? JSON.parse(data.expenses) : (data.expenses || []);
          setOperationalExpenses(parsedExps);
          setTallySubmitted(data.submitted ?? (selectedLogBizDateStr < currentBizDate));

          // Cache in allTalliesMap & localStorage
          const record = {
            openingBalance: Number(data.opening_balance) || 0,
            bankTransfer: Number(data.bank_transfer) || 0,
            actualCash: Number(data.actual_cash) || 0,
            expenses: parsedExps,
            carry_forward: Number(data.carry_forward) || 0,
            discrepancy: Number(data.discrepancy) || 0,
            submitted: data.submitted ?? (selectedLogBizDateStr < currentBizDate),
          };
          setAllTalliesMap(prev => ({ ...prev, [selectedLogBizDateStr]: record }));
          try {
            const allTalliesStr = localStorage.getItem("t-cloud-eats-shift-tallies") || "{}";
            const allTallies = JSON.parse(allTalliesStr);
            allTallies[selectedLogBizDateStr] = record;
            localStorage.setItem("t-cloud-eats-shift-tallies", JSON.stringify(allTallies));
          } catch (storageErr) {
            console.error("Failed to cache tally locally:", storageErr);
          }
          return;
        }
      } catch (err) {
        console.warn("Supabase tally fetch failed, trying localStorage:", err);
      }

      // LocalStorage fallback
      try {
        const allTalliesStr = localStorage.getItem("t-cloud-eats-shift-tallies");
        if (allTalliesStr) {
          const allTallies = JSON.parse(allTalliesStr);
          const dayTally = allTallies[selectedLogBizDateStr];
          if (dayTally && isMounted) {
            setOpeningBalance(dayTally.openingBalance ?? 0);
            setBankTransfer(dayTally.bankTransfer ?? 0);
            setActualCash(dayTally.actualCash ?? 0);
            setOperationalExpenses(dayTally.expenses ?? []);
            setTallySubmitted(dayTally.submitted ?? (selectedLogBizDateStr < currentBizDate));
            return;
          }
        }
      } catch (e) {
        console.error("Error loading shift tallies from localStorage", e);
      }

      // Reset to defaults if no record exists
      if (isMounted) {
        setOpeningBalance(0);
        setBankTransfer(0);
        setActualCash(0);
        setOperationalExpenses([]);
        // Historical dates before today are considered settled by default
        setTallySubmitted(selectedLogBizDateStr < currentBizDate);
      }
    };

    loadTallyData();
    return () => { isMounted = false; };
  }, [selectedLogBizDateStr, currentBizDate]);

  // Helper to save shift tally to Supabase (tce_tallies) and localStorage
  const saveShiftTally = (
    op: number,
    bt: number,
    ac: number,
    expList: { id: string; category: string; description: string; amount: number }[],
    sub?: boolean
  ) => {
    const isSub = sub !== undefined ? sub : tallySubmitted;
    const carryForward = carryForwardInfo.carryForward;
    // Calculate discrepancy with carry-forward accounted for
    const shiftRev = todaysOrders.reduce((sum, o) => sum + o.total, 0);
    const totalExp = expList.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const expectedCashRev = Math.max(0, shiftRev - bt - todaysCreditAmount);
    const expectedClosing = op + carryForward + expectedCashRev - totalExp;
    const discrepancy = ac - expectedClosing;

    const updatedRecord = {
      openingBalance: op,
      bankTransfer: bt,
      actualCash: ac,
      expenses: expList,
      carry_forward: carryForward,
      discrepancy: discrepancy,
      submitted: isSub,
    };
    setAllTalliesMap(prev => ({ ...prev, [selectedLogBizDateStr]: updatedRecord }));

    // 1. Update local storage
    try {
      const allTalliesStr = localStorage.getItem("t-cloud-eats-shift-tallies") || "{}";
      const allTallies = JSON.parse(allTalliesStr);
      allTallies[selectedLogBizDateStr] = updatedRecord;
      localStorage.setItem("t-cloud-eats-shift-tallies", JSON.stringify(allTallies));
    } catch (e) {
      console.error("Error saving shift tally locally:", e);
    }

    // 2. Persist to Supabase in background
    let currentUser = "cashier@t-cloudeats.com";
    if (typeof window !== "undefined") {
      currentUser = localStorage.getItem("t-cloud-eats-user") || currentUser;
    }

    Promise.resolve(
      supabase
        .from("tce_tallies")
        .upsert({
          id: selectedLogBizDateStr,
          biz_date: selectedLogBizDateStr,
          opening_balance: op,
          bank_transfer: bt,
          actual_cash: ac,
          expenses: expList,
          carry_forward: carryForward,
          discrepancy: discrepancy,
          submitted: isSub,
          submitted_at: isSub ? new Date().toISOString() : null,
          submitted_by: currentUser,
          updated_at: new Date().toISOString()
        }, { onConflict: "id" })
    )
      .then(({ error }) => {
        if (error) {
          console.error("Supabase tally upsert error:", error);
        } else {
          console.log(`[Tally Sync] Successfully synced tally for ${selectedLogBizDateStr} to database.`);
        }
      })
      .catch((err) => {
        console.error("Network error saving tally to Supabase:", err);
      });
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (tallySubmitted) return;
    const amt = parseFloat(newExpenseAmt) || 0;
    if (amt <= 0) return;

    const newExp = {
      id: Date.now().toString(),
      category: newExpenseCategory,
      description: newExpenseDesc.trim(),
      amount: amt
    };
    const updated = [...operationalExpenses, newExp];
    setOperationalExpenses(updated);
    saveShiftTally(openingBalance, bankTransfer, actualCash, updated);
    setNewExpenseDesc("");
    setNewExpenseAmt("");
  };

  const handleRemoveExpense = (id: string) => {
    if (tallySubmitted) return;
    const updated = operationalExpenses.filter(exp => exp.id !== id);
    setOperationalExpenses(updated);
    saveShiftTally(openingBalance, bankTransfer, actualCash, updated);
  };

  const handleSubmitTally = () => {
    setTallySubmitted(true);
    saveShiftTally(openingBalance, bankTransfer, actualCash, operationalExpenses, true);
    triggerToast("Closing balance tally submitted & saved to database!", "success");
  };

  const handleUnlockTally = () => {
    setTallySubmitted(false);
    saveShiftTally(openingBalance, bankTransfer, actualCash, operationalExpenses, false);
    triggerToast("Tally unlocked for editing", "info");
  };

  const handleOpenAddInventory = () => {
    setEditingInventoryItem(null);
    setInvName("");
    setInvCategory("Produce");
    setInvSku(`SKU-${Math.floor(100000 + Math.random() * 900000)}`);
    setInvUnit("lbs");
    setInvParLevel(0);
    setInvQuantity(0);
    setInvUnitCost(0);
    setInvSupplier("");
    setInvExpirationDate("");
    setInvStorageLocation("Cooler");
    setShowInventoryModal(true);
  };

  const handleOpenEditInventory = (item: InventoryItem) => {
    setEditingInventoryItem(item);
    setInvName(item.name);
    setInvCategory(item.category);
    setInvSku(item.sku);
    setInvUnit(item.unit);
    setInvParLevel(item.parLevel);
    setInvQuantity(item.quantity);
    setInvUnitCost(item.unitCost);
    setInvSupplier(item.supplier);
    setInvExpirationDate(item.expirationDate);
    setInvStorageLocation(item.storageLocation);
    setShowInventoryModal(true);
  };

  const handleSaveInventoryItem = () => {
    if (!invName || !invSku || !invCategory) {
      triggerToast("Please fill in Name, SKU, and Category", "warning");
      return;
    }

    if (editingInventoryItem) {
      const updatedItem: InventoryItem = {
        ...editingInventoryItem,
        name: invName,
        category: invCategory,
        sku: invSku,
        unit: invUnit,
        parLevel: Number(invParLevel),
        quantity: Number(invQuantity),
        unitCost: Number(invUnitCost),
        supplier: invSupplier,
        expirationDate: invExpirationDate,
        storageLocation: invStorageLocation
      };
      const updated = inventoryItems.map(item =>
        item.id === editingInventoryItem.id ? updatedItem : item
      );
      saveInventory(updated, updatedItem);
      triggerToast("Inventory item updated successfully", "success");
    } else {
      const newItem: InventoryItem = {
        id: `INV-${Date.now()}`,
        name: invName,
        category: invCategory,
        sku: invSku,
        unit: invUnit,
        parLevel: Number(invParLevel),
        quantity: Number(invQuantity),
        unitCost: Number(invUnitCost),
        supplier: invSupplier,
        expirationDate: invExpirationDate,
        storageLocation: invStorageLocation
      };
      saveInventory([...inventoryItems, newItem], newItem);
      triggerToast("Inventory item added successfully", "success");
    }
    setShowInventoryModal(false);
  };

  const handleDeleteInventoryItem = (id: string) => {
    if (confirm("Are you sure you want to delete this inventory item?")) {
      const updated = inventoryItems.filter(item => item.id !== id);
      saveInventory(updated);
      // Delete from Supabase in background
      supabase
        .from("tce_inventory")
        .delete()
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.error("Supabase inventory delete error:", error);
        });
      triggerToast("Inventory item deleted", "success");
    }
  };

  const filteredReportOrders = useMemo(() => {
    return orderHistory.filter(order => {
      if (order.status === "Voided" || order.status === "Ignored") return false;
      return isOrderInReportRange(order.timestamp, reportFilter);
    });
  }, [orderHistory, reportFilter]);

  const reportData = useMemo(() => {
    const groups: Record<string, { dateStr: string; orderCount: number; revenue: number }> = {};

    filteredReportOrders.forEach(order => {
      const bizDate = getBusinessDateStr(order.timestamp);
      const formattedDate = `20${bizDate.slice(0, 2)}-${bizDate.slice(2, 4)}-${bizDate.slice(4, 6)}`;

      if (!groups[bizDate]) {
        groups[bizDate] = {
          dateStr: formattedDate,
          orderCount: 0,
          revenue: 0
        };
      }
      groups[bizDate].orderCount += 1;
      groups[bizDate].revenue += order.total;
    });

    return Object.values(groups).sort((a, b) => b.dateStr.localeCompare(a.dateStr));
  }, [filteredReportOrders]);

  const filteredInventory = useMemo(() => {
    return inventoryItems.filter(item => {
      const query = invSearchQuery.toLowerCase();
      const matchesSearch =
        item.name.toLowerCase().includes(query) ||
        item.sku.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.supplier.toLowerCase().includes(query);

      const matchesLocation = invFilterLocation === "All" || item.storageLocation === invFilterLocation;

      let matchesStock = true;
      if (invFilterStockStatus === "Low Stock") {
        matchesStock = item.quantity <= item.parLevel && item.quantity > 0;
      } else if (invFilterStockStatus === "Out of Stock") {
        matchesStock = item.quantity === 0;
      } else if (invFilterStockStatus === "Normal") {
        matchesStock = item.quantity > item.parLevel;
      }

      return matchesSearch && matchesLocation && matchesStock;
    });
  }, [inventoryItems, invSearchQuery, invFilterLocation, invFilterStockStatus]);

  // Checkout Operations
  // Removed old handleCheckout function to use handlePlaceOrderClick and handleConfirmPlaceOrder

  const confirmAndPrintInvoice = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
    setCart([]);
    setShowReceiptModal(false);
    setLatestOrder(null);
    triggerToast("Receipt completed successfully", "success");
  };

  // Direct single-owner navigation (no PIN wall)
  const handleSidebarClick = (view: any) => {
    setActiveSidebar(view);
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
            if (pinPurpose === "menu") {
              setActiveSidebar("menu_management");
            } else if (pinPurpose === "delete_customer") {
              if (pendingDeleteCustomerPhone) {
                const phoneToDelete = pendingDeleteCustomerPhone;
                setPendingDeleteCustomerPhone(null);
                handleConfirmDeleteCustomer(phoneToDelete);
              }
            } else {
              // Execute pending actions
              if (voidTargetOrderId) {
                updateOrderStatus(voidTargetOrderId, "Voided");
                setVoidTargetOrderId(null);
              }
              if (pendingRemoveItemId !== null) {
                const itemId = pendingRemoveItemId;
                const delta = pendingRemoveDelta;
                setPendingRemoveItemId(null);
                setPendingRemoveDelta(null);
                if (delta !== null) {
                  // Decrease quantity
                  setCart(prev => prev.map(item => {
                    if (item.menuItem.id === itemId) {
                      const newQty = item.quantity + delta;
                      return newQty > 0 ? { ...item, quantity: newQty } : null;
                    }
                    return item;
                  }).filter(Boolean) as CartItem[]);
                } else {
                  // Remove item
                  setCart(prev => prev.filter(item => item.menuItem.id !== itemId));
                  triggerToast("Item removed from ticket", "info");
                }
              }
              if (isUpdateOrderPending) {
                setIsUpdateOrderPending(false);
                setTimeout(() => {
                  handleUpdateOrder();
                }, 100);
              }
            }
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
          portion: newItemData.portion || "Large Portion",
          image: newItemData.image,
          sku: newItemData.sku
        })
      });

      if (res.ok) {
        const addedItem = await res.json();
        setMenuItems(prev => [...prev, addedItem]);
        setIsAddingItem(false);
        setNewItemData({ title: "", price: 0, category: "Fried Rice", portion: "Large Portion", sku: "", image: undefined });
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
  const filteredMenuItems = useMemo(() => {
    const CATEGORY_ORDER = ["Fried Rice", "Chopsuey", "Kottu", "Pasta", "Ultimate Bites", "Beverages"];
    return menuItems
      .filter(item => {
        const matchesCategory = activeCategory === "All Categories" || item.category === activeCategory;
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        const catA = CATEGORY_ORDER.indexOf(a.category);
        const catB = CATEGORY_ORDER.indexOf(b.category);
        const orderA = catA === -1 ? 99 : catA;
        const orderB = catB === -1 ? 99 : catB;
        if (orderA !== orderB) return orderA - orderB;
        return a.id - b.id;
      });
  }, [menuItems, activeCategory, searchQuery]);

  // Clamp indices when lists change
  useEffect(() => {
    if (filteredMenuItems.length > 0 && focusedProductIndex >= filteredMenuItems.length) {
      setFocusedProductIndex(0);
    }
  }, [filteredMenuItems.length, focusedProductIndex]);

  useEffect(() => {
    if (displayedItems.length > 0 && focusedCartIndex >= displayedItems.length) {
      setFocusedCartIndex(displayedItems.length - 1);
    }
  }, [displayedItems.length, focusedCartIndex]);

  // Global Keyboard-First POS Controller with Input Safety Guard
  useEffect(() => {
    const ORDER_TYPE_OPTIONS: ("Delivery" | "Take Away" | "3rd Party" | "Dine In")[] = [
      "Delivery",
      "Take Away",
      "3rd Party",
      "Dine In",
    ];

    const isEditable = (target: EventTarget | null): boolean => {
      const el = target as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const editingInput = isEditable(e.target);

      // 1. Global Search: Ctrl+K (always) or '/' (outside inputs)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowQuickSearch((prev) => !prev);
        return;
      }
      if (e.key === "/" && !editingInput && !showQuickSearch && !showCustomerModal && !showOrderTypeModal && !showReceiptModal) {
        e.preventDefault();
        setShowQuickSearch(true);
        return;
      }

      // If QuickSearch, ReceiptPrintModal, CMS, or CustomItemModal is open, let their own handlers manage keys
      if (showQuickSearch || showReceiptModal || showCMSModal || showCustomItemModal) {
        return;
      }

      // 2. OrderTypeModal Navigation
      if (showOrderTypeModal) {
        if (e.key === "Escape" || (e.key === "Backspace" && !editingInput)) {
          e.preventDefault();
          setShowOrderTypeModal(false);
          return;
        }
        if (e.key === "ArrowDown" || e.key === "ArrowRight") {
          e.preventDefault();
          setOrderTypeModalIndex((prev) => (prev + 1) % 4);
          return;
        }
        if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
          e.preventDefault();
          setOrderTypeModalIndex((prev) => (prev - 1 + 4) % 4);
          return;
        }
        if (e.key === "Enter" && !editingInput) {
          e.preventDefault();
          handleSelectOrderType(ORDER_TYPE_OPTIONS[orderTypeModalIndex]);
          return;
        }
        return;
      }

      // 3. CustomerModal Navigation
      if (showCustomerModal) {
        if (e.key === "Escape" || (e.key === "Backspace" && !editingInput)) {
          e.preventDefault();
          setShowCustomerModal(false);
      setOrderBookingDate(null);
          setShowOrderTypeModal(true);
          return;
        }
        if (e.key === "Enter" && (e.target as HTMLElement)?.tagName !== "TEXTAREA") {
          const tag = (e.target as HTMLElement)?.tagName;
          if (tag === "INPUT") {
            e.preventDefault();
            handleConfirmPlaceOrder();
            return;
          }
        }
        return;
      }

      // 4. Global Cashier Hotkeys (work even if focus is on buttons; F2/F4/F8/F9)
      if (e.key === "F2" || ((e.ctrlKey || e.metaKey) && e.key === "Enter")) {
        if (activeSidebar === "new_order" && cart.length > 0) {
          e.preventDefault();
          handlePlaceOrderClick();
        }
        return;
      }
      if (e.key === "F4" || (e.altKey && e.key.toLowerCase() === "o")) {
        e.preventDefault();
        setFocusedOrderIndex(0);
        setActiveSidebar("order_history");
        return;
      }
      if (e.key === "F8") {
        if (activeSidebar === "new_order" && cart.length > 0 && !selectedInvoiceId) {
          e.preventDefault();
          handleParkCurrentOrder();
        }
        return;
      }
      if (e.key === "F9") {
        if (parkedOrders.length > 0) {
          e.preventDefault();
          handleRecallParkedOrder(parkedOrders[0].id);
        }
        return;
      }

      // CRITICAL SAFETY GUARD: Ignore all navigation/action keys inside text inputs/selects/textareas
      const isDateInput = (e.target as HTMLElement)?.tagName === "INPUT" && (e.target as HTMLInputElement)?.type === "date";
      if (editingInput && !isDateInput) return;

      // 5. Order Logs & Shift Tally Date & Zone Navigation (Invoices Tab)
      if (activeSidebar === "order_history" || activeSidebar === "reports") {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          setSelectedLogDate(prev => stepDateStr(prev, -1));
          return;
        }
        if (e.key === "ArrowRight") {
          e.preventDefault();
          setSelectedLogDate(prev => stepDateStr(prev, 1));
          return;
        }

        if (activeSidebar === "order_history") {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setFocusedOrderIndex((prev) =>
              todaysAllOrders.length > 0 ? Math.min(prev + 1, todaysAllOrders.length - 1) : 0
            );
            return;
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            setFocusedOrderIndex((prev) => Math.max(prev - 1, 0));
            return;
          }
          if (e.key === "Enter" && todaysAllOrders[focusedOrderIndex]) {
            e.preventDefault();
            setLatestOrder(todaysAllOrders[focusedOrderIndex]);
            setShowReceiptModal(true);
            return;
          }
          if (e.key === "Backspace" || e.key === "Escape") {
            e.preventDefault();
            setActiveSidebar("new_order");
            setFocusZone("GRID");
            return;
          }
        }
        return;
      }

      // 6. POS Terminal Zone (Product Grid <-> Active Cart)
      if (activeSidebar === "new_order") {
        if (e.key === "Tab") {
          e.preventDefault();
          setFocusZone((prev) => (prev === "GRID" ? "CART" : "GRID"));
          return;
        }

        if (e.key === "[" || e.key === "PageUp") {
          e.preventDefault();
          const idx = CATEGORIES.indexOf(activeCategory);
          const next = (idx - 1 + CATEGORIES.length) % CATEGORIES.length;
          setActiveCategory(CATEGORIES[next]);
          setFocusedProductIndex(0);
          return;
        }
        if (e.key === "]" || e.key === "PageDown") {
          e.preventDefault();
          const idx = CATEGORIES.indexOf(activeCategory);
          const next = (idx + 1) % CATEGORIES.length;
          setActiveCategory(CATEGORIES[next]);
          setFocusedProductIndex(0);
          return;
        }

        if (focusZone === "GRID") {
          const total = filteredMenuItems.length;
          if (total === 0) return;

          const getColCount = () => {
            if (!posGridRef.current) return 4;
            const cols = window.getComputedStyle(posGridRef.current).gridTemplateColumns.split(" ").filter(Boolean).length;
            return Math.max(1, cols);
          };

          if (e.key === "ArrowRight") {
            e.preventDefault();
            setFocusedProductIndex((prev) => (prev + 1) % total);
          } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            setFocusedProductIndex((prev) => (prev - 1 + total) % total);
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            const cols = getColCount();
            setFocusedProductIndex((prev) => Math.min(prev + cols, total - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            const cols = getColCount();
            setFocusedProductIndex((prev) => Math.max(prev - cols, 0));
          } else if (e.key === "Enter" || e.key === "+" || e.key === "=") {
            e.preventDefault();
            const item = filteredMenuItems[focusedProductIndex];
            if (item) {
              addToCart(item);
              triggerCartPulse(item.id);
            }
          } else if (e.key === "-") {
            e.preventDefault();
            const item = filteredMenuItems[focusedProductIndex];
            if (item) {
              updateQuantity(item.id, -1);
            }
          }
        } else if (focusZone === "CART") {
          if (displayedItems.length === 0) {
            if (e.key === "Backspace" || e.key === "Escape") {
              e.preventDefault();
              setFocusZone("GRID");
            }
            return;
          }
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setFocusedCartIndex((prev) => Math.min(prev + 1, displayedItems.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setFocusedCartIndex((prev) => Math.max(prev - 1, 0));
          } else if (e.key === "+" || e.key === "=") {
            e.preventDefault();
            const ci = displayedItems[focusedCartIndex];
            if (ci) updateQuantity(ci.menuItem.id, 1);
          } else if (e.key === "-") {
            e.preventDefault();
            const ci = displayedItems[focusedCartIndex];
            if (ci) updateQuantity(ci.menuItem.id, -1);
          } else if (e.key === "Backspace" || e.key === "Delete") {
            e.preventDefault();
            const ci = displayedItems[focusedCartIndex];
            if (ci) removeFromCart(ci.menuItem.id);
          } else if (e.key === "Escape") {
            e.preventDefault();
            setFocusZone("GRID");
          }
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return (
    <>
      <div className={`h-screen w-screen bg-white text-slate-900 font-sans antialiased selection:bg-sky-500 selection:text-white flex overflow-hidden relative transition-all duration-300 ${
        isNetworkUnstable ? "blur-xl pointer-events-none select-none filter opacity-40" : ""
      }`}>

      <style dangerouslySetInnerHTML={{
        __html: `
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: #CBD5E1;
          border-radius: 9999px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #94A3B8;
        }
        * {
          scrollbar-width: thin;
          scrollbar-color: #CBD5E1 transparent;
        }
      `}} />

      {/* Non-blocking Toast Stack */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-sm w-full">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`px-4 py-3.5 rounded-xl shadow-lg flex items-center justify-between gap-3 border transition-all duration-300 ${toast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : toast.type === "error"
                ? "bg-rose-50 border-rose-200 text-rose-900"
                : "bg-slate-900 border-slate-800 text-white"
              }`}
          >
            <span className="text-xs font-bold">{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className={toast.type === "info" ? "text-slate-300 hover:text-white cursor-pointer" : "text-slate-500 hover:text-slate-900 cursor-pointer"}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Full-Bleed Console Container (No Outer Borders) */}
      <div className="flex-1 h-full flex bg-white overflow-hidden">

        {/* Left Crisp White ERP Sidebar (Reference Style) */}
        <aside className={`hidden md:flex flex-col justify-between bg-white border-r border-slate-200 shrink-0 transition-all duration-200 ${sidebarCollapsed ? "w-[72px] p-2.5" : "w-[232px] p-4"}`}>
          <div className="space-y-6 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
            {/* Brand Lockup + Collapse Toggle */}
            <div className={`flex items-center ${sidebarCollapsed ? "flex-col gap-2.5" : "justify-between gap-2 px-1"}`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center p-1 shrink-0">
                  <Image
                    src="/Round Logo.png"
                    alt="T-Cloud Eats"
                    width={28}
                    height={28}
                    className="object-contain"
                    priority
                  />
                </div>
                {!sidebarCollapsed && (
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 leading-tight truncate">T-CLOUD EATS</p>
                    <p className="text-[11px] text-slate-500 truncate">ERP Solution</p>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSidebarCollapsed((c) => !c)}
                className="w-7 h-7 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 flex items-center justify-center shrink-0 cursor-pointer"
                title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                <ChevronLeft size={14} className={sidebarCollapsed ? "rotate-180 transition-transform" : "transition-transform"} />
              </button>
            </div>

            {/* MAIN Group */}
            <div className="space-y-1">
              {!sidebarCollapsed && (
                <p className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Main
                </p>
              )}
              {([
                { key: "new_order", icon: <ShoppingBag size={17} />, label: "POS Billing" },
                { key: "order_history", icon: <History size={17} />, label: "Orders & E-Bills" },
                { key: "reports", icon: <BarChart3 size={17} />, label: "Shift Tally" },
                { key: "menu_management", icon: <FolderKanban size={17} />, label: "Menu & Customers" },
                { key: "inventory", icon: <Boxes size={17} />, label: "Stock & Recipes" },
                { key: "finance_reports", icon: <Landmark size={17} />, label: "Finance & Reports" },
                { key: "finance_ledger", icon: <BookOpen size={17} />, label: "General Ledger" },
                { key: "finance_assets_payroll", icon: <HardDrive size={17} />, label: "Assets & Payroll" },
              ] as { key: UnifiedTab; icon: React.ReactNode; label: string }[]).map(({ key, icon, label }) => {
                const isActive = activeSidebar === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSidebarClick(key)}
                    title={sidebarCollapsed ? label : undefined}
                    className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition cursor-pointer ${isActive
                      ? "bg-sky-500 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={isActive ? "text-white shrink-0" : "text-slate-500 shrink-0"}>{icon}</span>
                      {!sidebarCollapsed && <span className="truncate">{label}</span>}
                    </div>
                    {!sidebarCollapsed && (
                      <ChevronRight size={13} className={isActive ? "text-white/90 shrink-0" : "text-slate-500 shrink-0"} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* OTHERS Group */}
            <div className="space-y-1 pt-2 border-t border-slate-100">
              {!sidebarCollapsed && (
                <p className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Others
                </p>
              )}
              <button
                type="button"
                onClick={() => handleSidebarClick("settings")}
                title={sidebarCollapsed ? "Settings & Tax" : undefined}
                className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition cursor-pointer ${activeSidebar === "settings"
                  ? "bg-sky-500 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <SettingsIcon size={17} className={activeSidebar === "settings" ? "text-white shrink-0" : "text-slate-500 shrink-0"} />
                  {!sidebarCollapsed && <span className="truncate">Settings &amp; Tax</span>}
                </div>
                {!sidebarCollapsed && (
                  <ChevronRight size={13} className={activeSidebar === "settings" ? "text-white/90 shrink-0" : "text-slate-500 shrink-0"} />
                )}
              </button>
            </div>
          </div>

          {/* Bottom Owner Profile + Logout */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 truncate">Owner Mode</p>
                <p className="text-[11px] text-slate-500 truncate">T-Cloud Eats (Pvt) Ltd</p>
              </div>
            )}
            <button
              onClick={() => router.push("/login")}
              className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer shrink-0"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </aside>

        {/* Main Content Pane */}
        <main className="flex-1 h-full overflow-hidden flex flex-col pb-16 md:pb-0 bg-[#F8FAFC]">

          {/* Header */}
          <header className="px-6 py-3.5 border-b border-slate-200 bg-white flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3">
              <h1 className="text-sm font-semibold text-slate-900">
                {activeSidebar === "new_order" && "POS Billing"}
                {activeSidebar === "order_history" && "Orders & E-Bills"}
                {activeSidebar === "reports" && "Shift Tally & Cash"}
                {activeSidebar === "menu_management" && "Menu & Customers"}
                {activeSidebar === "inventory" && "Stock, Recipes & Food Cost"}
                {activeSidebar === "finance_reports" && "Financial Overview & Statements"}
                {activeSidebar === "finance_ledger" && "General Ledger & Journals"}
                {activeSidebar === "finance_assets_payroll" && "Fixed Assets & Payroll"}
                {activeSidebar === "settings" && "System & Tax Settings"}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowQuickSearch(true)}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-xs text-slate-700 hover:text-slate-900 transition cursor-pointer"
                title="Quick Search"
              >
                <Search size={13} />
                <span>Quick Search</span>
              </button>

              {/* Notification Button */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    if (!showNotifications) {
                      const readList = notificationsList.map(n => ({ ...n, read: true }));
                      saveNotifications(readList);
                    }
                  }}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer relative border ${showNotifications
                    ? "bg-sky-50 border-sky-200 text-sky-600"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  title="Notifications"
                >
                  <Bell size={14} className={unreadCount > 0 ? "animate-pulse text-amber-600" : ""} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-[9px] font-bold text-white rounded-full flex items-center justify-center border border-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                    <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl p-4 space-y-3 z-50">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">Live Kitchen Alerts</span>
                        <button
                          onClick={() => {
                            setNotificationsList(prev => prev.map(n => ({ ...n, read: true })));
                            setUnreadCount(0);
                          }}
                          className="text-[10px] font-bold text-sky-600 hover:underline cursor-pointer"
                        >
                          Mark all read
                        </button>
                      </div>
                      <div className="max-h-60 overflow-y-auto space-y-2" style={{ scrollbarWidth: "none" }}>
                        {notificationsList.length === 0 ? (
                          <div className="text-center py-6 text-[10px] text-slate-500">No recent notifications.</div>
                        ) : (
                          notificationsList.map(n => (
                            <div key={n.id} className={`p-2 rounded-lg text-[10px] space-y-1 transition-colors ${n.read ? "bg-slate-50 text-slate-600" : "bg-sky-50/70 text-slate-900 border-l-2 border-sky-500"}`}>
                              <p className="leading-snug text-left">{n.text}</p>
                              <span className="text-[8px] text-slate-500 font-mono block text-left">{n.time}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              >
                <Maximize2 size={13} />
                <span>{isFullscreen ? "Exit FS" : "Full Screen"}</span>
              </button>
            </div>
          </header>

          {activeSidebar === "new_order" && (
            <PosTerminalView
              categories={CATEGORIES}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              filteredMenuItems={filteredMenuItems as any}
              cartQuantities={cart.reduce((acc, ci) => {
                const id = ci.menuItem?.id;
                if (id) acc[id] = (acc[id] || 0) + ci.quantity;
                return acc;
              }, {} as Record<number, number>)}
              focusedIndex={focusedProductIndex}
              isGridFocused={focusZone === "GRID" && activeSidebar === "new_order"}
              justAddedId={justAddedId}
              gridRef={posGridRef}
              onAddToCart={(it) => {
                addToCart(it as any);
                triggerCartPulse(it.id);
              }}
              onOpenCustomItem={handleOpenCustomItemModal}
              unclosedPastShiftInfo={unclosedPastShiftInfo}
              onSettlePastShift={(formattedDate) => {
                setSelectedLogDate(formattedDate);
                setActiveSidebar("reports");
              }}
            />
          )}

          <div className={activeSidebar === "new_order" ? "hidden" : "flex-1 overflow-y-auto p-6"}>
            {activeSidebar === "order_history" && (
              <OrderLogsView
                selectedLogDate={selectedLogDate}
                setSelectedLogDate={setSelectedLogDate}
                todaysOrders={todaysOrders as any}
                todaysAllOrders={todaysAllOrders as any}
                loadingOrders={loadingOrders}
                customers={customers}
                isToday={selectedLogBizDateStr === currentBizDate}
                isAdminUnlocked={isAdminUnlocked}
                focusedOrderIndex={focusedOrderIndex}
                onUnlockPinForPrices={() => {
                  setPinPurpose("prices");
                  setShowPinModal(true);
                  setPinInput("");
                  setPinError("");
                }}
                onPaymentStatusChange={handlePaymentStatusChange}
                onLoadOrder={(id) => {
                  setSelectedInvoiceId(id);
                  setActiveSidebar("new_order");
                  triggerToast(`Loaded ${id}`, "info");
                }}
                onVoidOrder={handleVoidOrder}
                onReprintOrder={(ord) => {
                  setLatestOrder(ord as any);
                  setShowReceiptModal(true);
                }}
                renderAdminMetric={renderAdminMetric}
                onRefreshOrders={async () => {
                  triggerToast(`Updating order list for ${selectedLogDate}...`, "info");
                  await loadOrdersAndCMS(true);
                  triggerToast(`Order list updated for ${selectedLogDate}`, "success");
                }}
                onAddOrderForDate={(dateStr) => {
                  setOrderBookingDate(dateStr);
                  setSelectedInvoiceId(null);
                  setActiveSidebar("new_order");
                  triggerToast(`Recording order for shift: ${dateStr}`, "info");
                }}
                allOrders={orderHistory as any}
                onOpenSplitModal={(ord) => setSplitModalOrder(ord as any)}
              />
            )}

            {activeSidebar === "menu_management" && (
              <div className="space-y-6">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setCmsSearchQuery("");
                      setShowCMSModal(true);
                    }}
                    className="min-h-[44px] px-4 rounded-xl bg-white border border-slate-200 hover:border-[#F26F21]/50 text-white text-xs font-medium cursor-pointer"
                  >
                    Open Customer CMS Directory ({customers.length})
                  </button>
                </div>
                <MenuManagerView
                  menuItems={menuItems as any}
                  categories={CATEGORIES}
                  isAddingItem={isAddingItem}
                  setIsAddingItem={setIsAddingItem}
                  newItemData={newItemData as any}
                  setNewItemData={setNewItemData as any}
                  editingItem={editingItem as any}
                  setEditingItem={setEditingItem as any}
                  onAddItem={handleAddItem}
                  onEditItem={handleEditItem}
                  onDeleteItem={handleDeleteItem}
                  onImageChange={handleImageChange}
                  onToast={(m, t) => triggerToast(m, t)}
                />
              </div>
            )}

            {activeSidebar === "inventory" && (
              <UnifiedStockView onAddNewInventoryItem={handleOpenAddInventory} />
            )}

            {activeSidebar === "finance_reports" && (
              <UnifiedFinanceSection section="REPORTS" />
            )}

            {activeSidebar === "finance_ledger" && (
              <UnifiedFinanceSection section="LEDGER" />
            )}

            {activeSidebar === "finance_assets_payroll" && (
              <UnifiedFinanceSection section="ASSETS_PAYROLL" />
            )}

            {activeSidebar === "settings" && (
              <div className="space-y-6">
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900">POS &amp; Printer Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-500 mb-1">Printer Connection</label>
                      <select className="min-h-[44px] w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-sm text-slate-900 outline-none">
                        <option>PRINTER-USB-01 (Default 80mm Receipt)</option>
                        <option>PRINTER-WIFI-02 (Kitchen Display)</option>
                        <option>Virtual PDF Printer</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Kitchen Print Mode</label>
                      <select className="min-h-[44px] w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-sm text-slate-900 outline-none">
                        <option>Auto-print on checkout</option>
                        <option>Manual confirmation</option>
                      </select>
                    </div>
                  </div>
                </div>
                <UnifiedFinanceSection section="SETTINGS" />
              </div>
            )}

            {activeSidebar === "reports" && (
              <ShiftTallyView
                selectedLogDate={selectedLogDate}
                setSelectedLogDate={setSelectedLogDate}
                tallySubmitted={tallySubmitted}
                onSubmitTally={handleSubmitTally}
                onUnlockTally={handleUnlockTally}
                openingBalance={openingBalance}
                setOpeningBalance={setOpeningBalance}
                actualCash={actualCash}
                setActualCash={setActualCash}
                bankTransfer={bankTransfer}
                setBankTransfer={setBankTransfer}
                operationalExpenses={operationalExpenses}
                onSaveShiftTally={saveShiftTally}
                todaysOrders={todaysOrders as any}
                todaysCreditOrders={todaysCreditOrders as any}
                todaysCreditAmount={todaysCreditAmount}
                expenseCategories={EXPENSE_CATEGORIES}
                newExpenseCategory={newExpenseCategory}
                setNewExpenseCategory={setNewExpenseCategory}
                newExpenseDesc={newExpenseDesc}
                setNewExpenseDesc={setNewExpenseDesc}
                newExpenseAmt={newExpenseAmt}
                setNewExpenseAmt={setNewExpenseAmt}
                onAddExpense={handleAddExpense}
                onRemoveExpense={handleRemoveExpense}
                reportFilter={reportFilter}
                setReportFilter={setReportFilter}
                filteredReportOrders={filteredReportOrders as any}
                customersCount={customers.length}
                onOpenCms={() => {
                  setCmsSearchQuery("");
                  setShowCMSModal(true);
                }}
                renderAdminMetric={renderAdminMetric}
                carryForwardBalance={carryForwardInfo.carryForward}
                prevShiftDateStr={carryForwardInfo.formattedDate}
                onPaymentStatusChange={handlePaymentStatusChange}
                allOrders={orderHistory as any}
                onOpenSplitModal={(ord) => setSplitModalOrder(ord as any)}
              />
            )}

          </div>
        </main>

        {/* Right Cart Panel (Only rendered for POS Billing tab) */}
        {activeSidebar === "new_order" && (
          <aside className="w-[340px] flex flex-col h-full shrink-0" style={{ background: "#FFFFFF", borderLeft: "1px solid #E2E8F0" }}>
            <div className="flex flex-col h-full">

            {/* Ticket Header */}
            <div className="px-4 py-3.5 flex flex-col gap-2.5 shrink-0" style={{ borderBottom: "1px solid #E2E8F0" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={15} style={{ color: "#F26F21" }} />
                  <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: "#0F172A" }}>Active Ticket</span>
                </div>
                <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded"
                  style={{
                    background: (selectedOrderType === "Take Away" || selectedOrderType === "POS") ? "rgba(245,158,11,0.12)" : (selectedOrderType === "Pick Up" || selectedOrderType === "3rd Party") ? "rgba(168,85,247,0.12)" : "rgba(59,130,246,0.12)",
                    color: (selectedOrderType === "Take Away" || selectedOrderType === "POS") ? "#F59E0B" : (selectedOrderType === "Pick Up" || selectedOrderType === "3rd Party") ? "#A855F7" : "#3B82F6",
                    border: `1px solid ${(selectedOrderType === "Take Away" || selectedOrderType === "POS") ? "rgba(245,158,11,0.25)" : (selectedOrderType === "Pick Up" || selectedOrderType === "3rd Party") ? "rgba(168,85,247,0.25)" : "rgba(59,130,246,0.25)"}`
                  }}
                >
                  {selectedInvoiceId ? (() => {
                    const loadedOrder = orderHistory.find(o => o.id === selectedInvoiceId);
                    return loadedOrder ? `EDITING (${loadedOrder.status.toUpperCase()})` : "EDITING";
                  })() : "NEW ORDER"}
                </span>
              </div>

              {/* Today's Invoice Number Switcher Dropdown */}
              <label className="flex items-center justify-between text-[11px] text-slate-500 font-black bg-slate-50 py-3.5 px-4 rounded-xl border border-slate-200 hover:border-[#F26F21]/40 transition-all cursor-pointer w-full shadow-sm hover:scale-[1.01] active:scale-[0.99]">
                <span className="tracking-wider uppercase text-slate-500 text-[10px]">INVOICE NO:</span>
                <select
                  value={selectedInvoiceId || "active"}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "active") {
                      setSelectedInvoiceId(null);
                    } else {
                      setSelectedInvoiceId(val);
                    }
                  }}
                  className="font-mono text-[#F26F21] font-black bg-transparent outline-none cursor-pointer border-none p-0 focus:ring-0 text-[11px] text-right"
                  style={{ direction: "rtl" }}
                >
                  <option value="active" style={{ background: "#080E1C", color: "#F26F21", direction: "ltr" }}>
                    New Order ({getNextInvoiceNumber(orderHistory, orderBookingDate)})
                  </option>
                  {todaysOrders.map(order => (
                    <option key={order.id} value={order.id} style={{ background: "#080E1C", color: "#94A3B8", direction: "ltr" }}>
                      {order.id}
                    </option>
                  ))}
                </select>
              </label>

              {orderBookingDate && !selectedInvoiceId && (
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-2.5 flex items-center justify-between text-xs text-amber-900 shadow-sm">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Calendar size={14} className="text-amber-600 shrink-0" />
                    <span>Recording for Shift:</span>
                    <span className="font-mono text-amber-800">{orderBookingDate}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOrderBookingDate(null);
                      triggerToast("Reset to today's shift date", "info");
                    }}
                    className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-200 hover:bg-amber-300 text-amber-950 transition cursor-pointer"
                    title="Cancel shift backdating and return to today"
                  >
                    Reset to Today
                  </button>
                </div>
              )}

              {selectedInvoiceId && (
                <div className="text-[9px] font-bold text-center uppercase tracking-wider text-slate-500">
                  Fulfillment: <span style={{
                    color: (selectedOrderType === "Take Away" || selectedOrderType === "POS") ? "#F59E0B" : (selectedOrderType === "Pick Up" || selectedOrderType === "3rd Party") ? "#A855F7" : "#3B82F6"
                  }}>{selectedOrderType} ({
                      (selectedOrderType === "Take Away" || selectedOrderType === "POS") ? "POS" : (selectedOrderType === "Pick Up" || selectedOrderType === "3rd Party") ? "3rd Party" : "Direct"
                    })</span>
                </div>
              )}

              {parkedOrders.length > 0 && !selectedInvoiceId && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {parkedOrders.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleRecallParkedOrder(p.id)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 text-xs font-medium cursor-pointer"
                      title={`Recall ${p.label} (${p.cart.length} items)`}
                    >
                      <PlayCircle size={12} />
                      <span>{p.label}</span>
                      <span className="text-[11px] opacity-70">({p.cart.length})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {displayedItems.map((item, cartIdx) => {
                const loadedOrder = selectedInvoiceId ? orderHistory.find(o => o.id === selectedInvoiceId) : null;
                const isItemEditable = !loadedOrder || (loadedOrder.status !== "Voided" && loadedOrder.status !== "Ignored");
                const isCartFocused = focusZone === "CART" && focusedCartIndex === cartIdx;
                return (
                  <div
                    key={`${item.menuItem.id}-${item.isNew ? "new" : "old"}`}
                    onClick={() => {
                      setFocusZone("CART");
                      setFocusedCartIndex(cartIdx);
                    }}
                    className={`rounded-xl p-3 flex gap-2 items-start cursor-pointer transition ${isCartFocused ? "ring-2 ring-emerald-400/80" : ""
                      }`}
                    style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-semibold text-[11px] leading-snug" style={{ color: "#0F172A" }}>
                          {item.menuItem ? item.menuItem.title : (item as any).title}
                        </h4>
                        {selectedInvoiceId && item.isNew && (
                          <span className="text-[7px] font-black uppercase bg-emerald-500/10 text-emerald-600 px-1 py-0.5 rounded border border-emerald-500/25">New</span>
                        )}
                        {item.isFree && (
                          <span className="text-[7px] font-black uppercase bg-emerald-500/20 text-emerald-600 border border-emerald-500/30 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            🎁 FREE ITEM
                          </span>
                        )}
                        {item.customItemPrice !== undefined && !item.isFree && (
                          <span className="text-[7px] font-black uppercase bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded">
                            Price: Rs {item.customItemPrice.toLocaleString()}
                          </span>
                        )}
                      </div>

                      {/* Comment, Addon & Free Display */}
                      {commentEditingItemId !== item.menuItem.id && (item.comment || (item.addonPrice !== undefined && item.addonPrice !== 0) || item.isFree) && (
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          {item.comment && (
                            <span className="text-[9px] italic text-amber-700">💬 {item.comment}</span>
                          )}
                          {item.addonPrice !== undefined && item.addonPrice !== 0 ? (
                            <span className="text-[8px] font-black uppercase text-amber-800 bg-amber-50 px-1 border border-amber-200 rounded">
                              {item.addonPrice > 0 ? `+ Rs ${item.addonPrice.toLocaleString()}` : `- Rs ${Math.abs(item.addonPrice).toLocaleString()}`}
                            </span>
                          ) : null}
                        </div>
                      )}

                      {/* Inline comment, addon & price editor */}
                      {commentEditingItemId === item.menuItem.id && (
                        <div className="flex flex-col gap-1.5 mt-1.5 p-2.5 rounded-xl border border-amber-300 bg-amber-50/70">
                          <div className="flex flex-col gap-1.5">
                            <input
                              id={`desc-edit-${item.menuItem.id}`}
                              type="text"
                              placeholder="Addon Note (e.g. Extra Cheese)"
                              defaultValue={item.comment || ""}
                              className="w-full text-[10px] px-2 py-1.5 rounded-lg border outline-none bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                              onKeyDown={(e) => {
                                if (e.key === "Escape") setCommentEditingItemId(null);
                              }}
                            />
                            <div className="grid grid-cols-2 gap-1.5">
                              <div>
                                <label className="text-[8px] font-bold text-slate-500 block mb-0.5">Addon Price (+/- LKR)</label>
                                <input
                                  id={`price-edit-${item.menuItem.id}`}
                                  type="number"
                                  placeholder="0"
                                  defaultValue={item.addonPrice || ""}
                                  className="w-full text-[10px] px-2 py-1 rounded-lg border outline-none bg-slate-50 border-slate-700 text-slate-800 font-mono"
                                />
                              </div>
                              <div>
                                <label className="text-[8px] font-bold text-slate-500 block mb-0.5">Unit Price / Override (LKR)</label>
                                <input
                                  id={`unit-price-edit-${item.menuItem.id}`}
                                  type="number"
                                  placeholder={String(item.menuItem?.price || "")}
                                  defaultValue={item.customItemPrice !== undefined ? item.customItemPrice : ""}
                                  className="w-full text-[10px] px-2 py-1 rounded-lg border outline-none bg-slate-50 border-slate-700 text-slate-800 font-mono"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                            <button
                              type="button"
                              onClick={() => toggleFreeItem(item.menuItem.id, item.isNew)}
                              className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg transition-colors cursor-pointer border ${item.isFree
                                ? "bg-emerald-500 text-white border-emerald-400"
                                : "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20"
                                }`}
                            >
                              {item.isFree ? "✓ 100% Free Item" : "🎁 Make 100% Free"}
                            </button>

                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => setCommentEditingItemId(null)}
                                className="text-[9px] font-black uppercase text-slate-600 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-200/60 cursor-pointer bg-transparent border-none"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const descInput = document.getElementById(`desc-edit-${item.menuItem.id}`) as HTMLInputElement;
                                  const priceInput = document.getElementById(`price-edit-${item.menuItem.id}`) as HTMLInputElement;
                                  const unitPriceInput = document.getElementById(`unit-price-edit-${item.menuItem.id}`) as HTMLInputElement;

                                  const descVal = descInput?.value.trim();
                                  const priceVal = parseFloat(priceInput?.value) || 0;
                                  const unitPriceRaw = unitPriceInput?.value.trim();
                                  const unitPriceVal = unitPriceRaw !== "" && !isNaN(parseFloat(unitPriceRaw)) ? parseFloat(unitPriceRaw) : undefined;

                                  setCart(prev => prev.map(ci =>
                                    ci.menuItem.id === item.menuItem.id && ci.isNew === item.isNew
                                      ? {
                                        ...ci,
                                        comment: descVal || undefined,
                                        addonPrice: priceVal || undefined,
                                        customItemPrice: unitPriceVal
                                      }
                                      : ci
                                  ));
                                  setCommentEditingItemId(null);
                                }}
                                className="text-[9px] font-black uppercase text-white bg-[#F26F21] hover:bg-[#e05c0d] px-2.5 py-1 rounded-lg cursor-pointer border-none"
                              >
                                Save Changes
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      <p className="text-[10px] mt-0.5 font-mono" style={{ color: "#4B5E82" }}>
                        {item.quantity} × {item.isFree ? (
                          <span className="line-through opacity-60">Rs {(item.menuItem?.price || 0).toLocaleString()} → Rs 0</span>
                        ) : (
                          `Rs ${getItemUnitPrice(item).toLocaleString()}`
                        )}
                      </p>
                      <p className="text-[10px] font-bold font-mono mt-0.5" style={{ color: item.isFree ? "#10B981" : "#F26F21" }}>
                        {item.isFree ? "Rs 0 (FREE)" : `Rs ${(item.quantity * getItemUnitPrice(item)).toLocaleString()}`}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <div className="flex items-center gap-1">
                        {isItemEditable && (
                          <button
                            type="button"
                            onClick={() => toggleFreeItem(item.menuItem.id, item.isNew)}
                            className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded transition-all cursor-pointer border ${item.isFree
                              ? "bg-emerald-500 text-white border-emerald-400"
                              : "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/30"
                              }`}
                            title={item.isFree ? "Remove free status" : "Make this item 100% Free"}
                          >
                            {item.isFree ? "FREE" : "🎁 Free"}
                          </button>
                        )}
                        {isItemEditable && (
                          <button
                            onClick={() => setCommentEditingItemId(commentEditingItemId === item.menuItem.id ? null : item.menuItem.id)}
                            className="cursor-pointer p-0.5 rounded transition-colors"
                            style={{ color: item.comment || item.customItemPrice !== undefined ? "#FBBF24" : "#2A3A5A" }}
                            title="Edit comment & item price"
                          >
                            <MessageCircle size={12} className="hover:text-amber-400 transition-colors" />
                          </button>
                        )}
                        {isItemEditable && (
                          <button onClick={() => removeFromCart(item.menuItem.id)} className="cursor-pointer p-0.5 rounded" style={{ color: "#2A3A5A" }}>
                            <X size={12} className="hover:text-red-400 transition-colors" />
                          </button>
                        )}
                      </div>
                      {!isItemEditable ? (
                        <span className="text-[9px] font-mono font-black text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">QTY: {item.quantity}</span>
                      ) : (
                        <div className="flex items-center gap-1 rounded-lg overflow-hidden border border-slate-200 bg-white">
                          <button
                            onClick={() => updateQuantity(item.menuItem.id, -1)}
                            className="w-6 h-6 flex items-center justify-center cursor-pointer transition-colors bg-slate-100 hover:bg-slate-200 text-slate-700"
                          >
                            <Minus size={9} />
                          </button>
                          <span className="text-[11px] font-black font-mono w-5 text-center text-slate-900">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.menuItem.id, 1)}
                            className="w-6 h-6 flex items-center justify-center cursor-pointer transition-colors bg-sky-50 hover:bg-sky-100 text-sky-600"
                          >
                            <Plus size={9} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {displayedItems.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 bg-slate-100 border border-slate-200">
                    <ShoppingBag size={22} className="text-slate-400" />
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Ticket Empty</p>
                  <p className="text-[10px] mt-1 text-slate-400">Tap a menu item to add</p>
                </div>
              )}
            </div>

            {/* Totals & Pay Button */}
            <div className="p-4 shrink-0 space-y-3 border-t border-slate-200 bg-slate-50">
              <div className="rounded-xl p-3.5 space-y-2.5 bg-white border border-slate-200">
                <div className="flex justify-between items-center text-[10px] text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-mono">Rs {displayedSubtotal.toLocaleString()}</span>
                </div>

                {/* Discount Inputs */}
                <div className="space-y-1.5 pt-1.5 border-t border-slate-200">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black uppercase text-slate-600">Discount</span>
                    <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 p-0.5 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setDiscountType("percentage")}
                        className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md transition-colors cursor-pointer border-none ${discountType === "percentage" ? "bg-sky-500 text-white" : "bg-transparent text-slate-600 hover:text-slate-900"}`}
                      >
                        %
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiscountType("fixed")}
                        className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md transition-colors cursor-pointer border-none ${discountType === "fixed" ? "bg-sky-500 text-white" : "bg-transparent text-slate-600 hover:text-slate-900"}`}
                      >
                        LKR
                      </button>
                    </div>
                  </div>
                  <div>
                    <input
                      type="number"
                      min="0"
                      placeholder={discountType === "percentage" ? "Enter % (e.g. 10)" : "Enter LKR (e.g. 500)"}
                      value={discountValue || ""}
                      onChange={(e) => setDiscountValue(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full text-[10px] px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-sky-500 outline-none text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-900">Total</span>
                  <span className="text-xl font-black font-mono text-sky-600">Rs {displayedTotal.toLocaleString()}</span>
                </div>
              </div>

              {selectedInvoiceId ? (
                <div className="space-y-2.5">
                  {/* Status Advancement Button */}
                  {selectedOrder && ["Preparing", "Ready", "Dispatched"].includes(selectedOrder.status) && (
                    <button
                      onClick={handleStatusAdvance}
                      className="w-full font-black py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-[10px] cursor-pointer uppercase tracking-widest text-white shadow-lg active:scale-95 hover:opacity-90"
                      style={{
                        background: selectedOrder.status === "Preparing"
                          ? "linear-gradient(135deg, #F59E0B, #D97706)" // Orange for Ready
                          : selectedOrder.status === "Ready" && selectedOrder.type === "Delivery"
                            ? "linear-gradient(135deg, #3B82F6, #2563EB)" // Blue for Dispatch
                            : "linear-gradient(135deg, #10B981, #059669)", // Green for Complete
                        boxShadow: "0 4px 15px rgba(0,0,0,0.2)"
                      }}
                    >
                      {selectedOrder.status === "Preparing" && "Mark as Ready"}
                      {selectedOrder.status === "Ready" && selectedOrder.type === "Delivery" && "Dispatch Order"}
                      {selectedOrder.status === "Ready" && selectedOrder.type !== "Delivery" && "Mark as Completed / Collected"}
                      {selectedOrder.status === "Dispatched" && "Mark as Completed / Delivered"}
                    </button>
                  )}

                  {/* Actions Row */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdateOrder}
                      className="flex-1 font-black py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-[10px] cursor-pointer bg-[#FF6B35] hover:bg-[#F26F21] text-white shadow-lg shadow-orange-500/20 uppercase tracking-widest active:scale-95"
                    >
                      <span>Update Order</span>
                    </button>
                    <button
                      onClick={() => {
                        if (selectedOrder) {
                          setLatestOrder(selectedOrder);
                          setShowReceiptModal(true);
                        }
                      }}
                      className="font-black p-3 rounded-xl transition-all duration-200 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 active:scale-95 cursor-pointer"
                      title="Reprint Receipt"
                    >
                      <Printer size={13} />
                    </button>
                    <button
                      onClick={() => setSelectedInvoiceId(null)}
                      className="font-black p-3 rounded-xl transition-all duration-200 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 active:scale-95 cursor-pointer"
                      title="Close Ticket"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {unclosedPastShiftInfo && (
                    <div
                      onClick={() => setShowUnsettledTallyModal(true)}
                      className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between cursor-pointer hover:bg-amber-100 transition shadow-sm animate-pulse"
                      title="Click to view unsettled shift details"
                    >
                      <div className="flex items-center gap-1.5 font-bold text-[11px]">
                        <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                        <span>Shift {unclosedPastShiftInfo.formattedDate} Unsettled</span>
                      </div>
                      <span className="text-[10px] font-black underline uppercase tracking-wider text-amber-700">
                        Tally Required →
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleParkCurrentOrder}
                      disabled={cart.length === 0}
                      className="min-h-[44px] px-3.5 rounded-xl bg-white border border-slate-200 hover:border-amber-300 hover:bg-amber-50 text-slate-700 hover:text-amber-800 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition"
                      title="Hold / Park Order"
                    >
                      <PauseCircle size={15} />
                      <span>Hold</span>
                    </button>
                    <button
                      onClick={handlePlaceOrderClick}
                      disabled={cart.length === 0}
                      className={`flex-1 min-h-[44px] font-bold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-xs cursor-pointer disabled:cursor-not-allowed uppercase tracking-wider active:scale-95 ${
                        cart.length === 0
                          ? "bg-slate-200 text-slate-500"
                          : unclosedPastShiftInfo
                          ? "bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
                          : "bg-sky-500 hover:bg-sky-600 text-white shadow-sm"
                      }`}
                    >
                      {unclosedPastShiftInfo ? <AlertTriangle size={15} /> : <Check size={15} />}
                      <span>{unclosedPastShiftInfo ? "Tally Required to Order" : "Place Order (F2)"}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Subtle ? Keyboard Shortcuts Legend Pill */}
              <div className="relative pt-1 flex items-center justify-between text-[11px] text-slate-500">
                <span>Zone: <strong className="text-slate-700">{focusZone}</strong> (Tab)</span>
                <button
                  type="button"
                  onClick={() => setShowShortcutsLegend((p) => !p)}
                  className="px-2 py-0.5 rounded-md bg-white border border-white/[0.08] text-slate-500 hover:text-white cursor-pointer"
                  title="Keyboard Shortcuts"
                >
                  ? Keys
                </button>
                {showShortcutsLegend && (
                  <div className="absolute bottom-8 right-0 w-72 bg-white border border-white/[0.1] rounded-xl p-3.5 shadow-2xl z-50 text-xs space-y-1.5 text-slate-700">
                    <p className="font-semibold text-white pb-1 border-b border-white/[0.06]">POS Keyboard Shortcuts</p>
                    <div className="flex justify-between"><span>Grid Nav</span><span className="font-mono text-slate-500">Arrows</span></div>
                    <div className="flex justify-between"><span>Add / Qty</span><span className="font-mono text-slate-500">Enter / + / -</span></div>
                    <div className="flex justify-between"><span>Categories</span><span className="font-mono text-slate-500">[ / ]</span></div>
                    <div className="flex justify-between"><span>Grid ↔ Cart</span><span className="font-mono text-slate-500">Tab</span></div>
                    <div className="flex justify-between"><span>Orders Log</span><span className="font-mono text-slate-500">F4 / Alt+O</span></div>
                    <div className="flex justify-between"><span>Checkout</span><span className="font-mono text-slate-500">F2 / Ctrl+Enter</span></div>
                    <div className="flex justify-between"><span>Park / Recall</span><span className="font-mono text-slate-500">F8 / F9</span></div>
                    <div className="flex justify-between"><span>Quick Search</span><span className="font-mono text-slate-500">/ or Ctrl+K</span></div>
                    <div className="flex justify-between"><span>Print Receipt</span><span className="font-mono text-slate-500">Ctrl+P</span></div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </aside>
      )}
      </div>

      {/* Unsettled Shift Tally Blocker Modal / Warning Popup */}
      {showUnsettledTallyModal && unclosedPastShiftInfo && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white border-2 border-amber-500 rounded-3xl p-6 sm:p-7 max-w-md w-full text-center space-y-5 shadow-2xl relative">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center mx-auto text-amber-600 shadow-inner">
              <AlertTriangle size={32} />
            </div>

            <div className="space-y-2">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200">
                Order Placement Locked
              </span>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">
                Previous Shift Tally Required
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                The shift balance for <strong className="text-amber-700 font-mono text-sm">{unclosedPastShiftInfo.formattedDate}</strong> must be tallied and submitted by the owner before any new orders can be placed for today.
              </p>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 text-left text-xs space-y-2 text-slate-700">
              <div className="flex justify-between items-center pb-1.5 border-b border-amber-200/60">
                <span className="text-slate-500">Unsettled Shift Date:</span>
                <span className="font-mono font-black text-amber-800">{unclosedPastShiftInfo.formattedDate}</span>
              </div>
              <div className="flex justify-between items-center pb-1.5 border-b border-amber-200/60">
                <span className="text-slate-500">Tally Status:</span>
                <span className="font-bold text-rose-600 uppercase text-[10px] px-2 py-0.5 rounded bg-rose-50 border border-rose-200">
                  Not Submitted
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Balance Carry-Over:</span>
                <span className="font-semibold text-slate-800 text-[11px]">
                  Any shortage / excess will continue to next day
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedLogDate(unclosedPastShiftInfo.formattedDate);
                  setActiveSidebar("reports");
                  setShowUnsettledTallyModal(false);
                  setShowCustomerModal(false);
      setOrderBookingDate(null);
                  setShowOrderTypeModal(false);
                }}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-3.5 rounded-xl uppercase tracking-wider text-xs cursor-pointer transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Tally {unclosedPastShiftInfo.formattedDate} Shift Now</span>
                <span className="text-sm">→</span>
              </button>
              <button
                type="button"
                onClick={() => setShowUnsettledTallyModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px] cursor-pointer border border-slate-200 transition-all"
              >
                Dismiss Warning
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="space-y-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                {pinPurpose === "delete_customer" ? "Admin Authorization" : "Enter PIN"}
              </h3>
              <p className="text-[10px] text-slate-500">
                {pinPurpose === "delete_customer"
                  ? "Enter manager passcode (1234) to delete customer profile"
                  : pinPurpose === "menu"
                    ? "Enter passcode (1234) to unlock menu management"
                    : "Enter passcode (1234) to unlock sensitive data"}
              </p>
            </div>
            <div className="flex justify-center gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`w-8 h-8 rounded border flex items-center justify-center font-mono ${pinInput.length > i ? "border-sky-500 bg-sky-50 text-sky-700" : "border-slate-200 text-slate-400"}`}>
                  {pinInput.length > i ? "•" : ""}
                </div>
              ))}
            </div>
            {pinError && <p className="text-rose-600 text-xs font-bold">{pinError}</p>}
            <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "Clear", "0", "Close"].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    if (val === "Clear") setPinInput("");
                    else if (val === "Close") {
                      setShowPinModal(false);
                      setPendingDeleteCustomerPhone(null);
                    }
                    else handlePinKeyPress(val);
                  }}
                  className="bg-slate-50 border border-slate-200 text-slate-800 py-2 rounded font-bold text-xs cursor-pointer hover:bg-sky-50 hover:border-sky-300 transition-all"
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Invoice Receipt & KOT Print Modal */}
      {showReceiptModal && latestOrder && (
        <ReceiptPrintModal
          order={latestOrder as any}
          customers={customers}
          onClose={() => setShowReceiptModal(false)}
          onConfirmPrint={confirmAndPrintInvoice}
          onOpenBill={(urlPath) => router.push(urlPath)}
          onToast={(msg, type) => triggerToast(msg, type)}
        />
      )}

      {/* Global Ctrl+K Quick Search Modal */}
      <QuickSearchModal
        isOpen={showQuickSearch}
        onClose={() => setShowQuickSearch(false)}
        menuItems={menuItems as any}
        orders={orderHistory as any}
        customers={customers}
        onSelectMenuItem={(item) => {
          addToCart(item as any);
          setActiveSidebar("new_order");
        }}
        onSelectOrder={(ord) => {
          setLatestOrder(ord as any);
          setShowReceiptModal(true);
        }}
        onSelectCustomer={(c) => {
          setCustomerName(c.name);
          setCustomerPhone(c.phone);
          setCustomerAddress(c.address || "");
          triggerToast(`Loaded customer ${c.name}`, "info");
        }}
      />

      {/* Order Type Selection Modal (Pops up when clicking Place Order) */}
      {showOrderTypeModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-sm w-full text-center space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowOrderTypeModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase text-[#FF6B35] tracking-widest block">Order Fulfillment</span>
              <h3 className="text-sm font-bold text-slate-900">Delivery or Takeaway?</h3>
              <p className="text-[10px] text-slate-500">Select order type to proceed to customer details</p>
            </div>

            <div className="grid grid-cols-1 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => handleSelectOrderType("Delivery")}
                className={`flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 hover:bg-[#3B82F6]/10 border transition-all cursor-pointer text-left group active:scale-95 ${orderTypeModalIndex === 0 ? "ring-2 ring-emerald-400/80 border-emerald-400/60" : "border-slate-200 hover:border-[#3B82F6]/50"
                  }`}
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform shrink-0">
                  <Truck size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-400 transition-colors">Direct Delivery</h4>
                  <p className="text-[9px] text-slate-500 mt-0.5">Home delivery with customer address</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectOrderType("Take Away")}
                className={`flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 hover:bg-[#F26F21]/10 border transition-all cursor-pointer text-left group active:scale-95 ${orderTypeModalIndex === 1 ? "ring-2 ring-emerald-400/80 border-emerald-400/60" : "border-slate-200 hover:border-[#F26F21]/50"
                  }`}
              >
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform shrink-0">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-orange-400 transition-colors">Takeaway / Pickup</h4>
                  <p className="text-[9px] text-slate-500 mt-0.5">Customer collects order at counter</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectOrderType("3rd Party")}
                className={`flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 hover:bg-[#8B5CF6]/10 border transition-all cursor-pointer text-left group active:scale-95 ${orderTypeModalIndex === 2 ? "ring-2 ring-emerald-400/80 border-emerald-400/60" : "border-slate-200 hover:border-[#8B5CF6]/50"
                  }`}
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform shrink-0">
                  <Smartphone size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-purple-400 transition-colors">3rd Party Delivery</h4>
                  <p className="text-[9px] text-slate-500 mt-0.5">Uber Eats / PickMe Food rider pickup</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectOrderType("Dine In")}
                className={`flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 hover:bg-emerald-500/10 border transition-all cursor-pointer text-left group active:scale-95 ${orderTypeModalIndex === 3 ? "ring-2 ring-emerald-400/80 border-emerald-400/60" : "border-slate-200 hover:border-emerald-500/50"
                  }`}
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform shrink-0">
                  <Utensils size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">Dine In</h4>
                  <p className="text-[9px] text-slate-500 mt-0.5">Customer eats inside the restaurant</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Details Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full space-y-6 shadow-2xl relative" style={{ boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
            <button
              onClick={() => setShowCustomerModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="text-center space-y-1.5">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">Customer Details</h3>
              <p className="text-[10px] text-slate-500">Search customer by phone or create new profile</p>
            </div>

            {/* Order Type Pill Selector inside Customer Modal */}
            <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200 gap-0.5">
              <button
                type="button"
                onClick={() => setOrderType("Direct")}
                className={`flex-1 text-[9px] font-black uppercase tracking-wider py-2 rounded-lg transition-all cursor-pointer text-center ${orderType === "Direct"
                  ? "bg-[#3B82F6] text-white shadow"
                  : "text-slate-500 hover:text-slate-800"
                  }`}
              >
                🚚 Delivery
              </button>
              <button
                type="button"
                onClick={() => setOrderType("POS")}
                className={`flex-1 text-[9px] font-black uppercase tracking-wider py-2 rounded-lg transition-all cursor-pointer text-center ${orderType === "POS"
                  ? "bg-[#F26F21] text-white shadow"
                  : "text-slate-500 hover:text-slate-800"
                  }`}
              >
                🛍️ Takeaway
              </button>
              <button
                type="button"
                onClick={() => setOrderType("3rd Party")}
                className={`flex-1 text-[9px] font-black uppercase tracking-wider py-2 rounded-lg transition-all cursor-pointer text-center ${orderType === "3rd Party"
                  ? "bg-[#8B5CF6] text-white shadow"
                  : "text-slate-500 hover:text-slate-800"
                  }`}
              >
                🛵 3rd Party
              </button>
              <button
                type="button"
                onClick={() => setOrderType("Dine In")}
                className={`flex-1 text-[9px] font-black uppercase tracking-wider py-2 rounded-lg transition-all cursor-pointer text-center ${orderType === "Dine In"
                  ? "bg-emerald-500 text-white shadow"
                  : "text-slate-500 hover:text-slate-800"
                  }`}
              >
                🍽️ Dine In
              </button>
            </div>

            <div className="space-y-4">
              {/* Phone Input with Country Code Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Phone Number (CMS ID)</label>
                <div className="flex gap-2">
                  <select
                    value={customerCountryCode}
                    onChange={(e) => {
                      const newCc = e.target.value;
                      setCustomerCountryCode(newCc);
                      handlePhoneChange(customerPhone, newCc);
                    }}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 outline-none cursor-pointer focus:border-[#FF6B35]/60"
                  >
                    <option value="+94">+94 (SL)</option>
                    <option value="+1">+1 (US)</option>
                    <option value="+44">+44 (UK)</option>
                    <option value="+91">+91 (IN)</option>
                    <option value="+61">+61 (AU)</option>
                    <option value="+971">+971 (AE)</option>
                  </select>
                  <input
                    type="text"
                    placeholder="771234567"
                    value={customerPhone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-[#FF6B35]/60"
                    required
                  />
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-1.5 relative">
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Full Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    setShowNameSuggestions(true);
                  }}
                  onFocus={() => setShowNameSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowNameSuggestions(false), 200)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-[#FF6B35]/60"
                  required
                />

                {/* Suggestions List */}
                {showNameSuggestions && customerName && (
                  (() => {
                    const filtered = customers.filter(c =>
                      c.name.toLowerCase().includes(customerName.toLowerCase()) &&
                      c.name.toLowerCase() !== customerName.toLowerCase()
                    ).slice(0, 5);

                    if (filtered.length === 0) return null;

                    return (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xl z-50 divide-y divide-[#1A2640] max-h-[180px] overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                        {filtered.map(c => (
                          <button
                            key={c.phone}
                            type="button"
                            onMouseDown={() => {
                              setCustomerName(c.name);

                              let phoneVal = c.phone;
                              let ccVal = "+94";
                              if (phoneVal.startsWith("+")) {
                                ccVal = phoneVal.substring(0, 3);
                                phoneVal = phoneVal.substring(3);
                              }
                              setCustomerCountryCode(ccVal);
                              setCustomerPhone(phoneVal);

                              setCustomerAddress(c.address);
                              const parsed = parseAddress(c.address);
                              setAddrHomeNo(parsed.homeNo);
                              setAddrStreet(parsed.street);
                              setAddrPostalArea(parsed.postalArea);
                              setAddrPostalCode(parsed.postalCode);
                              setOriginalAutofilledAddress(c.address);
                              setShowAddressSelector(false);

                              setShowNameSuggestions(false);
                            }}
                            className="w-full text-left px-4 py-2 flex flex-col gap-0.5 cursor-pointer hover:bg-[#FF6B35]/10 transition-colors"
                          >
                            <div className="flex justify-between items-center w-full">
                              <span className="font-extrabold text-[11px] text-white">{c.name}</span>
                              <span className="text-[9px] font-mono font-bold text-[#FF9F1C]">{c.phone}</span>
                            </div>
                            <span className="text-[9px] text-slate-500 truncate w-full">{c.address}</span>
                          </button>
                        ))}
                      </div>
                    );
                  })()
                )}
              </div>

              {/* Address (Structured) */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Delivery Address</label>
                  {originalAutofilledAddress && (
                    <button
                      type="button"
                      onClick={() => {
                        setAddrHomeNo("");
                        setAddrStreet("");
                        setAddrPostalArea("");
                        setAddrPostalCode("");
                        setCustomerAddress("");
                        setShowAddressSelector(true);
                        setActiveAddressTab("new");
                      }}
                      className="text-[9px] font-bold text-[#FF6B35] hover:text-[#F26F21] transition-colors uppercase tracking-wider cursor-pointer bg-none border-none p-0"
                    >
                      not this adress? add new one
                    </button>
                  )}
                </div>

                {showAddressSelector && originalAutofilledAddress && (() => {
                  const isSavedActive = activeAddressTab === "saved";

                  const currentCustomerObj = customers.find(c => {
                    let searchPhone = customerCountryCode + customerPhone;
                    // Check clean version of phone numbers to be safe
                    return c.phone.replace(/\D/g, "") === searchPhone.replace(/\D/g, "");
                  });
                  const addressLabel = currentCustomerObj?.address_label || "Address 1";
                  const displayLabelText = addressLabel === "Home" ? "🏠 Home" : addressLabel === "Office" ? "💼 Office" : addressLabel === "Work" ? "🏢 Work" : addressLabel === "Other" ? "📍 Other" : `📍 ${addressLabel}`;

                  return (
                    <div className="flex gap-3 items-center py-0.5 animate-fadeIn">
                      {/* Saved Address Circle Selection */}
                      <button
                        type="button"
                        onClick={() => {
                          const parsed = parseAddress(originalAutofilledAddress);
                          setAddrHomeNo(parsed.homeNo);
                          setAddrStreet(parsed.street);
                          setAddrPostalArea(parsed.postalArea);
                          setAddrPostalCode(parsed.postalCode);
                          setCustomerAddress(originalAutofilledAddress);
                          setActiveAddressTab("saved");
                        }}
                        className={`flex items-center gap-1.5 text-[9px] font-extrabold px-3 py-1 rounded-full border transition-all cursor-pointer ${isSavedActive
                          ? "bg-[#FF6B35]/15 text-[#FF6B35] border-[#FF6B35]/30"
                          : "bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-700 hover:text-slate-700"
                          }`}
                      >
                        <span className={`w-2 h-2 rounded-full border flex items-center justify-center ${isSavedActive ? "border-[#FF6B35] bg-[#FF6B35]" : "border-slate-500"
                          }`} />
                        <span>{displayLabelText}</span>
                      </button>

                      {/* New Address Circle Selection */}
                      <button
                        type="button"
                        onClick={() => {
                          setAddrHomeNo("");
                          setAddrStreet("");
                          setAddrPostalArea("");
                          setAddrPostalCode("");
                          setCustomerAddress("");
                          setActiveAddressTab("new");
                        }}
                        className={`flex items-center gap-1.5 text-[9px] font-extrabold px-3 py-1 rounded-full border transition-all cursor-pointer ${!isSavedActive
                          ? "bg-[#FF6B35]/15 text-[#FF6B35] border-[#FF6B35]/30"
                          : "bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-700 hover:text-slate-700"
                          }`}
                      >
                        <span className={`w-2 h-2 rounded-full border flex items-center justify-center ${!isSavedActive ? "border-[#FF6B35] bg-[#FF6B35]" : "border-slate-500"
                          }`} />
                        <span>New Address</span>
                      </button>
                    </div>
                  );
                })()}

                {/* Home No & Street Name */}
                <div className="flex gap-2">
                  <div className="w-1/3">
                    <input
                      type="text"
                      placeholder="Home NO"
                      value={addrHomeNo}
                      onChange={(e) => {
                        setAddrHomeNo(e.target.value);
                        setActiveAddressTab("new");
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-[#FF6B35]/60"
                    />
                  </div>
                  <div className="w-2/3">
                    <input
                      type="text"
                      placeholder="Street Name"
                      value={addrStreet}
                      onChange={(e) => {
                        setAddrStreet(e.target.value);
                        setActiveAddressTab("new");
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-[#FF6B35]/60"
                    />
                  </div>
                </div>

                {/* Postal Area & Postal Code */}
                <div className="flex gap-2">
                  <div className="w-2/3">
                    <select
                      value={addrPostalArea}
                      onChange={(e) => {
                        const area = e.target.value;
                        setAddrPostalArea(area);
                        setAddrPostalCode(POSTAL_CODES[area] || "");
                        setActiveAddressTab("new");
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-[#FF6B35]/60 cursor-pointer"
                    >
                      <option value="">Select Postal Area...</option>
                      {Object.keys(POSTAL_CODES).sort().map(area => (
                        <option key={area} value={area}>{area}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-1/3">
                    <input
                      type="text"
                      placeholder="Post Code"
                      value={addrPostalCode}
                      readOnly
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-500 outline-none cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Combined Preview */}
                <div className="bg-slate-100 border border-slate-200 p-2 rounded-xl text-[9px] text-slate-600 font-mono flex items-center justify-between">
                  <span className="text-[8px] text-slate-500 uppercase font-black tracking-wider">Preview:</span>
                  <span className="truncate flex-1 text-right pl-2 text-slate-800">{customerAddress || "(empty address)"}</span>
                </div>
              </div>
            </div>

            {/* Delivery Charges Input Box (Shown when orderType is Direct/Delivery) */}
            {orderType === "Direct" && (
              <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-blue-200">
                <div className="flex justify-between items-center">
                  <label className="block text-[9px] font-black text-blue-700 uppercase tracking-widest">
                    🚚 Delivery Charges (LKR)
                  </label>
                  <span className="text-[9px] font-bold text-slate-700 font-mono">
                    {deliveryFee > 0 ? `+ LKR ${deliveryFee.toLocaleString()}` : "Free Delivery"}
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  placeholder="0 (Free Delivery)"
                  value={deliveryFee || ""}
                  onChange={(e) => setDeliveryFee(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 font-mono"
                />
              </div>
            )}

            <div className="pt-2 flex gap-2">
              <button
                onClick={handleConfirmPlaceOrder}
                disabled={isPlacingOrder}
                className="flex-1 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl cursor-pointer disabled:cursor-not-allowed text-xs uppercase tracking-wider flex items-center justify-center gap-2"
              >
                {isPlacingOrder ? (
                  <>
                    <RotateCw size={13} className="animate-spin text-white" />
                    <span>Placing Order...</span>
                  </>
                ) : (
                  <span>Confirm &amp; Place Order</span>
                )}
              </button>
              <button
                onClick={() => setShowCustomerModal(false)}
                disabled={isPlacingOrder}
                className="bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-bold px-5 py-3 rounded-xl cursor-pointer text-xs uppercase tracking-wider border border-slate-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Item Form Modal */}
      {showInventoryModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full space-y-6 shadow-2xl relative" style={{ boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
            <button
              onClick={() => setShowInventoryModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="text-center space-y-1">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                {editingInventoryItem ? "Edit Inventory Item" : "Add Inventory Item"}
              </h3>
              <p className="text-[10px] text-slate-500">Record and track kitchen stock levels</p>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
              {/* Item Name */}
              <div className="space-y-1.5">
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Item Name</label>
                <input
                  type="text"
                  placeholder="e.g. Cheese Block"
                  value={invName}
                  onChange={(e) => setInvName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-900 outline-none focus:border-[#FF6B35]/60"
                  required
                />
              </div>

              {/* SKU & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">SKU / Barcode</label>
                  <input
                    type="text"
                    placeholder="e.g. SKU-12345"
                    value={invSku}
                    onChange={(e) => setInvSku(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-900 outline-none focus:border-[#FF6B35]/60"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Category</label>
                  <select
                    value={invCategory}
                    onChange={(e) => setInvCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-900 outline-none cursor-pointer focus:border-[#FF6B35]/60"
                  >
                    <option value="Produce">Produce</option>
                    <option value="Meat">Meat</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Dry Goods">Dry Goods</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Packaging">Packaging</option>
                    <option value="Spices">Spices</option>
                  </select>
                </div>
              </div>

              {/* Measurement & Stock */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Unit</label>
                  <select
                    value={invUnit}
                    onChange={(e) => setInvUnit(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-3 text-xs text-slate-900 outline-none cursor-pointer focus:border-[#FF6B35]/60"
                  >
                    <option value="lbs">Pounds (lbs)</option>
                    <option value="oz">Ounces (oz)</option>
                    <option value="cases">Cases</option>
                    <option value="liters">Liters</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="units">Units</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Par Level</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Min Stock"
                    value={invParLevel || ""}
                    onChange={(e) => setInvParLevel(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs text-slate-900 outline-none focus:border-[#FF6B35]/60 font-mono"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Quantity</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Current Stock"
                    value={invQuantity || ""}
                    onChange={(e) => setInvQuantity(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs text-slate-900 outline-none focus:border-[#FF6B35]/60 font-mono"
                    required
                  />
                </div>
              </div>

              {/* Cost & Supplier */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Unit Cost (LKR)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Cost per unit"
                    value={invUnitCost || ""}
                    onChange={(e) => setInvUnitCost(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-900 outline-none focus:border-[#FF6B35]/60 font-mono"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Supplier Name</label>
                  <input
                    type="text"
                    placeholder="Supplier Co."
                    value={invSupplier}
                    onChange={(e) => setInvSupplier(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-900 outline-none focus:border-[#FF6B35]/60"
                  />
                </div>
              </div>

              {/* Expiration & Storage Location */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Expiration Date</label>
                  <input
                    type="date"
                    value={invExpirationDate}
                    onChange={(e) => setInvExpirationDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-900 outline-none focus:border-[#FF6B35]/60 cursor-pointer font-mono"
                    style={{ colorScheme: "dark" }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Storage Location</label>
                  <select
                    value={invStorageLocation}
                    onChange={(e) => setInvStorageLocation(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-900 outline-none cursor-pointer focus:border-[#FF6B35]/60"
                  >
                    <option value="Cooler">Cooler</option>
                    <option value="Freezer">Freezer</option>
                    <option value="Dry Shelf">Dry Shelf</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={handleSaveInventoryItem}
                className="flex-1 bg-[#FF6B35] hover:bg-[#F26F21] text-white font-bold py-3 rounded-xl cursor-pointer text-xs uppercase tracking-wider transition-colors active:scale-95"
              >
                Save Product
              </button>
              <button
                onClick={() => setShowInventoryModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-3 rounded-xl cursor-pointer text-xs uppercase tracking-wider border border-slate-200 active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CMS Profiles Modal */}
      <CustomerCmsModal
        isOpen={showCMSModal}
        onClose={() => setShowCMSModal(false)}
        customers={customers}
        orderHistory={orderHistory as any}
        cmsSearchQuery={cmsSearchQuery}
        setCmsSearchQuery={setCmsSearchQuery}
        editingCustomer={editingCustomer}
        setEditingCustomer={setEditingCustomer}
        onSaveCustomerEdit={(e) => {
          e.preventDefault();
          handleSaveCustomer();
        }}
        onDeleteCustomer={handleDeleteCustomerClick}
      />

      {/* Split Bill Payment Modal */}
      {splitModalOrder && (
        <SplitPaymentModal
          isOpen={!!splitModalOrder}
          onClose={() => setSplitModalOrder(null)}
          order={splitModalOrder as any}
          currentBizDate={getTodayDateStr()}
          onConfirmSplit={async (orderId, cashAmt, bankAmt, settledBizDate) => {
            await handlePaymentStatusChange(orderId, "Split", {
              cashAmount: cashAmt,
              bankAmount: bankAmt,
              settledBizDate,
            });
            setSplitModalOrder(null);
          }}
        />
      )}

      {/* Custom / Special Order Product Modal */}
      {showCustomItemModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl relative" style={{ boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
            <button
              type="button"
              onClick={() => setShowCustomItemModal(false)}
              className="absolute top-5 right-5 text-slate-500 hover:text-white cursor-pointer transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#F26F21]/20 border border-[#F26F21]/40 flex items-center justify-center shrink-0">
                <Plus size={20} className="text-[#F26F21]" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">Add Custom Product</h3>
                <p className="text-[10px] text-slate-500">First-time item, special request or open price product</p>
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleAddCustomItemToCart(); }} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  Product Name / Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Special Seafood Kottu / First Time Dish"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-[#F26F21]"
                  autoFocus
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    Price (LKR) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 1500"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono outline-none focus:border-[#F26F21]"
                    min="0"
                    step="any"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    Category
                  </label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-[#F26F21] cursor-pointer"
                  >
                    <option value="Special Orders">Special Orders</option>
                    {CATEGORIES.filter(c => c !== "All Categories").map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  Portion / Size
                </label>
                <input
                  type="text"
                  placeholder="e.g. Large Portion, Regular, Portion 1"
                  value={customPortion}
                  onChange={(e) => setCustomPortion(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-[#F26F21]"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-[#F26F21] hover:bg-[#e05c0d] text-white font-bold py-3 rounded-xl cursor-pointer text-xs uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Plus size={15} /> Add to Ticket
                </button>
                <button
                  type="button"
                  onClick={() => setShowCustomItemModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-3 rounded-xl cursor-pointer text-xs uppercase tracking-wider border border-slate-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      </div>

      {/* Internet Speed & Connectivity Guard Overlay */}
      {isNetworkUnstable && (
        <NetworkSpeedOverlay
          isOnline={isOnline}
          speedMbps={networkSpeedMbps}
          minRequiredMbps={1.0}
          onRetry={measureNetworkSpeed}
          isChecking={isSpeedChecking}
        />
      )}
    </>
  );
}
