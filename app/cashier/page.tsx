"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
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
  Image as ImageIcon,
  BarChart3,
  Bell,
  MessageCircle,
  Wifi,
  WifiOff,
  Eye,
  EyeOff
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
  isNew?: boolean;
  comment?: string;
}

interface CustomerDetails {
  phone: string;
  name: string;
  address: string;
}

interface Order {
  id: string;
  timestamp: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: "Preparing" | "Ready" | "Dispatched" | "Completed" | "Voided" | "Ignored";
  type: "POS" | "Direct" | "3rd Party" | "Take Away" | "Pick Up" | "Delivery";
  customer?: CustomerDetails;
}

type ToastType = "success" | "error" | "info" | "warning";

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

const CATEGORIES = ["All Categories", "Fried Rice", "Chopsuey", "Kottu", "Ultimate Bites", "Pasta", "Beverages"];

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
      case "Pasta":        return { emoji: "🍝", accent: "#EC4899", bg: "rgba(236,72,153,0.08)" };
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
  return (
    <div className="bg-[#111625] border border-[#222E4E] rounded-2xl overflow-y-auto max-h-[550px]" style={{ scrollbarWidth: "thin" }}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[#222E4E] text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-[#090D1A] sticky top-0 z-10 shadow-sm">
            <th className="px-5 py-3.5 bg-[#090D1A]">Product ID (SKU)</th>
            <th className="px-5 py-3.5 bg-[#090D1A]">Item Name</th>
            <th className="px-5 py-3.5 bg-[#090D1A]">Category</th>
            <th className="px-5 py-3.5 bg-[#090D1A]">Portion</th>
            <th className="px-5 py-3.5 bg-[#090D1A]">Price</th>
            <th className="px-5 py-3.5 text-right bg-[#090D1A]">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#222E4E] text-xs">
          {items.map(item => (
            <tr key={item.id} className="hover:bg-white/[0.01] transition-colors">
              <td className="px-5 py-3 font-mono text-xs font-black text-orange-400">{item.sku || "N/A"}</td>
              <td className="px-5 py-3 font-bold text-slate-200">{item.title}</td>
              <td className="px-5 py-3 text-slate-400">{item.category}</td>
              <td className="px-5 py-3 text-slate-500">{item.portion}</td>
              <td className="px-5 py-3 font-bold text-[#FF6B35]">LKR {item.price.toLocaleString()}</td>
              <td className="px-5 py-3 text-right space-x-2">
                <button
                  type="button"
                  onClick={() => onEdit(item)}
                  className="text-orange-400 hover:text-orange-300 font-bold text-[10px] uppercase cursor-pointer"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  className="text-red-400 hover:text-red-300 font-bold text-[10px] uppercase cursor-pointer"
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
  if (hours < 2) {
    dateCopy.setDate(dateCopy.getDate() - 1);
  }
  const yy = String(dateCopy.getFullYear()).slice(-2);
  const mm = String(dateCopy.getMonth() + 1).padStart(2, "0");
  const dd = String(dateCopy.getDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}

function getNextInvoiceNumber(history: Order[]): string {
  const currentBizDateStr = getBusinessDateStr(new Date());
  const todaysValidOrders = history.filter(o => 
    getBusinessDateStr(o.timestamp) === currentBizDateStr && 
    o.status !== "Ignored" && 
    o.id.startsWith("INV-")
  );
  
  let nextSeq = 1;
  if (todaysValidOrders.length > 0) {
    const seqs = todaysValidOrders
      .map(o => {
        const parts = o.id.split("-");
        return parts.length === 3 ? parseInt(parts[2], 10) : 0;
      })
      .filter(Boolean);
    if (seqs.length > 0) {
      nextSeq = Math.max(...seqs) + 1;
    }
  }
  return `INV-${currentBizDateStr}-${String(nextSeq).padStart(3, "0")}`;
}

function getStatusBadgeStyle(status: Order["status"]): { bg: string; text: string; border: string } {
  switch (status) {
    case "Preparing":  return { bg: "rgba(245,158,11,0.08)", text: "#F59E0B", border: "rgba(245,158,11,0.2)" };
    case "Ready":      return { bg: "rgba(168,85,247,0.08)", text: "#A855F7", border: "rgba(168,85,247,0.2)" };
    case "Dispatched": return { bg: "rgba(59,130,246,0.08)", text: "#3B82F6", border: "rgba(59,130,246,0.2)" };
    case "Completed":  return { bg: "rgba(16,185,129,0.08)", text: "#10B981", border: "rgba(16,185,129,0.2)" };
    case "Voided":     return { bg: "rgba(239,68,68,0.08)",  text: "#EF4444", border: "rgba(239,68,68,0.2)" };
    case "Ignored":    return { bg: "rgba(148,163,184,0.08)", text: "#94A3B8", border: "rgba(148,163,184,0.2)" };
    default:           return { bg: "rgba(148,163,184,0.08)", text: "#94A3B8", border: "rgba(148,163,184,0.2)" };
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
  const [activeSidebar, setActiveSidebar] = useState<"new_order" | "order_history" | "menu_management" | "reports" | "settings">("new_order");
  const [activeCategory, setActiveCategory] = useState("All Categories");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<"POS" | "Direct" | "3rd Party">("POS");
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [commentEditingItemId, setCommentEditingItemId] = useState<number | null>(null);
  const [isDatabaseSyncing, setIsDatabaseSyncing] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(window.navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);
  
  // Customer CMS States
  const [customers, setCustomers] = useState<{ phone: string; name: string; address: string; birthday?: string | null; address_label?: string | null }[]>([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerCountryCode, setCustomerCountryCode] = useState("+94");
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);

  // Structured Address States (POS Checkout)
  const [addrHomeNo, setAddrHomeNo] = useState("");
  const [addrStreet, setAddrStreet] = useState("");
  const [addrPostalArea, setAddrPostalArea] = useState("");
  const [addrPostalCode, setAddrPostalCode] = useState("");
  const [originalAutofilledAddress, setOriginalAutofilledAddress] = useState<string | null>(null);
  const [showAddressSelector, setShowAddressSelector] = useState(false);
  const [activeAddressTab, setActiveAddressTab] = useState<"saved" | "new">("saved");


  // CMS Profiles Modal & Edit States
  const [showCMSModal, setShowCMSModal] = useState(false);
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
          let mappedType: "POS" | "Direct" | "3rd Party" = "POS";
          if (order.type === "Delivery" || order.type === "Direct") {
            mappedType = "Direct";
          } else if (order.type === "3rd Party") {
            mappedType = "3rd Party";
          }
          setOrderType(mappedType);
        }
        lastLoadedIdRef.current = selectedInvoiceId;
      }
    } else {
      if (lastLoadedIdRef.current !== null) {
        setCart([]);
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
    portion: "Serves Two",
    sku: ""
  });

  const syncOfflineOrders = useCallback(async (offlineOrders: Order[]) => {
    console.log("[Sync] Triggering sync for offline orders:", offlineOrders);
    let successfullySynced = 0;
    
    for (const order of offlineOrders) {
      try {
        const { error } = await supabase
          .from("orders")
          .insert({
            id: order.id,
            timestamp: order.timestamp,
            items: order.items,
            subtotal: order.subtotal,
            tax: order.tax,
            total: order.total,
            status: order.status,
            type: order.type,
            customer: order.customer
          });
        
        if (error) {
          console.error(`[Sync] Failed to sync order ${order.id}:`, error);
        } else {
          console.log(`[Sync] Successfully synced order ${order.id} to database.`);
          successfullySynced++;
        }
      } catch (e) {
        console.error(`[Sync] Network error syncing order ${order.id}:`, e);
      }
    }
    
    if (successfullySynced > 0) {
      triggerToast(`Synced ${successfullySynced} offline orders with database`, "success");
    }
  }, []);

  const loadOrdersAndCMS = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setLoadingOrders(true);

    try {
      // 1. Clean up ignored orders older than 2 days in Supabase (non-blocking / 4s timeout)
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
      try {
        await withTimeout(
          Promise.resolve(
            supabase
              .from("orders")
              .delete()
              .eq("status", "Ignored")
              .lt("timestamp", twoDaysAgo)
          ),
          4000
        );
      } catch (e) {
        console.error("Failed to prune expired ignored orders from database:", e);
      }

      // 2. Concurrently fetch orders and customers with 5s timeout
      const [ordersRes, customersRes] = await Promise.allSettled([
        withTimeout(
          Promise.resolve(
            supabase
              .from("orders")
              .select("*")
              .order("timestamp", { ascending: false })
          ),
          5000
        ),
        withTimeout(
          Promise.resolve(
            supabase
              .from("customers")
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
            });
            setOrderHistory(filtered);
          }
        } else if (dbOrders) {
          const formatted = dbOrders.map((o: any) => ({
            ...o,
            items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items,
            customer: typeof o.customer === 'string' ? JSON.parse(o.customer) : o.customer,
            subtotal: Number(o.subtotal),
            tax: Number(o.tax),
            total: Number(o.total)
          }));
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
              const offlineUnsynced = localOrders.filter(lo => lo && lo.id && !dbIds.has(lo.id));
              if (offlineUnsynced.length > 0) {
                merged = [...merged, ...offlineUnsynced].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                console.log("Preserved offline unsynced orders:", offlineUnsynced);
                
                // Trigger sync in the background
                syncOfflineOrders(offlineUnsynced);
              }
            } catch (err) {
              console.error("Failed to parse local orders during merge", err);
            }
          }
          
          setOrderHistory(merged);
          localStorage.setItem("t-cloud-eats-orders", JSON.stringify(merged));
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
      // loadOrdersAndCMS will safely fetch from DB and merge with any unsynced local orders.
      localStorage.removeItem("t-cloud-eats-cms");
      localStorage.removeItem(`t-cloud-eats-notifications-${currentUser}`);
      console.log("Cache expired (10 minutes). Wiping CMS and notification caches.");
    }
    localStorage.setItem("t-cloud-eats-cache-time", now.toString());

    // Load notifications
    const savedNotifications = localStorage.getItem(`t-cloud-eats-notifications-${currentUser}`);
    if (savedNotifications) {
      try {
        const list = JSON.parse(savedNotifications);
        setNotificationsList(list);
        setUnreadCount(list.filter((n: any) => !n.read).length);
      } catch (e) {
        console.error(e);
      }
    } else {
      const defaults = [
        { id: 1, text: "Kitchen Alert: Order INV-260702-001 is ready for Pick Up!", time: "5 mins ago", read: false },
        { id: 2, text: "Rider Alert: Delivery driver assigned to Order INV-260702-002!", time: "12 mins ago", read: false },
        { id: 3, text: "Google Sync: Menu prices updated from Google Sheet.", time: "1 hour ago", read: true }
      ];
      setNotificationsList(defaults);
      setUnreadCount(defaults.filter(n => !n.read).length);
      localStorage.setItem(`t-cloud-eats-notifications-${currentUser}`, JSON.stringify(defaults));
    }

    loadOrdersAndCMS();

    // Subscribe to realtime changes on orders & customers!
    const ordersChannel = supabase
      .channel("realtime-orders-cms")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          loadOrdersAndCMS();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "customers" },
        () => {
          loadOrdersAndCMS();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
    };
  }, [loadOrdersAndCMS]);

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
          let mappedType: "POS" | "Direct" | "3rd Party" = "POS";
          if (payload.orderType === "Delivery" || payload.orderType === "Direct") {
            mappedType = "Direct";
          } else if (payload.orderType === "3rd Party") {
            mappedType = "3rd Party";
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
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinPurpose, setPinPurpose] = useState<"menu" | "prices">("menu");

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
            className="text-slate-500 hover:text-slate-300 transition-colors p-0.5 cursor-pointer flex items-center justify-center"
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
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800/40 hover:bg-slate-700/60 transition-colors cursor-pointer border border-[#222E4E]/40 ${textClass}`}
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
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsList, setNotificationsList] = useState<{ id: number; text: string; time: string; read: boolean }[]>([]);

  const triggerToast = (message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const saveNotifications = (newList: { id: number; text: string; time: string; read: boolean }[]) => {
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
        .from("orders")
        .update(updatePayload)
        .eq("id", orderId)
    )
      .then(({ error }) => {
        if (error) {
          console.error("Supabase order status update error:", error);
          triggerToast("Saved locally, database update failed", "warning");
        } else {
          triggerToast(isIgnoring ? `Order ignored & invoice number removed` : `Order ${orderId} marked as ${newStatus}`, "success");
        }
      })
      .catch((e: any) => {
        console.error("Network error updating order status:", e);
        triggerToast("Saved locally, offline mode active", "warning");
      });
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
        .from("customers")
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
              .from("orders")
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
    const newSubtotal = cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
    const newTax = 0;
    const newTotal = newSubtotal;

    // Strip temporary isNew flag from items before saving
    const cleanCart = cart.map(item => {
      const { isNew, ...rest } = item;
      return rest;
    });

    // 1. Update local state
    const updatedHistory = orderHistory.map(o => {
      if (o.id === selectedInvoiceId) {
        return {
          ...o,
          items: cleanCart,
          subtotal: newSubtotal,
          tax: newTax,
          total: newTotal
        };
      }
      return o;
    });
    setOrderHistory(updatedHistory);
    localStorage.setItem("t-cloud-eats-orders", JSON.stringify(updatedHistory));

    // 2. Update Supabase in background
    Promise.resolve(
      supabase
        .from("orders")
        .update({
          items: cleanCart,
          subtotal: newSubtotal,
          tax: newTax,
          total: newTotal
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
    setSelectedInvoiceId(null);
  };

  const handlePlaceOrderClick = () => {
    if (cart.length === 0) {
      triggerToast("Ticket is empty", "warning");
      return;
    }
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

    // 1. Update local CMS state and localStorage
    const updatedCms = [newCustomer, ...customers.filter(c => c.phone !== formattedPhone)];
    setCustomers(updatedCms);
    localStorage.setItem("t-cloud-eats-cms", JSON.stringify(updatedCms));

    // 2. Upsert customer in Supabase (in background)
    Promise.resolve(
      supabase
        .from("customers")
        .upsert(newCustomer, { onConflict: "phone" })
    )
      .then(({ error: custErr }) => {
        if (custErr) console.error("Supabase customer upsert error:", custErr);
      })
      .catch((e: any) => {
        console.error("Network error saving customer:", e);
      });

    // 3. Create new order in "Preparing" status
    const currentBizDateStr = getBusinessDateStr(new Date());
    const todaysValidOrders = orderHistory.filter(o => 
      getBusinessDateStr(o.timestamp) === currentBizDateStr && 
      o.status !== "Ignored" && 
      o.id.startsWith("INV-")
    );
    
    let nextSeq = 1;
    if (todaysValidOrders.length > 0) {
      const seqs = todaysValidOrders
        .map(o => {
          const parts = o.id.split("-");
          return parts.length === 3 ? parseInt(parts[2], 10) : 0;
        })
        .filter(Boolean);
      if (seqs.length > 0) {
        nextSeq = Math.max(...seqs) + 1;
      }
    }
    const newInvoiceId = `INV-${currentBizDateStr}-${String(nextSeq).padStart(3, "0")}`;

    const newOrder: Order = {
      id: newInvoiceId,
      timestamp: new Date().toISOString(),
      items: cart,
      subtotal,
      tax,
      total,
      status: "Preparing",
      type: orderType,
      customer: newCustomer
    };

    // 4. Update local order logs state and localStorage
    const updatedHistory = [newOrder, ...orderHistory];
    setOrderHistory(updatedHistory);
    localStorage.setItem("t-cloud-eats-orders", JSON.stringify(updatedHistory));

    // 5. Insert order into Supabase (in background)
    Promise.resolve(
      supabase
        .from("orders")
        .insert({
          id: newInvoiceId,
          timestamp: newOrder.timestamp,
          items: newOrder.items,
          subtotal: newOrder.subtotal,
          tax: newOrder.tax,
          total: newOrder.total,
          status: newOrder.status,
          type: newOrder.type,
          customer: newOrder.customer
        })
    )
      .then(({ error: orderErr }) => {
        if (orderErr) {
          console.error("Supabase order insertion error:", orderErr);
          triggerToast("Saved locally, database insert failed", "warning");
        } else {
          triggerToast("Order placed & sent to kitchen", "success");
        }
      })
      .catch((e: any) => {
        console.error("Network error saving order:", e);
        triggerToast("Saved locally, offline mode active", "warning");
      });

    slideCacheWindow();
    setCart([]);
    setShowCustomerModal(false);
  };

  // Cart Functions
  const addToCart = (item: MenuItem) => {
    if (selectedInvoiceId) {
      const loadedOrder = orderHistory.find(o => o.id === selectedInvoiceId);
      const isEditable = loadedOrder && (loadedOrder.status === "Preparing" || loadedOrder.status === "Ready");
      if (!isEditable) {
        triggerToast("This settled order cannot be modified", "warning");
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
      const isEditable = loadedOrder && (loadedOrder.status === "Preparing" || loadedOrder.status === "Ready");
      if (!isEditable) {
        triggerToast("This settled order cannot be modified", "warning");
        return;
      }
    }
    setCart(prev => {
      const isEditingLoadedOrder = !!selectedInvoiceId;
      return prev.map(item => {
        if (item.menuItem.id === itemId && (!isEditingLoadedOrder || item.isNew === true)) {
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
      const isEditable = loadedOrder && (loadedOrder.status === "Preparing" || loadedOrder.status === "Ready");
      if (!isEditable) {
        triggerToast("This settled order cannot be modified", "warning");
        return;
      }
    }
    setCart(prev => {
      const isEditingLoadedOrder = !!selectedInvoiceId;
      return prev.filter(item => !(item.menuItem.id === itemId && (!isEditingLoadedOrder || item.isNew === true)));
    });
    triggerToast("Item removed from ticket", "info");
  };

  // Financial Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  const tax = 0;
  const total = subtotal;

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
    "Supplier Payments",
    "Utilities (Gas/Water/Electricity)",
    "Fuel & Transport",
    "Staff Meals & Expenses",
    "Repairs & Maintenance",
    "Cleaning & Shop Supplies",
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

  // Load shift tally when date changes
  useEffect(() => {
    try {
      const allTalliesStr = localStorage.getItem("t-cloud-eats-shift-tallies");
      if (allTalliesStr) {
        const allTallies = JSON.parse(allTalliesStr);
        const dayTally = allTallies[selectedLogBizDateStr];
        if (dayTally) {
          setOpeningBalance(dayTally.openingBalance ?? 0);
          setBankTransfer(dayTally.bankTransfer ?? 0);
          setActualCash(dayTally.actualCash ?? 0);
          setOperationalExpenses(dayTally.expenses ?? []);
          setTallySubmitted(dayTally.submitted ?? false);
          return;
        }
      }
    } catch (e) {
      console.error("Error loading shift tallies", e);
    }
    // Reset to defaults if no record exists
    setOpeningBalance(0);
    setBankTransfer(0);
    setActualCash(0);
    setOperationalExpenses([]);
    setTallySubmitted(false);
  }, [selectedLogBizDateStr]);

  // Helper to save shift tally
  const saveShiftTally = (
    op: number,
    bt: number,
    ac: number,
    expList: { id: string; category: string; description: string; amount: number }[],
    sub?: boolean
  ) => {
    try {
      const allTalliesStr = localStorage.getItem("t-cloud-eats-shift-tallies") || "{}";
      const allTallies = JSON.parse(allTalliesStr);
      const isSub = sub !== undefined ? sub : tallySubmitted;
      allTallies[selectedLogBizDateStr] = {
        openingBalance: op,
        bankTransfer: bt,
        actualCash: ac,
        expenses: expList,
        submitted: isSub,
      };
      localStorage.setItem("t-cloud-eats-shift-tallies", JSON.stringify(allTallies));
    } catch (e) {
      console.error("Error saving shift tally", e);
    }
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
    triggerToast("Closing balance tally submitted & locked!", "success");
  };

  const handleUnlockTally = () => {
    setTallySubmitted(false);
    saveShiftTally(openingBalance, bankTransfer, actualCash, operationalExpenses, false);
    triggerToast("Tally unlocked for editing", "info");
  };

  const reportData = useMemo(() => {
    const groups: Record<string, { dateStr: string; orderCount: number; revenue: number }> = {};
    
    orderHistory.forEach(order => {
      // Exclude voided/ignored orders from metrics
      if (order.status === "Voided" || order.status === "Ignored") return;
      
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
  }, [orderHistory]);

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

  // Sidebar access check
  const handleSidebarClick = (view: "new_order" | "order_history" | "menu_management" | "reports" | "settings") => {
    if (view === "menu_management") {
      if (isAdminUnlocked) {
        setActiveSidebar("menu_management");
      } else {
        setPinPurpose("menu");
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
            if (pinPurpose === "menu") {
              setActiveSidebar("menu_management");
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
                alt="t-cloud eats logo" 
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
                { key: "reports",         icon: <BarChart3 size={19} />,   label: "Reports" },
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
                {activeSidebar === "reports" && "Kitchen Reports"}
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

              {/* Connection Status Indicator */}
              <div 
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold tracking-wider uppercase transition-all duration-300 ${
                  isOnline 
                    ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-400" 
                    : "bg-red-500/5 border-red-500/10 text-red-400"
                }`}
                title={isOnline ? "System Online" : "System Offline - Offline Mode Active"}
              >
                {isOnline ? (
                  <>
                    <Wifi size={12} className="animate-pulse" />
                    <span className="hidden sm:inline">Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff size={12} className="animate-bounce" />
                    <span className="hidden sm:inline">Offline</span>
                  </>
                )}
              </div>

              {/* Refresh */}
              <button
                onClick={async () => {
                  if (isDatabaseSyncing) return;
                  setIsDatabaseSyncing(true);
                  // Reset cache time to force cache override
                  localStorage.setItem("t-cloud-eats-cache-time", Date.now().toString());
                  try {
                    await loadOrdersAndCMS();
                    triggerToast("POS synced with Database successfully", "success");
                  } catch (err) {
                    console.error("Sync error:", err);
                    triggerToast("Sync failed. Check connection.", "error");
                  } finally {
                    setIsDatabaseSyncing(false);
                  }
                }}
                disabled={isDatabaseSyncing}
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
                style={{ background: "#0E1628", border: "1px solid #1E2D4E", color: "#4B5E82" }}
                title="Force Sync with Cloud Database"
              >
                <RotateCw size={14} className={isDatabaseSyncing || loadingOrders ? "animate-spin text-amber-500" : "hover:text-slate-200 transition-colors"} />
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
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer relative"
                  style={{ 
                    background: "#0E1628", 
                    border: "1px solid #1E2D4E", 
                    color: showNotifications ? "#F26F21" : "#4B5E82" 
                  }}
                  title="Notifications"
                >
                  <Bell size={14} className={unreadCount > 0 ? "animate-pulse text-amber-400" : ""} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-[8px] font-bold text-white rounded-full flex items-center justify-center border border-[#060B18]">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                    <div className="absolute right-0 mt-2 w-80 bg-[#111625]/95 border border-[#222E4E] rounded-xl shadow-2xl p-4 space-y-3 z-50 backdrop-blur-md">
                      <div className="flex items-center justify-between pb-2 border-b border-[#222E4E]">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">Live Kitchen Alerts</span>
                        <button 
                          onClick={() => {
                            setNotificationsList(prev => prev.map(n => ({ ...n, read: true })));
                            setUnreadCount(0);
                          }}
                          className="text-[9px] font-bold text-[#F26F21] hover:underline"
                        >
                          Mark all read
                        </button>
                      </div>
                      <div className="max-h-60 overflow-y-auto space-y-2" style={{ scrollbarWidth: "none" }}>
                        {notificationsList.length === 0 ? (
                          <div className="text-center py-6 text-[10px] text-slate-500">No recent notifications.</div>
                        ) : (
                          notificationsList.map(n => (
                            <div key={n.id} className={`p-2 rounded-lg text-[10px] space-y-1 transition-colors ${n.read ? "bg-white/[0.02] text-slate-400" : "bg-white/[0.05] text-slate-200 border-l-2 border-[#F26F21]"}`}>
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
                    {category === "Pasta" && <span>🍝</span>}
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
                {/* Sales Summary */}
                <div className="bg-[#111625] border border-[#222E4E] rounded-2xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <TrendingUp size={14} className="text-[#FF6B35]" />
                      Shift Sales (2 PM - 2 AM)
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Select Date:</span>
                      <input
                        type="date"
                        value={selectedLogDate}
                        onChange={(e) => setSelectedLogDate(e.target.value)}
                        className="bg-[#090D1A] border border-[#222E4E] rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-[#FF6B35] cursor-pointer font-mono"
                        style={{ colorScheme: "dark" }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-[#090D1A] p-4 rounded-xl border border-[#222E4E]">
                      <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Shift Orders</p>
                      <p className="text-lg font-black mt-1 text-slate-200">{todaysOrders.length}</p>
                    </div>
                    <div className="bg-[#090D1A] p-4 rounded-xl border border-[#222E4E]">
                      <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Shift Revenue</p>
                      <div className="mt-1">
                        {renderAdminMetric(
                          `LKR ${todaysOrders.reduce((sum, o) => sum + o.total, 0).toLocaleString()}`,
                          "text-lg font-black text-emerald-400 font-mono"
                        )}
                      </div>
                    </div>
                    <div className="bg-[#090D1A] p-4 rounded-xl border border-[#222E4E]">
                      <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Avg Ticket Size</p>
                      <div className="mt-1">
                        {renderAdminMetric(
                          `LKR ${todaysOrders.length > 0 ? Math.round(todaysOrders.reduce((sum, o) => sum + o.total, 0) / todaysOrders.length).toLocaleString() : "0"}`,
                          "text-lg font-black text-slate-200 font-mono"
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Today's Orders list */}
                <div className="bg-[#111625] border border-[#222E4E] rounded-2xl p-5 space-y-4">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300">
                    Shift Orders List
                  </h3>
                  
                  {loadingOrders ? (
                    <div className="text-center py-10 text-xs text-slate-500 flex flex-col items-center justify-center gap-3">
                      <RotateCw className="animate-spin text-amber-500" size={24} />
                      <span>Loading shift orders...</span>
                    </div>
                  ) : todaysAllOrders.length === 0 ? (
                    <div className="text-center py-10 text-xs text-slate-500">
                      No invoices settled during today's shift yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#222E4E] text-[9px] text-slate-400 font-bold uppercase tracking-wider bg-[#090D1A]">
                            <th className="px-4 py-3">Invoice No</th>
                            <th className="px-4 py-3">Time Placed</th>
                            <th className="px-4 py-3">Customer</th>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Items</th>
                            <th className="px-4 py-3">Total Amount</th>
                            <th className="px-4 py-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#222E4E] text-xs">
                          {todaysAllOrders.map(order => {
                            const badge = getStatusBadgeStyle(order.status);
                            return (
                              <tr key={order.id} className="hover:bg-white/[0.01] transition-colors">
                                <td className="px-4 py-3 font-mono font-black text-orange-400">
                                  {order.status === "Ignored" || order.id.startsWith("IGNORED-") ? (
                                    <span className="text-slate-500 font-semibold italic">-</span>
                                  ) : (
                                    order.id
                                  )}
                                </td>
                                <td className="px-4 py-3 text-slate-300">
                                  {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="px-4 py-3 text-left">
                                  {order.customer ? (
                                    <div className="flex flex-col">
                                      <span className="font-bold text-slate-200">
                                        {(() => {
                                          const c = customers.find(x => x.phone === order.customer?.phone);
                                          return c ? c.name : order.customer?.name;
                                        })()}
                                      </span>
                                      <span className="text-[9px] text-slate-500 font-mono">{order.customer.phone}</span>
                                    </div>
                                  ) : (
                                    <span className="text-slate-500 italic">No customer details</span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                                    style={{
                                      background: (order.type === "Take Away" || order.type === "POS") ? "rgba(245,158,11,0.12)" : (order.type === "Pick Up" || order.type === "3rd Party") ? "rgba(168,85,247,0.12)" : "rgba(59,130,246,0.12)",
                                      color: (order.type === "Take Away" || order.type === "POS") ? "#F59E0B" : (order.type === "Pick Up" || order.type === "3rd Party") ? "#A855F7" : "#3B82F6",
                                    }}
                                  >
                                    {order.type}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border"
                                    style={{
                                      background: badge.bg,
                                      color: badge.text,
                                      borderColor: badge.border
                                    }}
                                  >
                                    {order.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-slate-400 relative">
                                  {(() => {
                                    const isToday = selectedLogBizDateStr === currentBizDate;
                                    if (isToday) {
                                      return (
                                        <div className="space-y-1 text-[10px] text-slate-300 max-w-[220px]">
                                          {order.items.map((item, idx) => {
                                            const itemTitle = item.menuItem ? item.menuItem.title : (item as any).title;
                                            const itemPrice = item.menuItem ? item.menuItem.price : (item as any).price;
                                            const itemQty = item.quantity;
                                            const itemTotal = (itemPrice || 0) * itemQty;
                                            return (
                                              <div key={idx} className="flex justify-between gap-4 border-b border-white/[0.03] pb-0.5 last:border-b-0">
                                                <span className="truncate" title={itemTitle}>{itemTitle} x{itemQty}</span>
                                                <span className="font-mono text-slate-400 whitespace-nowrap">Rs {itemTotal.toLocaleString()}</span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      );
                                    } else {
                                      if (isAdminUnlocked) {
                                        return (
                                          <div className="group relative inline-block cursor-pointer">
                                            <span className="underline decoration-dotted hover:text-slate-200 transition-colors">
                                              {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                                            </span>
                                            {/* Hover Preview Tooltip */}
                                            <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2.5 hidden group-hover:flex flex-col z-50 bg-[#0E1628] border border-[#1A2640] rounded-xl p-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)] min-w-[220px] pointer-events-none transition-all">
                                              <p className="text-[8px] font-black uppercase text-[#F26F21] mb-2 tracking-widest border-b border-[#1A2640] pb-1.5">Items Preview</p>
                                              <div className="space-y-1.5 max-h-[160px] overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                                                {order.items.map((item, idx) => {
                                                  const itemTitle = item.menuItem ? item.menuItem.title : (item as any).title;
                                                  const itemQty = item.quantity;
                                                  return (
                                                    <div key={idx} className="text-[10px] text-slate-300">
                                                      <div className="flex justify-between items-start gap-3">
                                                        <span className="font-bold flex-1 leading-tight text-left">{itemTitle}</span>
                                                        <span className="font-mono text-[#F26F21] whitespace-nowrap">x{itemQty}</span>
                                                      </div>
                                                      {item.comment && (
                                                        <p className="text-[9px] text-amber-400/80 mt-0.5 italic pl-1">💬 {item.comment}</p>
                                                      )}
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      } else {
                                        return (
                                          <span className="text-slate-500 italic flex items-center gap-1">
                                            <Lock size={10} /> Locked
                                          </span>
                                        );
                                      }
                                    }
                                  })()}
                                </td>
                                <td className="px-4 py-3 font-bold text-[#FF6B35]">
                                  {(() => {
                                    const isToday = selectedLogBizDateStr === currentBizDate;
                                    if (isToday || isAdminUnlocked) {
                                      return (
                                        <span className="font-mono">
                                          LKR {order.total.toLocaleString()}
                                        </span>
                                      );
                                    } else {
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
                                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800/40 hover:bg-slate-700/60 transition-colors cursor-pointer border border-[#222E4E]/40 font-mono text-[10px] text-slate-500"
                                          title="Click to enter PIN to unlock amount"
                                        >
                                          <span>••••</span>
                                          <EyeOff size={10} />
                                        </button>
                                      );
                                    }
                                  })()}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex gap-1.5 justify-end">
                                    <button
                                      onClick={() => {
                                        setSelectedInvoiceId(order.id);
                                        triggerToast(`Loaded ${order.id}`, "info");
                                      }}
                                      className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-[#F26F21] hover:text-white transition-all cursor-pointer border border-[#F26F21]/30 active:scale-95"
                                    >
                                      Load
                                    </button>
                                    {order.status !== "Voided" && order.status !== "Ignored" && (
                                      <>
                                        <button
                                          onClick={() => updateOrderStatus(order.id, "Voided")}
                                          className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all cursor-pointer border border-red-500/20 active:scale-95"
                                        >
                                          Void
                                        </button>
                                        {(() => {
                                          const orderAgeMs = Date.now() - new Date(order.timestamp).getTime();
                                          const canIgnore = orderAgeMs <= 3 * 60 * 1000;
                                          if (!canIgnore) return null;
                                          return (
                                            <button
                                              onClick={() => updateOrderStatus(order.id, "Ignored")}
                                              className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg border border-slate-600 bg-[#25324D] text-slate-400 hover:bg-slate-700 hover:text-white active:scale-95 cursor-pointer transition-all"
                                              title="Ignore order"
                                            >
                                              Ignore
                                            </button>
                                          );
                                        })()}
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
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



                </div>
              </div>
            )}

            {activeSidebar === "reports" && (
              <div className="space-y-6 overflow-y-auto pb-12 pr-1 max-h-full" style={{ scrollbarWidth: "thin" }}>
                
                {/* Reports Header & Recommendations Alert */}
                <div className="bg-[#111625] border border-[#222E4E] rounded-2xl p-5 space-y-3">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <BarChart3 size={15} className="text-[#FF6B35]" />
                    Cloud Kitchen Business Reports
                  </h3>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Based on your cloud kitchen model, we track key operational indicators. 
                    Below are suggested analytics reports generated dynamically from your POS transaction history:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2 pt-1.5">
                    <div className="bg-[#090D1A] p-3 rounded-lg border border-[#1A2640] text-[9px] text-slate-400 space-y-1">
                      <p className="font-bold text-[#FF6B35] uppercase">📈 Everyday Sales Report</p>
                      <p>Tracks shift-by-shift daily sales revenue, average order value, and volume.</p>
                    </div>
                    <div className="bg-[#090D1A] p-3 rounded-lg border border-[#1A2640] text-[9px] text-slate-400 space-y-1">
                      <p className="font-bold text-purple-400 uppercase">🛵 Logistics &amp; Dispatch</p>
                      <p>Compares pickup platforms (Uber/PickMe) against direct T-Cloud Eats deliveries.</p>
                    </div>
                    <div className="bg-[#090D1A] p-3 rounded-lg border border-[#1A2640] text-[9px] text-slate-400 space-y-1">
                      <p className="font-bold text-blue-400 uppercase">🍲 Popular Dishes Report</p>
                      <p>Identifies high-velocity items to optimize ingredients inventory and preparation.</p>
                    </div>
                    <div className="bg-[#090D1A] p-3 rounded-lg border border-[#1A2640] text-[9px] text-slate-400 space-y-1">
                      <p className="font-bold text-red-400 uppercase">🛡️ Loss Prevention Report</p>
                      <p>Monitors voided or ignored orders to verify transaction compliance and cashier integrity.</p>
                    </div>
                  </div>
                </div>

                {/* Closing Balance Tally Section */}
                <div className="bg-[#111625] border border-[#222E4E] rounded-2xl p-5 space-y-6 relative overflow-hidden">
                  {tallySubmitted && (
                    <div className="absolute top-0 right-0 left-0 bg-[#10B981]/15 border-b border-[#10B981]/30 py-2 px-5 flex items-center justify-between z-10">
                      <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        Tally Sheet Submitted & Locked
                      </span>
                      <button
                        onClick={handleUnlockTally}
                        className="text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded px-2.5 py-1 cursor-pointer transition-colors"
                      >
                        Unlock to Edit
                      </button>
                    </div>
                  )}

                  <div className={`flex items-center justify-between border-b border-[#222E4E] pb-3 ${tallySubmitted ? "pt-8" : ""}`}>
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <ShoppingBag size={14} className="text-[#FF6B35]" />
                      Closing Balance Tally
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Select Date:</span>
                      <input
                        type="date"
                        value={selectedLogDate}
                        onChange={(e) => setSelectedLogDate(e.target.value)}
                        className="bg-[#090D1A] border border-[#222E4E] rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-[#FF6B35] cursor-pointer font-mono"
                        style={{ colorScheme: "dark" }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Inputs Column */}
                    <div className="space-y-4 lg:col-span-2">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tally Inputs</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] text-slate-500 uppercase font-black tracking-wider block">Opening Balance (Float)</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 font-mono">LKR</span>
                            <input
                              type="number"
                              disabled={tallySubmitted}
                              value={openingBalance || ""}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setOpeningBalance(val);
                                saveShiftTally(val, bankTransfer, actualCash, operationalExpenses);
                              }}
                              placeholder="0.00"
                              className="w-full bg-[#090D1A] border border-[#222E4E] rounded-xl pl-10 pr-3 py-2 text-xs text-white outline-none focus:border-[#FF6B35] font-mono disabled:opacity-40 disabled:cursor-not-allowed"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] text-slate-500 uppercase font-black tracking-wider block">Bank Transfer (Actual)</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 font-mono">LKR</span>
                            <input
                              type="number"
                              disabled={tallySubmitted}
                              value={bankTransfer || ""}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setBankTransfer(val);
                                saveShiftTally(openingBalance, val, actualCash, operationalExpenses);
                              }}
                              placeholder="0.00"
                              className="w-full bg-[#090D1A] border border-[#222E4E] rounded-xl pl-10 pr-3 py-2 text-xs text-white outline-none focus:border-[#FF6B35] font-mono disabled:opacity-40 disabled:cursor-not-allowed"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] text-slate-500 uppercase font-black tracking-wider block">Actual Cash Counted</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 font-mono">LKR</span>
                            <input
                              type="number"
                              disabled={tallySubmitted}
                              value={actualCash || ""}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setActualCash(val);
                                saveShiftTally(openingBalance, bankTransfer, val, operationalExpenses);
                              }}
                              placeholder="0.00"
                              className="w-full bg-[#090D1A] border border-[#222E4E] rounded-xl pl-10 pr-3 py-2 text-xs text-white outline-none focus:border-[#FF6B35] font-mono disabled:opacity-40 disabled:cursor-not-allowed"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Operational Expenses Sub-Section */}
                      <div className="bg-[#090D1A] border border-[#222E4E] rounded-xl p-4 space-y-4">
                        <div className="flex items-center justify-between border-b border-[#14203A] pb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Operational Expenses (Shopping / Payouts)</span>
                          <span className="text-xs font-black text-rose-400 font-mono">
                            - LKR {operationalExpenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                          </span>
                        </div>

                        {/* List of current expenses */}
                        {operationalExpenses.length === 0 ? (
                          <p className="text-[10px] text-slate-600 italic">No operational expenses logged for this shift.</p>
                        ) : (
                          <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                            {operationalExpenses.map(exp => (
                              <div key={exp.id} className="flex items-center justify-between bg-[#111625] border border-[#1E2D4E] rounded-lg px-3 py-2 text-xs">
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-[10px] text-[#FF6B35] font-black uppercase tracking-wider">{exp.category}</span>
                                  {exp.description && <span className="text-slate-300 font-medium">{exp.description}</span>}
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="font-mono text-rose-400 font-bold">LKR {exp.amount.toLocaleString()}</span>
                                  <button
                                    disabled={tallySubmitted}
                                    onClick={() => handleRemoveExpense(exp.id)}
                                    className="text-slate-500 hover:text-rose-400 disabled:opacity-30 disabled:hover:text-slate-500 transition-colors p-1 cursor-pointer disabled:cursor-not-allowed animate-none"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add Expense Form */}
                        <form onSubmit={handleAddExpense} className="flex flex-col sm:flex-row gap-2">
                          {/* Category select dropdown */}
                          <select
                            disabled={tallySubmitted}
                            value={newExpenseCategory}
                            onChange={(e) => setNewExpenseCategory(e.target.value)}
                            className="bg-[#111625] border border-[#222E4E] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FF6B35] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-sans font-bold"
                          >
                            {EXPENSE_CATEGORIES.map(cat => (
                              <option key={cat} value={cat} className="bg-[#111625]">
                                {cat}
                              </option>
                            ))}
                          </select>

                          {/* Custom Description (Optional) */}
                          <input
                            type="text"
                            disabled={tallySubmitted}
                            placeholder="Optional Details (e.g. Shop name, bill #)"
                            value={newExpenseDesc}
                            onChange={(e) => setNewExpenseDesc(e.target.value)}
                            className="flex-1 bg-[#111625] border border-[#222E4E] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FF6B35] disabled:opacity-40 disabled:cursor-not-allowed"
                          />

                          {/* Amount */}
                          <div className="relative w-full sm:w-32">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-600 font-mono">LKR</span>
                            <input
                              type="number"
                              disabled={tallySubmitted}
                              placeholder="Amount"
                              value={newExpenseAmt}
                              onChange={(e) => setNewExpenseAmt(e.target.value)}
                              className="w-full bg-[#111625] border border-[#222E4E] rounded-xl pl-10 pr-3 py-2 text-xs text-white outline-none focus:border-[#FF6B35] font-mono disabled:opacity-40 disabled:cursor-not-allowed"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={tallySubmitted}
                            className="bg-[#FF6B35] hover:bg-[#F26F21] disabled:bg-[#1E2D4E] disabled:text-[#4B5E82] text-white p-2 rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed flex items-center justify-center shrink-0"
                          >
                            <Plus size={16} />
                          </button>
                        </form>
                      </div>
                    </div>

                    {/* Formula & Tally Summary Column */}
                    <div className="bg-[#090D1A] border border-[#222E4E] rounded-xl p-4 flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-[#14203A] pb-2">Tally Calculations</h4>
                        
                        {(() => {
                          const shiftRevenue = todaysOrders.reduce((sum, o) => sum + o.total, 0);
                          const totalExp = operationalExpenses.reduce((sum, e) => sum + e.amount, 0);
                          // Expected closing cash = Opening Balance + (Shift Revenue - Bank Transfer) - Operational Costs
                          const expectedCashRevenue = Math.max(0, shiftRevenue - bankTransfer);
                          const expectedClosingCash = openingBalance + expectedCashRevenue - totalExp;
                          const discrepancy = actualCash - expectedClosingCash;
                          const totalClosingBalance = actualCash + bankTransfer;

                          return (
                            <div className="space-y-2 text-[11px] text-slate-400 font-mono">
                              <div className="flex justify-between">
                                <span>Opening Balance:</span>
                                <span className="text-slate-300">+ LKR {openingBalance.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between" title="Calculated as (Shift Revenue - Bank Transfer)">
                                <span className="flex items-center gap-1">
                                  Expected Cash Rev:
                                </span>
                                <span className="text-slate-300">+ LKR {expectedCashRevenue.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Operational Costs:</span>
                                <span className="text-rose-400">- LKR {totalExp.toLocaleString()}</span>
                              </div>
                              
                              <div className="border-t border-dashed border-[#222E4E] pt-2 flex justify-between font-bold text-slate-200">
                                <span>Expected Closing Cash:</span>
                                <span>LKR {expectedClosingCash.toLocaleString()}</span>
                              </div>

                              <div className="flex justify-between">
                                <span>Actual Cash Counted:</span>
                                <span className="text-slate-200">LKR {actualCash.toLocaleString()}</span>
                              </div>

                              <div className="border-t border-[#222E4E] pt-2 space-y-1.5 font-sans">
                                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-black block">Tally Status</span>
                                {discrepancy === 0 ? (
                                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg p-2 text-center text-xs font-bold">
                                    Perfect Tally (Balanced)
                                  </div>
                                ) : discrepancy > 0 ? (
                                  <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg p-2 text-center text-xs font-bold">
                                    Overage: +LKR {discrepancy.toLocaleString()}
                                  </div>
                                ) : (
                                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg p-2 text-center text-xs font-bold">
                                    Shortage: -LKR {Math.abs(discrepancy).toLocaleString()}
                                  </div>
                                )}
                              </div>

                              <div className="bg-[#111625] border border-[#1E2D4E] rounded-lg p-3 space-y-1 font-sans mt-2">
                                <span className="text-[8px] uppercase tracking-wider text-slate-500 font-black block">Total Shift Assets (Cash + Bank)</span>
                                <span className="text-sm font-black text-slate-100 font-mono">
                                  LKR {totalClosingBalance.toLocaleString()}
                                </span>
                              </div>

                              {!tallySubmitted && (
                                <button
                                  onClick={handleSubmitTally}
                                  className="w-full font-black py-2.5 px-4 mt-2 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-[10px] cursor-pointer bg-[#10B981] hover:bg-[#059669] text-white uppercase tracking-widest active:scale-95 font-sans shadow-lg shadow-emerald-500/10"
                                >
                                  Submit & Lock Tally
                                </button>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Metrics Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[#111625] border border-[#222E4E] p-4 rounded-xl">
                    <p className="text-[9px] text-slate-500 uppercase font-black tracking-wider">Total Sales Revenue</p>
                    <div className="mt-1">
                      {renderAdminMetric(
                        `LKR ${orderHistory.filter(o => o.status !== "Voided" && o.status !== "Ignored").reduce((sum, o) => sum + o.total, 0).toLocaleString()}`,
                        "text-lg font-black text-emerald-400 font-mono"
                      )}
                    </div>
                  </div>
                  <div className="bg-[#111625] border border-[#222E4E] p-4 rounded-xl">
                    <p className="text-[9px] text-slate-500 uppercase font-black tracking-wider">Settled Orders</p>
                    <p className="text-lg font-black mt-1 text-slate-200">
                      {orderHistory.filter(o => o.status !== "Voided" && o.status !== "Ignored").length}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setCmsSearchQuery("");
                      setShowCMSModal(true);
                    }}
                    className="bg-[#111625] border border-[#222E4E] p-4 rounded-xl text-left hover:border-purple-500/50 hover:bg-[#151C30] cursor-pointer transition-all duration-200 group active:scale-98"
                  >
                    <div className="flex justify-between items-start">
                      <p className="text-[9px] text-slate-500 uppercase font-black tracking-wider group-hover:text-purple-400 transition-colors">CMS Customers</p>
                      <span className="text-[8px] text-[#A855F7] font-black uppercase tracking-wider bg-[#A855F7]/10 px-1.5 py-0.5 rounded border border-[#A855F7]/25 opacity-0 group-hover:opacity-100 transition-opacity">View directory</span>
                    </div>
                    <p className="text-lg font-black mt-1 text-purple-400 font-mono">
                      {customers.length} Profiles
                    </p>
                  </button>
                  <div className="bg-[#111625] border border-[#222E4E] p-4 rounded-xl">
                    <p className="text-[9px] text-slate-500 uppercase font-black tracking-wider">Average Order Value</p>
                    <div className="mt-1">
                      {renderAdminMetric(
                        `LKR ${(() => {
                          const settled = orderHistory.filter(o => o.status !== "Voided" && o.status !== "Ignored");
                          if (settled.length === 0) return "0";
                          const totalRev = settled.reduce((sum, o) => sum + o.total, 0);
                          return Math.round(totalRev / settled.length).toLocaleString();
                        })()}`,
                        "text-lg font-black text-slate-200 font-mono"
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Everyday Sales Table */}
                  <div className="lg:col-span-2 bg-[#111625] border border-[#222E4E] rounded-2xl p-5 space-y-4">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300">
                      Everyday Sales &amp; Shift Logs
                    </h3>
                    {reportData.length === 0 ? (
                      <div className="text-center py-12 text-xs text-slate-500">
                        No transaction data available yet.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-[#222E4E] text-[9px] text-slate-400 font-bold uppercase tracking-wider bg-[#090D1A]">
                              <th className="px-4 py-3">Business Date</th>
                              <th className="px-4 py-3">Orders Count</th>
                              <th className="px-4 py-3">Gross Revenue</th>
                              <th className="px-4 py-3">Avg Order Value</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#222E4E] text-xs">
                            {reportData.map(row => (
                              <tr key={row.dateStr} className="hover:bg-white/[0.01] transition-colors">
                                <td className="px-4 py-3 font-mono font-bold text-slate-300">{row.dateStr}</td>
                                <td className="px-4 py-3 font-bold text-slate-400">{row.orderCount} orders</td>
                                <td className="px-4 py-3 font-bold text-[#FF6B35] font-mono">
                                  {renderAdminMetric(
                                    `LKR ${row.revenue.toLocaleString()}`,
                                    "font-bold text-[#FF6B35] font-mono"
                                  )}
                                </td>
                                <td className="px-4 py-3 text-slate-300 font-mono">
                                  {renderAdminMetric(
                                    `LKR ${Math.round(row.revenue / row.orderCount).toLocaleString()}`,
                                    "text-slate-300 font-mono"
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Visual Charts & Analytics Suggestions */}
                  <div className="space-y-6">
                    {/* Order Type Distribution Card */}
                    <div className="bg-[#111625] border border-[#222E4E] rounded-2xl p-5 space-y-4">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300">Logistics Breakdown</h4>
                      {(() => {
                        const settled = orderHistory.filter(o => o.status !== "Voided" && o.status !== "Ignored");
                        const totalO = settled.length || 1;
                        const posOrders = settled.filter(o => o.type === "Take Away" || o.type === "POS").length;
                        const thirdParty = settled.filter(o => o.type === "Pick Up" || o.type === "3rd Party").length;
                        const directOrders = settled.filter(o => o.type === "Delivery" || o.type === "Direct").length;

                        const pctPOS = Math.round((posOrders / totalO) * 100);
                        const pct3P = Math.round((thirdParty / totalO) * 100);
                        const pctDir = Math.round((directOrders / totalO) * 100);

                        return (
                          <div className="space-y-3.5">
                            {/* POS Orders */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] font-bold">
                                <span className="text-amber-400">POS Orders</span>
                                <span className="text-slate-300">{posOrders} ({pctPOS}%)</span>
                              </div>
                              <div className="w-full bg-[#090D1A] h-2 rounded-full overflow-hidden border border-[#1A2640]">
                                <div className="bg-amber-400 h-full rounded-full transition-all duration-500" style={{ width: `${pctPOS}%` }} />
                              </div>
                            </div>
                            {/* Direct Orders */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] font-bold">
                                <span className="text-blue-400">Direct Orders (Website)</span>
                                <span className="text-slate-300">{directOrders} ({pctDir}%)</span>
                              </div>
                              <div className="w-full bg-[#090D1A] h-2 rounded-full overflow-hidden border border-[#1A2640]">
                                <div className="bg-blue-400 h-full rounded-full transition-all duration-500" style={{ width: `${pctDir}%` }} />
                              </div>
                            </div>
                            {/* 3rd Party */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] font-bold">
                                <span className="text-purple-400">3rd Party (Uber / PickMe)</span>
                                <span className="text-slate-300">{thirdParty} ({pct3P}%)</span>
                              </div>
                              <div className="w-full bg-[#090D1A] h-2 rounded-full overflow-hidden border border-[#1A2640]">
                                <div className="bg-purple-400 h-full rounded-full transition-all duration-500" style={{ width: `${pct3P}%` }} />
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Top Selling Items Card */}
                    <div className="bg-[#111625] border border-[#222E4E] rounded-2xl p-5 space-y-4">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300">Top Selling Dishes</h4>
                      {(() => {
                        const counts: Record<string, number> = {};
                        orderHistory
                          .filter(o => o.status !== "Voided" && o.status !== "Ignored")
                          .forEach(order => {
                            order.items.forEach(item => {
                              const title = item.menuItem ? item.menuItem.title : (item as any).title;
                              counts[title] = (counts[title] || 0) + item.quantity;
                            });
                          });

                        const sorted = Object.entries(counts)
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 4);

                        const maxQty = sorted[0]?.[1] || 1;

                        if (sorted.length === 0) {
                          return <div className="text-[10px] text-slate-500 py-3 text-center">No sales items logged yet.</div>;
                        }

                        return (
                          <div className="space-y-3">
                            {sorted.map(([title, qty], index) => {
                              const pct = Math.round((qty / maxQty) * 100);
                              return (
                                <div key={title} className="space-y-1">
                                  <div className="flex justify-between text-[10px]">
                                    <span className="font-semibold text-slate-300 truncate max-w-[150px]">{index + 1}. {title}</span>
                                    <span className="font-mono text-slate-500 font-bold">{qty} sold</span>
                                  </div>
                                  <div className="w-full bg-[#090D1A] h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-[#FF6B35] h-full rounded-full" style={{ width: `${pct}%` }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Loss Prevention Audit Card */}
                    <div className="bg-[#111625] border border-[#222E4E] rounded-2xl p-5 space-y-3">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300">Loss &amp; Integrity Audit</h4>
                      {(() => {
                        const totalOrders = orderHistory.length || 1;
                        const voided = orderHistory.filter(o => o.status === "Voided").length;
                        const ignored = orderHistory.filter(o => o.status === "Ignored").length;
                        const voidRate = Math.round((voided / totalOrders) * 100);

                        return (
                          <div className="space-y-2.5 text-[10px]">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Total Voided Orders:</span>
                              <span className="font-black text-red-400 font-mono">{voided}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Total Test (Ignored) Orders:</span>
                              <span className="font-black text-slate-400 font-mono">{ignored}</span>
                            </div>
                            <div className="flex justify-between border-t border-[#1A2640] pt-2">
                              <span className="text-slate-300 font-bold">Void Leakage Rate:</span>
                              <span className={`font-black font-mono ${voidRate > 10 ? "text-red-400" : "text-emerald-400"}`}>{voidRate}%</span>
                            </div>
                            <p className="text-[8px] text-slate-500 italic mt-1 leading-normal">
                              Note: A leakage rate above 10% is flagged for manager audit reviews.
                            </p>
                          </div>
                        );
                      })()}
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
            <div className="px-4 py-3.5 flex flex-col gap-2.5 shrink-0" style={{ borderBottom: "1px solid #14203A" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={15} style={{ color: "#F26F21" }} />
                  <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: "#CBD5E1" }}>Active Ticket</span>
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
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold bg-[#090D1A] p-2 rounded-lg border border-[#1A2640]">
                <span>INVOICE NO:</span>
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
                  className="font-mono text-[#F26F21] font-black bg-transparent outline-none cursor-pointer border-none p-0 focus:ring-0 text-[10px] text-right"
                  style={{ direction: "rtl" }}
                >
                  <option value="active" style={{ background: "#080E1C", color: "#F26F21", direction: "ltr" }}>
                    New Order ({getNextInvoiceNumber(orderHistory)})
                  </option>
                  {todaysOrders.map(order => (
                    <option key={order.id} value={order.id} style={{ background: "#080E1C", color: "#94A3B8", direction: "ltr" }}>
                      {order.id}
                    </option>
                  ))}
                </select>
              </div>

              {/* High-Attention Segmented Tab Bar (Hidden when viewing settled invoice) */}
              {!selectedInvoiceId ? (
                <div className="flex bg-[#0E1628] p-1 rounded-xl border border-[#1E2D4E] w-full">
                  <button
                    type="button"
                    onClick={() => setOrderType("POS")}
                    className={`flex-1 text-[9px] font-black uppercase tracking-widest py-2 rounded-lg transition-all cursor-pointer text-center ${
                      orderType === "POS" 
                        ? "bg-[#F26F21] text-white shadow-lg shadow-orange-500/20" 
                        : "text-[#4B5E82] hover:text-slate-300"
                    }`}
                  >
                    POS
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType("Direct")}
                    className={`flex-1 text-[9px] font-black uppercase tracking-widest py-2 rounded-lg transition-all cursor-pointer text-center ${
                      orderType === "Direct" 
                        ? "bg-[#3B82F6] text-white shadow-lg shadow-blue-500/20" 
                        : "text-[#4B5E82] hover:text-slate-300"
                    }`}
                  >
                    Direct
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType("3rd Party")}
                    className={`flex-1 text-[9px] font-black uppercase tracking-widest py-2 rounded-lg transition-all cursor-pointer text-center ${
                      orderType === "3rd Party" 
                        ? "bg-[#8B5CF6] text-white shadow-lg shadow-purple-500/20" 
                        : "text-[#4B5E82] hover:text-slate-300"
                    }`}
                    title="3rd Party Delivery (Uber Eats & PickMe Food)"
                  >
                    3rd Party
                  </button>
                </div>
              ) : (
                <div className="text-[9px] font-bold text-center uppercase tracking-wider text-slate-500">
                  Fulfillment: <span style={{
                    color: (selectedOrderType === "Take Away" || selectedOrderType === "POS") ? "#F59E0B" : (selectedOrderType === "Pick Up" || selectedOrderType === "3rd Party") ? "#A855F7" : "#3B82F6"
                  }}>{selectedOrderType} ({
                    (selectedOrderType === "Take Away" || selectedOrderType === "POS") ? "POS" : (selectedOrderType === "Pick Up" || selectedOrderType === "3rd Party") ? "3rd Party" : "Direct"
                  })</span>
                </div>
              )}
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {displayedItems.map((item) => {
                const isItemEditable = !selectedInvoiceId || item.isNew === true;
                return (
                  <div
                    key={`${item.menuItem.id}-${item.isNew ? "new" : "old"}`}
                    className="rounded-xl p-3 flex gap-2 items-start"
                    style={{ background: "#0E1628", border: "1px solid #1A2640" }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-semibold text-[11px] leading-snug" style={{ color: "#CBD5E1" }}>{item.menuItem ? item.menuItem.title : (item as any).title}</h4>
                        {selectedInvoiceId && item.isNew && (
                          <span className="text-[7px] font-black uppercase bg-emerald-500/10 text-emerald-400 px-1 py-0.5 rounded border border-emerald-500/25">New</span>
                        )}
                      </div>
                      {/* Comment display */}
                      {item.comment && commentEditingItemId !== item.menuItem.id && (
                        <p className="text-[9px] mt-0.5 italic" style={{ color: "#FBBF24" }}>💬 {item.comment}</p>
                      )}
                      {/* Inline comment editor */}
                      {commentEditingItemId === item.menuItem.id && (
                        <div className="flex items-center gap-1 mt-1">
                          <input
                            autoFocus
                            type="text"
                            placeholder="e.g. Black Pork, Extra Spicy..."
                            defaultValue={item.comment || ""}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const val = (e.target as HTMLInputElement).value.trim();
                                setCart(prev => prev.map(ci => ci.menuItem.id === item.menuItem.id && ci.isNew === item.isNew ? { ...ci, comment: val || undefined } : ci));
                                setCommentEditingItemId(null);
                              } else if (e.key === "Escape") {
                                setCommentEditingItemId(null);
                              }
                            }}
                            onBlur={(e) => {
                              const val = e.target.value.trim();
                              setCart(prev => prev.map(ci => ci.menuItem.id === item.menuItem.id && ci.isNew === item.isNew ? { ...ci, comment: val || undefined } : ci));
                              setCommentEditingItemId(null);
                            }}
                            className="flex-1 text-[9px] px-2 py-1 rounded-lg border outline-none"
                            style={{ background: "#0A101F", borderColor: "#FBBF24", color: "#FBBF24" }}
                          />
                        </div>
                      )}
                      <p className="text-[10px] mt-0.5 font-mono" style={{ color: "#4B5E82" }}>
                        {item.quantity} × Rs {(item.menuItem ? item.menuItem.price : (item as any).price || 0).toLocaleString()}
                      </p>
                      <p className="text-[10px] font-bold font-mono mt-0.5" style={{ color: "#F26F21" }}>
                        Rs {(item.quantity * (item.menuItem ? item.menuItem.price : (item as any).price || 0)).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <div className="flex items-center gap-1">
                        {isItemEditable && (
                          <button
                            onClick={() => setCommentEditingItemId(commentEditingItemId === item.menuItem.id ? null : item.menuItem.id)}
                            className="cursor-pointer p-0.5 rounded transition-colors"
                            style={{ color: item.comment ? "#FBBF24" : "#2A3A5A" }}
                            title="Add comment"
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
                        <span className="text-[9px] font-mono font-black text-slate-600 bg-slate-950/40 px-1.5 py-0.5 rounded">QTY: {item.quantity}</span>
                      ) : (
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
                      )}
                    </div>
                  </div>
                );
              })}

              {displayedItems.length === 0 && (
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
                  <span className="text-[11px] font-black uppercase tracking-wider" style={{ color: "#F2F4F8" }}>Total</span>
                  <span className="text-xl font-black font-mono" style={{ color: "#F26F21" }}>Rs {displayedTotal.toLocaleString()}</span>
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
                      className="font-black p-3 rounded-xl transition-all duration-200 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 active:scale-95"
                      title="Reprint Receipt"
                    >
                      <Printer size={13} />
                    </button>
                    <button
                      onClick={() => setSelectedInvoiceId(null)}
                      className="font-black p-3 rounded-xl transition-all duration-200 flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 active:scale-95"
                      title="Close Ticket"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handlePlaceOrderClick}
                  disabled={cart.length === 0}
                  className="w-full font-black py-3.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-[11px] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-widest active:scale-95"
                  style={{
                    background: cart.length === 0 ? "#0E1628" : "linear-gradient(135deg, #F26F21, #FF6B35)",
                    color: cart.length === 0 ? "#2A3A5A" : "white",
                    boxShadow: cart.length > 0 ? "0 4px 24px rgba(242,111,33,0.3)" : "none",
                  }}
                >
                  <Check size={14} />
                  <span>Place Order</span>
                </button>
              )}
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
              <h3 className="font-black text-sm">t-cloud eats</h3>
              <p className="text-[10px] text-slate-500">Order: {latestOrder.id}</p>
              <div className="mt-1.5 px-2 py-0.5 rounded text-[8px] font-bold tracking-wider inline-block"
                style={{
                  background: (latestOrder.type === "Take Away" || latestOrder.type === "POS") ? "rgba(245,158,11,0.1)" : (latestOrder.type === "Pick Up" || latestOrder.type === "3rd Party") ? "rgba(168,85,247,0.1)" : "rgba(59,130,246,0.1)",
                  color: (latestOrder.type === "Take Away" || latestOrder.type === "POS") ? "#D97706" : (latestOrder.type === "Pick Up" || latestOrder.type === "3rd Party") ? "#7C3AED" : "#2563EB",
                  border: `1px solid ${(latestOrder.type === "Take Away" || latestOrder.type === "POS") ? "rgba(245,158,11,0.2)" : (latestOrder.type === "Pick Up" || latestOrder.type === "3rd Party") ? "rgba(168,85,247,0.2)" : "rgba(59,130,246,0.2)"}`
                }}
              >
                {latestOrder.type.toUpperCase()} — {
                  (latestOrder.type === "Take Away" || latestOrder.type === "POS") 
                    ? "POS ORDER" 
                    : (latestOrder.type === "Pick Up" || latestOrder.type === "3rd Party") 
                      ? "3RD PARTY (UBER & PICK ME)" 
                      : "DIRECT ORDER (WEBSITE)"
                }
              </div>
              <p className="text-[8px] font-bold text-orange-600 uppercase mt-1">Status: {latestOrder.status}</p>
            </div>
            
            {latestOrder.customer && (
              <div className="border-b border-dashed border-slate-300 pb-3 text-[9px] space-y-0.5 text-slate-700 text-left">
                <p className="font-bold uppercase tracking-wider text-slate-900">Customer Profile:</p>
                <p>
                  <span className="font-semibold text-slate-600">Name:</span>{" "}
                  {(() => {
                    const c = customers.find(x => x.phone === latestOrder.customer?.phone);
                    return c ? c.name : latestOrder.customer?.name;
                  })()}
                </p>
                <p><span className="font-semibold text-slate-600">Phone:</span> {latestOrder.customer.phone}</p>
                {latestOrder.customer.address && (
                  <p className="line-clamp-2"><span className="font-semibold text-slate-600">Address:</span> {latestOrder.customer.address}</p>
                )}
              </div>
            )}

            <div className="space-y-2 border-b border-dashed border-slate-300 pb-3">
              {latestOrder.items.map((item, idx) => {
                const itemId = item.menuItem ? item.menuItem.id : (item as any).id;
                const itemTitle = item.menuItem ? item.menuItem.title : (item as any).title;
                const itemPrice = item.menuItem ? item.menuItem.price : (item as any).price;
                return (
                  <div key={`${itemId}-${idx}`}>
                    <div className="flex justify-between">
                      <span>{itemTitle} x{item.quantity}</span>
                      <span>Rs {((itemPrice || 0) * item.quantity).toLocaleString()}</span>
                    </div>
                    {item.comment && (
                      <p className="text-[8px] text-amber-600 italic ml-2">💬 {item.comment}</p>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between font-black text-sm">
              <span>Total Amount</span>
              <span>Rs {latestOrder.total.toLocaleString()}</span>
            </div>

            {/* E-Bill URL Block */}
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2 text-left">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Customer Digital E-Bill Link:</span>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={getBillUrl(latestOrder.id)}
                  className="bg-white border border-slate-200 text-[9px] px-2 py-1.5 rounded-lg flex-1 font-mono text-slate-600 truncate focus:outline-none"
                />
                 <button
                  onClick={() => {
                    navigator.clipboard.writeText(getBillUrl(latestOrder.id));
                    triggerToast("E-Bill URL copied!", "success");
                  }}
                  className="bg-[#FF6B35]/10 text-[#FF6B35] font-bold px-2 py-1.5 rounded-lg text-[9px] hover:bg-[#FF6B35]/20 transition-all cursor-pointer whitespace-nowrap active:scale-95"
                >
                  Copy
                </button>
                <button
                  onClick={() => {
                    router.push(`/bills/${latestOrder.id}${getBillHash(latestOrder.id)}`);
                  }}
                  className="bg-slate-200 text-slate-700 font-bold px-2 py-1.5 rounded-lg text-[9px] hover:bg-slate-300 transition-all text-center cursor-pointer active:scale-95"
                >
                  Open
                </button>
                {(() => {
                  const currentCustomer = customers.find(x => x.phone === latestOrder.customer?.phone);
                  const customerName = currentCustomer ? currentCustomer.name : latestOrder.customer?.name || "Customer";
                  const messageText = `Hi ${customerName},\n\nThank you for your order! We are preparing it now and hope you enjoy your meal.\n\nYou can view your bill and track your order status here:\n${getBillUrl(latestOrder.id)}\n\nHave a great day!\n\nBest regards,\nthe t-cloud eats Team`;
                  return (
                    <a
                      href={`https://wa.me/${latestOrder.customer?.phone?.replace(/\D/g, "")}?text=${encodeURIComponent(messageText)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 font-bold px-2 py-1.5 rounded-lg text-[9px] hover:text-emerald-400 transition-all text-center cursor-pointer active:scale-95 whitespace-nowrap"
                      title="Send via WhatsApp"
                    >
                      WhatsApp
                    </a>
                  );
                })()}
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button onClick={confirmAndPrintInvoice} className="w-full bg-[#00A86B] text-white font-bold py-3 rounded-xl cursor-pointer flex items-center justify-center gap-2 uppercase tracking-widest text-[10px]">
                <Printer size={13} />
                Print Invoice
              </button>
              <button onClick={() => setShowReceiptModal(false)} className="w-full bg-slate-100 text-slate-600 py-2 rounded-xl cursor-pointer uppercase tracking-widest text-[10px]">
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Details Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-[#050814]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111625] border border-[#222E4E] rounded-3xl p-6 max-w-md w-full space-y-6 shadow-2xl relative" style={{ boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
            <button
              onClick={() => setShowCustomerModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="text-center space-y-1.5">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-100">Customer Details</h3>
              <p className="text-[10px] text-slate-500">Search customer by phone or create new profile</p>
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
                    className="bg-[#090D1A] border border-[#222E4E] rounded-xl px-3 py-2.5 text-xs text-white outline-none cursor-pointer focus:border-[#FF6B35]/60"
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
                    className="flex-1 bg-[#090D1A] border border-[#222E4E] rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#FF6B35]/60"
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
                  className="w-full bg-[#090D1A] border border-[#222E4E] rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#FF6B35]/60"
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
                      <div className="absolute left-0 right-0 top-full mt-1 bg-[#111625] border border-[#222E4E] rounded-xl overflow-hidden shadow-2xl z-50 divide-y divide-[#1A2640] max-h-[180px] overflow-y-auto" style={{ scrollbarWidth: "none" }}>
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
                            <span className="text-[9px] text-slate-400 truncate w-full">{c.address}</span>
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
                        className={`flex items-center gap-1.5 text-[9px] font-extrabold px-3 py-1 rounded-full border transition-all cursor-pointer ${
                          isSavedActive
                            ? "bg-[#FF6B35]/15 text-[#FF6B35] border-[#FF6B35]/30"
                            : "bg-[#090D1A] text-slate-400 border-[#222E4E] hover:border-slate-700 hover:text-slate-300"
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full border flex items-center justify-center ${
                          isSavedActive ? "border-[#FF6B35] bg-[#FF6B35]" : "border-slate-500"
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
                        className={`flex items-center gap-1.5 text-[9px] font-extrabold px-3 py-1 rounded-full border transition-all cursor-pointer ${
                          !isSavedActive
                            ? "bg-[#FF6B35]/15 text-[#FF6B35] border-[#FF6B35]/30"
                            : "bg-[#090D1A] text-slate-400 border-[#222E4E] hover:border-slate-700 hover:text-slate-300"
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full border flex items-center justify-center ${
                          !isSavedActive ? "border-[#FF6B35] bg-[#FF6B35]" : "border-slate-500"
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
                      className="w-full bg-[#090D1A] border border-[#222E4E] rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#FF6B35]/60"
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
                      className="w-full bg-[#090D1A] border border-[#222E4E] rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#FF6B35]/60"
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
                      className="w-full bg-[#090D1A] border border-[#222E4E] rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#FF6B35]/60 cursor-pointer"
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
                      className="w-full bg-[#090D1A]/50 border border-[#222E4E] rounded-xl px-3 py-2.5 text-xs text-slate-400 outline-none cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Combined Preview */}
                <div className="bg-[#050814]/40 border border-[#1A2640] p-2 rounded-xl text-[9px] text-slate-400 font-mono flex items-center justify-between">
                  <span className="text-[8px] text-slate-500 uppercase font-black tracking-wider">Preview:</span>
                  <span className="truncate flex-1 text-right pl-2 text-slate-300">{customerAddress || "(empty address)"}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={handleConfirmPlaceOrder}
                className="flex-1 bg-[#FF6B35] hover:bg-[#F26F21] text-white font-bold py-3 rounded-xl cursor-pointer text-xs uppercase tracking-wider"
              >
                Confirm &amp; Place Order
              </button>
              <button
                onClick={() => setShowCustomerModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-5 py-3 rounded-xl cursor-pointer text-xs uppercase tracking-wider border border-slate-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CMS Profiles Modal */}
      {showCMSModal && (
        <div className="fixed inset-0 bg-[#050814]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111625] border border-[#222E4E] rounded-3xl p-6 max-w-4xl w-full h-[80vh] flex flex-col shadow-2xl relative" style={{ boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
            <button
              onClick={() => {
                setShowCMSModal(false);
                setEditingCustomer(null);
              }}
              className="absolute top-4 right-4 text-slate-500 hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>

            {!editingCustomer ? (
              // Directory View
              <div className="flex flex-col h-full space-y-4 overflow-hidden">
                <div className="text-center shrink-0 space-y-1">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-100">Customer CMS Directory</h3>
                  <p className="text-[10px] text-slate-500">Manage and edit customer profiles and birthdays</p>
                </div>

                {/* Search Bar */}
                <div className="shrink-0">
                  <input
                    type="text"
                    placeholder="Search by name, phone or address..."
                    value={cmsSearchQuery}
                    onChange={(e) => setCmsSearchQuery(e.target.value)}
                    className="w-full bg-[#090D1A] border border-[#222E4E] rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-purple-500/60"
                  />
                </div>

                {/* Customer List in Compact Row Layout */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-1.5" style={{ scrollbarWidth: "thin" }}>
                  {customers
                    .filter(c => 
                      c.name.toLowerCase().includes(cmsSearchQuery.toLowerCase()) ||
                      c.phone.includes(cmsSearchQuery) ||
                      c.address.toLowerCase().includes(cmsSearchQuery.toLowerCase())
                    )
                    .map(c => (
                      <div key={c.phone} className="bg-[#0D1527] border border-[#1E2D4E] rounded-xl p-2.5 flex items-center justify-between gap-4 hover:border-purple-500/40 transition-all">
                        <div className="flex-1 min-w-0 flex items-center gap-4">
                          {/* Name & Phone */}
                          <div className="w-[180px] shrink-0 min-w-0">
                            <p className="font-extrabold text-[12px] text-white truncate" title={c.name}>{c.name}</p>
                            <p className="text-[9px] font-mono font-bold text-[#FF9F1C] mt-0.5">{c.phone}</p>
                          </div>
                          
                          {/* Birthday & Last Order */}
                          <div className="w-[170px] shrink-0 flex flex-col gap-1.5 justify-center">
                            {/* Birthday Row */}
                            <div>
                              {c.birthday ? (
                                <span className="text-[8px] font-black text-purple-200 bg-purple-900/50 border border-purple-500/30 px-2 py-0.5 rounded inline-flex items-center gap-1">
                                  🎂 {new Date(c.birthday).toLocaleString("en-US", {
                                    month: "short",
                                    day: "numeric"
                                  })}
                                </span>
                              ) : (
                                <span className="text-[9px] text-slate-400 font-semibold italic">No birthday set</span>
                              )}
                            </div>
                            
                            {/* Last Order Row with Hover Tooltip */}
                            {(() => {
                              const lastOrder = orderHistory.find(o => o.customer && o.customer.phone === c.phone && o.status !== "Ignored");
                              return (
                                <div className="relative group inline-block">
                                  {lastOrder ? (
                                    <>
                                      <span className="text-[8px] font-black text-orange-200 bg-[#342211] border border-orange-500/30 px-2 py-0.5 rounded inline-flex items-center gap-1 cursor-pointer">
                                        🛒 {new Date(lastOrder.timestamp).toLocaleDateString("en-US", {
                                          month: "short",
                                          day: "numeric",
                                          year: "numeric"
                                        })}
                                      </span>
                                      
                                      {/* Hover Tooltip (Shown on Hover) */}
                                      <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover:flex flex-col z-50 bg-[#0E1628] border border-[#1E2D4E] rounded-xl p-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.5)] min-w-[200px] pointer-events-none transition-all text-left">
                                        <p className="text-[8px] font-black uppercase text-[#FF6B35] mb-1.5 border-b border-[#1E2D4E] pb-1 tracking-wider">Last Order Items</p>
                                        <div className="space-y-1 max-h-[140px] overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                                          {lastOrder.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-start gap-2 text-[10px] text-slate-300">
                                              <span className="font-bold flex-1 leading-tight">{item.menuItem ? item.menuItem.title : (item as any).title}</span>
                                              <span className="font-mono text-[#F26F21] whitespace-nowrap">x{item.quantity}</span>
                                            </div>
                                          ))}
                                        </div>
                                        <div className="mt-1.5 pt-1 border-t border-[#1E2D4E] flex justify-between text-[8px] text-slate-400 font-mono">
                                          <span>Total:</span>
                                          <span className="font-bold text-orange-400">Rs {lastOrder.total.toLocaleString()}</span>
                                        </div>
                                      </div>
                                    </>
                                  ) : (
                                    <span className="text-[9px] text-slate-500 font-semibold italic">Never ordered</span>
                                  )}
                                </div>
                              );
                            })()}
                          </div>

                          {/* Address */}
                          <div className="flex-1 min-w-0 flex items-center gap-2">
                            {c.address_label && (
                              <span className="text-[8px] font-black text-amber-200 bg-[#342211] border border-amber-500/30 px-2 py-0.5 rounded uppercase tracking-wider shrink-0">
                                🏠 {c.address_label}
                              </span>
                            )}
                            <p className="text-[11px] text-slate-200 font-medium truncate flex-1 pr-4" title={c.address}>
                              {c.address || "No address provided"}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setEditingCustomer(c);
                            setEditCustName(c.name);
                            setEditCustAddress(c.address);
                            const parsed = parseAddress(c.address);
                            setEditAddrHomeNo(parsed.homeNo);
                            setEditAddrStreet(parsed.street);
                            setEditAddrPostalArea(parsed.postalArea);
                            setEditAddrPostalCode(parsed.postalCode);
                            if (c.birthday) {
                              const bDate = new Date(c.birthday);
                              setEditCustBirthMonth(String(bDate.getMonth() + 1).padStart(2, "0"));
                              setEditCustBirthDay(String(bDate.getDate()).padStart(2, "0"));
                            } else {
                              setEditCustBirthMonth("");
                              setEditCustBirthDay("");
                            }
                            setEditCustAddressLabel(c.address_label || "");
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-black active:scale-95 transition-all text-[9px] uppercase tracking-wider cursor-pointer shrink-0 shadow-md"
                        >
                          Edit Profile
                        </button>
                      </div>
                    ))}
                </div>

                <div className="pt-2 shrink-0">
                  <button
                    onClick={() => setShowCMSModal(false)}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl cursor-pointer text-xs uppercase tracking-wider border border-slate-700"
                  >
                    Close Directory
                  </button>
                </div>
              </div>
            ) : (
              // Editing View
              <div className="flex flex-col h-full justify-between space-y-4">
                <div className="space-y-4">
                  <div className="text-center space-y-1">
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-100">Edit Customer Profile</h3>
                    <p className="text-[10px] text-slate-500">Updating details for {editingCustomer.phone}</p>
                  </div>

                  <div className="space-y-4">
                    {/* Name */}
                    <div className="space-y-1.5">
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Full Name</label>
                      <input
                        type="text"
                        value={editCustName}
                        onChange={(e) => setEditCustName(e.target.value)}
                        className="w-full bg-[#090D1A] border border-[#222E4E] rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-purple-500/60"
                      />
                    </div>

                    {/* Address (Structured) */}
                    <div className="space-y-2.5">
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Address</label>
                      
                      {/* Home No & Street Name */}
                      <div className="flex gap-2">
                        <div className="w-1/3">
                          <input
                            type="text"
                            placeholder="Home NO"
                            value={editAddrHomeNo}
                            onChange={(e) => setEditAddrHomeNo(e.target.value)}
                            className="w-full bg-[#090D1A] border border-[#222E4E] rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-purple-500/60"
                          />
                        </div>
                        <div className="w-2/3">
                          <input
                            type="text"
                            placeholder="Street Name"
                            value={editAddrStreet}
                            onChange={(e) => setEditAddrStreet(e.target.value)}
                            className="w-full bg-[#090D1A] border border-[#222E4E] rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-purple-500/60"
                          />
                        </div>
                      </div>

                      {/* Postal Area & Postal Code */}
                      <div className="flex gap-2">
                        <div className="w-2/3">
                          <select
                            value={editAddrPostalArea}
                            onChange={(e) => {
                              const area = e.target.value;
                              setEditAddrPostalArea(area);
                              setEditAddrPostalCode(POSTAL_CODES[area] || "");
                            }}
                            className="w-full bg-[#090D1A] border border-[#222E4E] rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-purple-500/60 cursor-pointer"
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
                            value={editAddrPostalCode}
                            readOnly
                            className="w-full bg-[#090D1A]/50 border border-[#222E4E] rounded-xl px-3 py-2.5 text-xs text-slate-400 outline-none cursor-not-allowed"
                          />
                        </div>
                      </div>

                      {/* Combined Preview */}
                      <div className="bg-[#050814]/40 border border-[#1A2640] p-2 rounded-xl text-[9px] text-slate-400 font-mono flex items-center justify-between">
                        <span className="text-[8px] text-slate-500 uppercase font-black tracking-wider">Preview:</span>
                        <span className="truncate flex-1 text-right pl-2 text-slate-300">{editCustAddress || "(empty address)"}</span>
                      </div>
                    </div>

                    {/* Birthday (Month & Day - No Year) */}
                    <div className="space-y-1.5">
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Birthday (Month &amp; Day)</label>
                      <div className="flex gap-2">
                        {/* Month Select */}
                        <div className="w-1/2">
                          <select
                            value={editCustBirthMonth}
                            onChange={(e) => setEditCustBirthMonth(e.target.value)}
                            className="w-full bg-[#090D1A] border border-[#222E4E] rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-purple-500/60 cursor-pointer"
                          >
                            <option value="">Month</option>
                            {MONTHS.map(m => (
                              <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                          </select>
                        </div>
                        {/* Day Select */}
                        <div className="w-1/2">
                          <select
                            value={editCustBirthDay}
                            onChange={(e) => setEditCustBirthDay(e.target.value)}
                            className="w-full bg-[#090D1A] border border-[#222E4E] rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-purple-500/60 cursor-pointer"
                          >
                            <option value="">Day</option>
                            {DAYS.map(d => (
                              <option key={d.value} value={d.value}>{d.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <p className="text-[8px] text-slate-500">Optional: Select the birth month and day (no year required).</p>
                    </div>

                    {/* Address Label (CMS Only) */}
                    <div className="space-y-1.5">
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Address Label</label>
                      <select
                        value={editCustAddressLabel}
                        onChange={(e) => setEditCustAddressLabel(e.target.value)}
                        className="w-full bg-[#090D1A] border border-[#222E4E] rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-purple-500/60 cursor-pointer"
                      >
                        <option value="">No Label</option>
                        <option value="Home">🏠 Home</option>
                        <option value="Office">💼 Office</option>
                        <option value="Work">🏢 Work</option>
                        <option value="Other">📍 Other</option>
                      </select>
                      <p className="text-[8px] text-slate-500">Label this address (e.g. Home, Office) to identify it in the directory.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    disabled={isUpdatingCust}
                    onClick={handleSaveCustomer}
                    className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 rounded-xl cursor-pointer text-xs uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isUpdatingCust ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    onClick={() => setEditingCustomer(null)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-5 py-3 rounded-xl cursor-pointer text-xs uppercase tracking-wider border border-slate-700"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
