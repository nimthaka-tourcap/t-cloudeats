"use client";

import React, { useState, useMemo } from "react";
import {
  DollarSign,
  TrendingUp,
  Percent,
  ChefHat,
  ClipboardList,
  Search,
  Plus,
  Trash2,
  Download,
  Printer,
  Share2,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowUpDown,
  Utensils,
  Layers,
  Sparkles,
  Sliders,
  ChevronRight,
  Filter,
  PackageCheck,
  ShoppingBag,
  ExternalLink
} from "lucide-react";
import {
  FoodCostItem,
  RecipeCosting,
  RecipeIngredient,
  MarketOrderItem,
  INITIAL_FOOD_COST_ITEMS,
  INITIAL_MARKET_ORDER_ITEMS,
  INITIAL_RECIPES,
  calculateRecipeTotals
} from "@/lib/data/food-costing-data";

interface FoodCostingModuleProps {
  onAddStockClick?: () => void;
}

export default function FoodCostingModule({ onAddStockClick }: FoodCostingModuleProps) {
  // Active Sub-Tab
  const [activeTab, setActiveTab] = useState<"matrix" | "recipe" | "market">("matrix");

  // --- 1. FOOD COST MATRIX STATES ---
  const [matrixSearch, setMatrixSearch] = useState("");
  const [matrixCategory, setMatrixCategory] = useState<string>("All");
  const [matrixPortion, setMatrixPortion] = useState<string>("All");
  const [matrixCostFilter, setMatrixCostFilter] = useState<"All" | "Low" | "Medium" | "High">("All");
  const [channelView, setChannelView] = useState<"comparison" | "inhouse" | "uber">("comparison");
  const [foodCostItems, setFoodCostItems] = useState<FoodCostItem[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("t-cloud-food-cost-matrix");
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return INITIAL_FOOD_COST_ITEMS;
  });

  // --- 2. RECIPE CALCULATOR STATES ---
  const [recipes, setRecipes] = useState<RecipeCosting[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("t-cloud-recipes");
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return INITIAL_RECIPES;
  });
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(INITIAL_RECIPES[0].id);
  const currentRecipe = useMemo(() => {
    return recipes.find(r => r.id === selectedRecipeId) || recipes[0];
  }, [recipes, selectedRecipeId]);

  // Live Recipe Editor States
  const [recSellingPrice, setRecSellingPrice] = useState<number>(currentRecipe?.sellingPrice || 1600);
  const [recUtilityPct, setRecUtilityPct] = useState<number>(currentRecipe?.utilityRatePct || 10);
  const [recPackagingCost, setRecPackagingCost] = useState<number>(currentRecipe?.packagingCost || 33);
  const [recIngredients, setRecIngredients] = useState<RecipeIngredient[]>(currentRecipe?.ingredients || []);
  const [newIngName, setNewIngName] = useState("");
  const [newIngUnit, setNewIngUnit] = useState("g");
  const [newIngQty, setNewIngQty] = useState("");
  const [newIngRate, setNewIngRate] = useState("");

  // Sync state when selected recipe changes
  React.useEffect(() => {
    if (currentRecipe) {
      setRecSellingPrice(currentRecipe.sellingPrice);
      setRecUtilityPct(currentRecipe.utilityRatePct);
      setRecPackagingCost(currentRecipe.packagingCost);
      setRecIngredients(currentRecipe.ingredients);
    }
  }, [selectedRecipeId]);

  // Calculated live totals for recipe
  const liveTotals = useMemo(() => {
    return calculateRecipeTotals(
      recSellingPrice,
      recIngredients,
      recUtilityPct,
      recPackagingCost,
      33, // Uber 33%
      22  // PickMe 22%
    );
  }, [recSellingPrice, recIngredients, recUtilityPct, recPackagingCost]);

  // --- 3. MARKET ORDER LIST STATES ---
  const [marketItems, setMarketItems] = useState<MarketOrderItem[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("t-cloud-market-order-list");
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return INITIAL_MARKET_ORDER_ITEMS;
  });
  const [marketDayFilter, setMarketDayFilter] = useState<"All" | "Mon" | "Wed" | "Fri">("All");
  const [marketCategoryFilter, setMarketCategoryFilter] = useState<string>("All");
  const [marketSearch, setMarketSearch] = useState("");

  // Toggle day checkbox
  const toggleMarketDay = (id: string, day: "Mon" | "Wed" | "Fri") => {
    setMarketItems(prev => {
      const updated = prev.map(item => {
        if (item.id === id) {
          if (day === "Mon") return { ...item, monChecked: !item.monChecked };
          if (day === "Wed") return { ...item, wedChecked: !item.wedChecked };
          if (day === "Fri") return { ...item, friChecked: !item.friChecked };
        }
        return item;
      });
      localStorage.setItem("t-cloud-market-order-list", JSON.stringify(updated));
      return updated;
    });
  };

  // Update market item qty
  const updateMarketQty = (id: string, qty: number) => {
    setMarketItems(prev => {
      const updated = prev.map(item => item.id === id ? { ...item, estimatedQty: qty } : item);
      localStorage.setItem("t-cloud-market-order-list", JSON.stringify(updated));
      return updated;
    });
  };

  // Add new Ingredient to current recipe
  const handleAddIngredient = () => {
    if (!newIngName || !newIngQty || !newIngRate) return;
    const qty = parseFloat(newIngQty) || 0;
    const rate = parseFloat(newIngRate) || 0;
    const cost = parseFloat((qty * rate).toFixed(2));
    const newIng: RecipeIngredient = {
      id: `ing-${Date.now()}`,
      name: newIngName.trim(),
      unit: newIngUnit,
      qty,
      unitRate: rate,
      cost
    };
    setRecIngredients(prev => [...prev, newIng]);
    setNewIngName("");
    setNewIngQty("");
    setNewIngRate("");
  };

  // Remove Ingredient
  const handleRemoveIngredient = (id: string) => {
    setRecIngredients(prev => prev.filter(ing => ing.id !== id));
  };

  // Filtered Food Cost Matrix
  const filteredMatrix = useMemo(() => {
    return foodCostItems.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(matrixSearch.toLowerCase()) ||
        item.category.toLowerCase().includes(matrixSearch.toLowerCase());
      const matchCat = matrixCategory === "All" || item.category === matrixCategory;
      const matchPortion = matrixPortion === "All" || item.portion === matrixPortion;
      
      let matchCost = true;
      if (matrixCostFilter === "Low") matchCost = item.foodCostPct < 35;
      else if (matrixCostFilter === "Medium") matchCost = item.foodCostPct >= 35 && item.foodCostPct <= 45;
      else if (matrixCostFilter === "High") matchCost = item.foodCostPct > 45;

      return matchSearch && matchCat && matchPortion && matchCost;
    });
  }, [foodCostItems, matrixSearch, matrixCategory, matrixPortion, matrixCostFilter]);

  // Overall KPI computations
  const matrixKPIs = useMemo(() => {
    const totalItems = foodCostItems.length;
    if (totalItems === 0) return { avgFoodCostPct: 0, avgInHouseProfitPct: 0, avgUberProfitPct: 0, highCostCount: 0 };
    
    const avgFoodCost = foodCostItems.reduce((sum, item) => sum + item.foodCostPct, 0) / totalItems;
    const avgInHouseProfit = foodCostItems.reduce((sum, item) => sum + item.inHouseNetProfitPct, 0) / totalItems;
    const avgUberProfit = foodCostItems.reduce((sum, item) => {
      const uberPct = item.sellingPrice > 0 ? (item.uberNetProfit / item.sellingPrice) * 100 : 0;
      return sum + uberPct;
    }, 0) / totalItems;
    const highCostCount = foodCostItems.filter(item => item.foodCostPct > 45).length;

    return {
      avgFoodCostPct: Number(avgFoodCost.toFixed(1)),
      avgInHouseProfitPct: Number(avgInHouseProfit.toFixed(1)),
      avgUberProfitPct: Number(avgUberProfit.toFixed(1)),
      highCostCount
    };
  }, [foodCostItems]);

  // Export Matrix to CSV
  const handleExportCSV = () => {
    const headers = [
      "ID,Dish Name,Category,Portion,Selling Price,Food Cost,Food Cost %,Total Cost,Total Cost %,In-House Profit,In-House Margin %,Uber 33% Cut,Uber Net Profit"
    ];
    const rows = foodCostItems.map(item => 
      `${item.id},"${item.name}",${item.category},${item.portion},${item.sellingPrice},${item.foodCost},${item.foodCostPct}%,${item.totalCost},${item.totalCostPct}%,${item.inHouseNetProfit},${item.inHouseNetProfitPct}%,${item.uber33Commission},${item.uberNetProfit}`
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `t-cloud-food-costing-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy Market List for WhatsApp
  const handleCopyMarketList = () => {
    let text = `🛒 *T-CLOUD EATS - MARKET PURCHASING LIST*\n📅 Date: ${new Date().toLocaleDateString()}\n----------------------------------------\n`;
    const groups: { [k: string]: MarketOrderItem[] } = {};
    marketItems.forEach(item => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });

    Object.entries(groups).forEach(([category, items]) => {
      text += `\n📁 *${category.toUpperCase()}*\n`;
      items.forEach(item => {
        const check = item.monChecked || item.wedChecked || item.friChecked ? "✅" : "⬜";
        text += `${check} ${item.name}: ~${item.estimatedQty || 0} ${item.unit}\n`;
      });
    });

    navigator.clipboard.writeText(text);
    alert("Market list copied to clipboard! You can now paste it into WhatsApp or notes.");
  };

  return (
    <div className="space-y-6 overflow-y-auto pb-12 pr-1 max-h-full" style={{ scrollbarWidth: "thin" }}>
      
      {/* Top Banner Navigation */}
      <div className="bg-[#111625] border border-[#222E4E] p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[#F26F21]/15 border border-[#F26F21]/30 flex items-center justify-center text-[#F26F21]">
            <Utensils size={18} />
          </div>
          <div>
            <h2 className="text-sm font-black text-white tracking-wide flex items-center gap-2">
              FOOD COSTING & RECIPE ANALYTICS
              <span className="bg-[#F26F21]/20 text-[#F26F21] text-[9px] px-2 py-0.5 rounded-full font-mono font-bold">
                PRO
              </span>
            </h2>
            <p className="text-[10px] text-slate-400 font-medium">
              Margin intelligence, Uber 33% profitability & commercial recipe breakdown
            </p>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center bg-[#090D1A] border border-[#222E4E] p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("matrix")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "matrix"
                ? "bg-[#F26F21] text-white shadow-lg shadow-[#F26F21]/25"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Percent size={13} />
            Menu Matrix ({foodCostItems.length})
          </button>
          
          <button
            onClick={() => setActiveTab("recipe")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "recipe"
                ? "bg-[#F26F21] text-white shadow-lg shadow-[#F26F21]/25"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <ChefHat size={13} />
            Recipe Costing
          </button>

          <button
            onClick={() => setActiveTab("market")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "market"
                ? "bg-[#F26F21] text-white shadow-lg shadow-[#F26F21]/25"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <ClipboardList size={13} />
            Market List ({marketItems.length})
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: FOOD COST MATRIX                                                   */}
      {/* ========================================================================= */}
      {activeTab === "matrix" && (
        <div className="space-y-6">
          {/* KPI Dashboard Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#111625] border border-[#222E4E] p-4 rounded-2xl flex flex-col gap-1">
              <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Avg Menu Food Cost %</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-white font-mono">{matrixKPIs.avgFoodCostPct}%</span>
                <span className="text-[10px] text-emerald-400 font-bold">Target: &lt;40%</span>
              </div>
              <span className="text-[9px] text-slate-500">Across all 34 menu items</span>
            </div>

            <div className="bg-[#111625] border border-[#222E4E] p-4 rounded-2xl flex flex-col gap-1">
              <span className="text-[9px] font-black uppercase text-emerald-500 tracking-wider">Avg In-House Margin</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-emerald-400 font-mono">+{matrixKPIs.avgInHouseProfitPct}%</span>
                <span className="text-[10px] text-slate-400 font-medium">Net Profit</span>
              </div>
              <span className="text-[9px] text-slate-500">Dine-in / Direct Delivery</span>
            </div>

            <div className="bg-[#111625] border border-[#222E4E] p-4 rounded-2xl flex flex-col gap-1">
              <span className="text-[9px] font-black uppercase text-amber-500 tracking-wider">Avg Uber Eats Margin</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-amber-400 font-mono">+{matrixKPIs.avgUberProfitPct}%</span>
                <span className="text-[10px] text-slate-400 font-medium">After 33% cut</span>
              </div>
              <span className="text-[9px] text-slate-500">Uber marketplace net</span>
            </div>

            <div className="bg-[#111625] border border-[#222E4E] p-4 rounded-2xl flex flex-col gap-1">
              <span className="text-[9px] font-black uppercase text-rose-500 tracking-wider">High Cost Watchlist</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-rose-400 font-mono">{matrixKPIs.highCostCount}</span>
                <span className="text-[10px] text-rose-400 font-bold">Food Cost &gt;45%</span>
              </div>
              <span className="text-[9px] text-slate-500">Requires recipe review</span>
            </div>
          </div>

          {/* Filter and Control Bar */}
          <div className="bg-[#111625] border border-[#222E4E] p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
                <input
                  type="text"
                  placeholder="Search dish name or category..."
                  value={matrixSearch}
                  onChange={(e) => setMatrixSearch(e.target.value)}
                  className="w-full bg-[#090D1A] border border-[#222E4E] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-[#F26F21]/60 transition-colors"
                />
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1.5 bg-[#090D1A] border border-[#222E4E] px-2.5 py-1.5 rounded-xl">
                <span className="text-[9px] font-black text-slate-500 uppercase">Cat:</span>
                <select
                  value={matrixCategory}
                  onChange={(e) => setMatrixCategory(e.target.value)}
                  className="bg-transparent text-xs text-slate-300 font-bold outline-none cursor-pointer border-none p-0 focus:ring-0"
                >
                  <option value="All" style={{ background: "#080E1C" }}>All Categories</option>
                  <option value="Rice" style={{ background: "#080E1C" }}>Fried Rice</option>
                  <option value="Kothu" style={{ background: "#080E1C" }}>Kothu</option>
                  <option value="Chop Suey" style={{ background: "#080E1C" }}>Chop Suey</option>
                </select>
              </div>

              {/* Portion Filter */}
              <div className="flex items-center gap-1.5 bg-[#090D1A] border border-[#222E4E] px-2.5 py-1.5 rounded-xl">
                <span className="text-[9px] font-black text-slate-500 uppercase">Size:</span>
                <select
                  value={matrixPortion}
                  onChange={(e) => setMatrixPortion(e.target.value)}
                  className="bg-transparent text-xs text-slate-300 font-bold outline-none cursor-pointer border-none p-0 focus:ring-0"
                >
                  <option value="All" style={{ background: "#080E1C" }}>All Sizes</option>
                  <option value="Medium" style={{ background: "#080E1C" }}>Medium (M)</option>
                  <option value="Large" style={{ background: "#080E1C" }}>Large (L)</option>
                </select>
              </div>

              {/* Cost Margin Filter */}
              <div className="flex items-center gap-1.5 bg-[#090D1A] border border-[#222E4E] px-2.5 py-1.5 rounded-xl">
                <span className="text-[9px] font-black text-slate-500 uppercase">Cost:</span>
                <select
                  value={matrixCostFilter}
                  onChange={(e) => setMatrixCostFilter(e.target.value as any)}
                  className="bg-transparent text-xs text-slate-300 font-bold outline-none cursor-pointer border-none p-0 focus:ring-0"
                >
                  <option value="All" style={{ background: "#080E1C" }}>All Margins</option>
                  <option value="Low" style={{ background: "#080E1C" }}>🟢 Low Cost (&lt;35%)</option>
                  <option value="Medium" style={{ background: "#080E1C" }}>🟡 Healthy (35-45%)</option>
                  <option value="High" style={{ background: "#080E1C" }}>🔴 Low Margin (&gt;45%)</option>
                </select>
              </div>
            </div>

            {/* Channel View Toggle & Export */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-[#090D1A] border border-[#222E4E] p-1 rounded-xl">
                <button
                  onClick={() => setChannelView("comparison")}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider transition-all cursor-pointer ${
                    channelView === "comparison" ? "bg-[#222E4E] text-white" : "text-slate-400"
                  }`}
                >
                  Side-by-Side
                </button>
                <button
                  onClick={() => setChannelView("inhouse")}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider transition-all cursor-pointer ${
                    channelView === "inhouse" ? "bg-[#222E4E] text-emerald-400" : "text-slate-400"
                  }`}
                >
                  In-House
                </button>
                <button
                  onClick={() => setChannelView("uber")}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider transition-all cursor-pointer ${
                    channelView === "uber" ? "bg-[#222E4E] text-[#F26F21]" : "text-slate-400"
                  }`}
                >
                  Uber (33%)
                </button>
              </div>

              <button
                onClick={handleExportCSV}
                className="bg-[#090D1A] hover:bg-[#14203A] text-slate-200 border border-[#222E4E] px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                title="Export to CSV"
              >
                <Download size={13} />
                Export
              </button>
            </div>
          </div>

          {/* Matrix Data Table */}
          <div className="bg-[#111625] border border-[#222E4E] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#222E4E] text-[10px] uppercase tracking-wider text-slate-400 font-black" style={{ background: "#0B1122" }}>
                    <th className="py-3.5 px-4 w-12 text-center">#</th>
                    <th className="py-3.5 px-4">Menu Dish</th>
                    <th className="py-3.5 px-4 text-center">Size</th>
                    <th className="py-3.5 px-4 text-right">Selling Price</th>
                    <th className="py-3.5 px-4 text-right">Food Cost</th>
                    <th className="py-3.5 px-4 text-center">Food Cost %</th>
                    <th className="py-3.5 px-4 text-right">Total Cost</th>
                    {(channelView === "comparison" || channelView === "inhouse") && (
                      <>
                        <th className="py-3.5 px-4 text-right text-emerald-400">In-House Profit</th>
                        <th className="py-3.5 px-4 text-center text-emerald-400">Margin %</th>
                      </>
                    )}
                    {(channelView === "comparison" || channelView === "uber") && (
                      <>
                        <th className="py-3.5 px-4 text-right text-amber-400">Uber 33% Cut</th>
                        <th className="py-3.5 px-4 text-right text-amber-400">Uber Net</th>
                      </>
                    )}
                    <th className="py-3.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222E4E]">
                  {filteredMatrix.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-500 font-bold">
                        No dishes match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredMatrix.map(item => {
                      // Cost badge color
                      let costBadge = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                      if (item.foodCostPct > 45) {
                        costBadge = "bg-rose-500/10 text-rose-400 border-rose-500/20";
                      } else if (item.foodCostPct >= 35) {
                        costBadge = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                      }

                      return (
                        <tr key={item.id} className="hover:bg-[#1A233D]/40 transition-colors group">
                          <td className="py-3 px-4 text-center font-mono text-[10px] text-slate-500">
                            {item.id}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-white leading-normal">{item.name}</span>
                              <span className="text-[10px] text-slate-400">{item.category}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                              item.portion === "Large"
                                ? "bg-purple-500/15 text-purple-300 border border-purple-500/30"
                                : "bg-blue-500/15 text-blue-300 border border-blue-500/30"
                            }`}>
                              {item.portion}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-white">
                            Rs {item.sellingPrice.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-300">
                            Rs {item.foodCost.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black border ${costBadge}`}>
                              {item.foodCostPct}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-400">
                            Rs {item.totalCost.toLocaleString()}
                          </td>

                          {(channelView === "comparison" || channelView === "inhouse") && (
                            <>
                              <td className="py-3 px-4 text-right font-mono font-black text-emerald-400">
                                Rs {item.inHouseNetProfit.toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-center font-mono font-bold text-emerald-400/90">
                                {item.inHouseNetProfitPct}%
                              </td>
                            </>
                          )}

                          {(channelView === "comparison" || channelView === "uber") && (
                            <>
                              <td className="py-3 px-4 text-right font-mono text-amber-500/80">
                                -Rs {item.uber33Commission.toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-black text-amber-400">
                                Rs {item.uberNetProfit.toLocaleString()}
                              </td>
                            </>
                          )}

                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => {
                                setRecSellingPrice(item.sellingPrice);
                                setActiveTab("recipe");
                              }}
                              className="text-xs bg-[#090D1A] hover:bg-[#F26F21] text-slate-300 hover:text-white border border-[#222E4E] hover:border-[#F26F21] px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer"
                              title="Calculate and inspect recipe breakdown"
                            >
                              Recipe &rarr;
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: RECIPE COSTING & LIVE MARGIN SIMULATOR                             */}
      {/* ========================================================================= */}
      {activeTab === "recipe" && (
        <div className="space-y-6">
          
          {/* Recipe Selector & Actions Bar */}
          <div className="bg-[#111625] border border-[#222E4E] p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Select Recipe:</span>
              <select
                value={selectedRecipeId}
                onChange={(e) => setSelectedRecipeId(e.target.value)}
                className="bg-[#090D1A] text-white font-bold text-xs border border-[#222E4E] rounded-xl px-3 py-2 outline-none cursor-pointer focus:border-[#F26F21]"
              >
                {recipes.map(rec => (
                  <option key={rec.id} value={rec.id} style={{ background: "#080E1C" }}>
                    {rec.dishName} ({rec.portion}) — Rs {rec.sellingPrice}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 bg-[#090D1A] px-3 py-1.5 rounded-xl border border-[#222E4E]">
                Standard Template: <strong className="text-white">Excel Costing Formula</strong>
              </span>
            </div>
          </div>

          {/* 2-Column Grid: Recipe Builder (Left) & Channel Margin Simulator (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Ingredients & Recipe Breakdown */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-[#111625] border border-[#222E4E] rounded-2xl p-5 shadow-xl space-y-5">
                <div className="flex items-center justify-between border-b border-[#222E4E] pb-3">
                  <div>
                    <h3 className="text-sm font-black text-white">{currentRecipe?.dishName || "Custom Recipe"}</h3>
                    <p className="text-[10px] text-slate-400">Raw ingredient weights, portion unit rates, and subtotal food cost</p>
                  </div>
                  <span className="bg-[#F26F21]/20 text-[#F26F21] text-xs px-2.5 py-1 rounded-lg font-bold font-mono">
                    Portion: {currentRecipe?.portion || "Medium"}
                  </span>
                </div>

                {/* Ingredients Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#222E4E] text-[10px] uppercase tracking-wider text-slate-400 font-black">
                        <th className="py-2.5 px-2">Ingredient</th>
                        <th className="py-2.5 px-2 text-center">Qty / Portion</th>
                        <th className="py-2.5 px-2 text-right">Unit Rate</th>
                        <th className="py-2.5 px-2 text-right">Cost (Rs)</th>
                        <th className="py-2.5 px-2 text-center w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1A2640]">
                      {recIngredients.map(ing => (
                        <tr key={ing.id} className="hover:bg-[#14203A]/30 transition-colors">
                          <td className="py-2 px-2 font-bold text-white">{ing.name}</td>
                          <td className="py-2 px-2 text-center font-mono text-slate-300">
                            {ing.qty} {ing.unit}
                          </td>
                          <td className="py-2 px-2 text-right font-mono text-slate-400">
                            Rs {ing.unitRate}
                          </td>
                          <td className="py-2 px-2 text-right font-mono font-black text-emerald-400">
                            Rs {ing.cost.toLocaleString()}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              onClick={() => handleRemoveIngredient(ing.id)}
                              className="text-slate-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                              title="Delete ingredient"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Add New Ingredient Inputs */}
                <div className="bg-[#090D1A] border border-[#222E4E] p-3 rounded-xl space-y-3">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Add Ingredient to Recipe
                  </span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <input
                      type="text"
                      placeholder="Ingredient Name"
                      value={newIngName}
                      onChange={(e) => setNewIngName(e.target.value)}
                      className="bg-[#111625] border border-[#222E4E] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#F26F21]"
                    />
                    <div className="flex gap-1">
                      <input
                        type="number"
                        placeholder="Qty"
                        value={newIngQty}
                        onChange={(e) => setNewIngQty(e.target.value)}
                        className="w-full bg-[#111625] border border-[#222E4E] rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-[#F26F21]"
                      />
                      <select
                        value={newIngUnit}
                        onChange={(e) => setNewIngUnit(e.target.value)}
                        className="bg-[#111625] border border-[#222E4E] rounded-lg px-1 text-[10px] text-slate-300 outline-none"
                      >
                        <option value="g">g</option>
                        <option value="kg">kg</option>
                        <option value="ml">ml</option>
                        <option value="L">L</option>
                        <option value="portion">portion</option>
                        <option value="slice">slice</option>
                        <option value="pc">pc</option>
                      </select>
                    </div>
                    <input
                      type="number"
                      placeholder="Rate / Unit"
                      value={newIngRate}
                      onChange={(e) => setNewIngRate(e.target.value)}
                      className="bg-[#111625] border border-[#222E4E] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#F26F21]"
                    />
                    <button
                      onClick={handleAddIngredient}
                      className="bg-[#F26F21] hover:bg-[#F26F21]/90 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Plus size={13} />
                      Add
                    </button>
                  </div>
                </div>

                {/* Overheads & Utility Sliders */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#222E4E]">
                  <div className="bg-[#090D1A] border border-[#222E4E] p-3 rounded-xl flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-bold">Utility & Prep Cost %</span>
                      <span className="text-amber-400 font-mono font-black">{recUtilityPct}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="1"
                      value={recUtilityPct}
                      onChange={(e) => setRecUtilityPct(Number(e.target.value))}
                      className="w-full accent-[#F26F21] cursor-pointer"
                    />
                    <span className="text-[9px] text-slate-500">Adds Rs {liveTotals.utilityCost} for gas, power & staff</span>
                  </div>

                  <div className="bg-[#090D1A] border border-[#222E4E] p-3 rounded-xl flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-bold">Packaging Cost</span>
                      <span className="text-white font-mono font-black">Rs {recPackagingCost}</span>
                    </div>
                    <input
                      type="number"
                      value={recPackagingCost}
                      onChange={(e) => setRecPackagingCost(Number(e.target.value) || 0)}
                      className="bg-[#111625] border border-[#222E4E] rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-[#F26F21]"
                    />
                    <span className="text-[9px] text-slate-500">Box, sauce cup, foil & carry bag</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Live Margin Simulator & Channel Comparison */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Selling Price Simulator Slider */}
              <div className="bg-[#111625] border border-[#222E4E] rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
                    Selling Price Simulator
                  </span>
                  <div className="bg-[#090D1A] border border-[#222E4E] px-3 py-1 rounded-xl">
                    <span className="text-lg font-black text-[#F26F21] font-mono">
                      Rs {recSellingPrice.toLocaleString()}
                    </span>
                  </div>
                </div>

                <input
                  type="range"
                  min="500"
                  max="3500"
                  step="50"
                  value={recSellingPrice}
                  onChange={(e) => setRecSellingPrice(Number(e.target.value))}
                  className="w-full accent-[#F26F21] cursor-pointer"
                />

                {/* Production Cost Breakdown List */}
                <div className="bg-[#090D1A] border border-[#222E4E] p-3.5 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Raw Food Cost:</span>
                    <span className="font-mono font-bold text-white">Rs {liveTotals.foodCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Utility & Prep ({recUtilityPct}%):</span>
                    <span className="font-mono text-slate-300">+Rs {liveTotals.utilityCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Packaging:</span>
                    <span className="font-mono text-slate-300">+Rs {recPackagingCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-[#222E4E] pt-2 font-black text-white">
                    <span>Total Production Cost:</span>
                    <span className="font-mono text-rose-400">Rs {liveTotals.totalCost.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* 3 Channel Profit Cards */}
              <div className="space-y-3">
                {/* 1. In-House / Dine-In */}
                <div className="bg-[#0E1B24] border border-emerald-500/30 p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">
                      Dine-In / Direct Takeaway (0% Cut)
                    </span>
                    <h4 className="text-lg font-black text-white font-mono mt-0.5">
                      +Rs {liveTotals.inHouseProfit.toLocaleString()}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                      {liveTotals.inHouseMarginPct}% Margin
                    </span>
                  </div>
                </div>

                {/* 2. PickMe (22% Commission) */}
                <div className="bg-[#141A29] border border-blue-500/30 p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider">
                      PickMe Food (22% Comm: -Rs {liveTotals.pickmeCommissionAmount})
                    </span>
                    <h4 className="text-lg font-black text-white font-mono mt-0.5">
                      +Rs {liveTotals.pickmeNetProfit.toLocaleString()}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-black text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
                      {liveTotals.pickmeMarginPct}% Margin
                    </span>
                  </div>
                </div>

                {/* 3. Uber Eats (33% Commission) */}
                <div className="bg-[#1C1414] border border-[#F26F21]/40 p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black text-[#F26F21] uppercase tracking-wider">
                      Uber Eats (33% Comm: -Rs {liveTotals.uberCommissionAmount})
                    </span>
                    <h4 className="text-lg font-black text-white font-mono mt-0.5">
                      +Rs {liveTotals.uberNetProfit.toLocaleString()}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-mono font-black px-2.5 py-1 rounded-lg border ${
                      liveTotals.uberNetProfit > 0
                        ? "text-[#F26F21] bg-[#F26F21]/10 border-[#F26F21]/30"
                        : "text-rose-400 bg-rose-500/10 border-rose-500/30"
                    }`}>
                      {liveTotals.uberMarginPct}% Margin
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MARKET ORDER LIST & PURCHASING SCHEDULE                            */}
      {/* ========================================================================= */}
      {activeTab === "market" && (
        <div className="space-y-6">
          {/* Header Controls */}
          <div className="bg-[#111625] border border-[#222E4E] p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
                <input
                  type="text"
                  placeholder="Search market item..."
                  value={marketSearch}
                  onChange={(e) => setMarketSearch(e.target.value)}
                  className="w-full bg-[#090D1A] border border-[#222E4E] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-[#F26F21]/60 transition-colors"
                />
              </div>

              {/* Day Filter */}
              <div className="flex items-center bg-[#090D1A] border border-[#222E4E] p-1 rounded-xl">
                {(["All", "Mon", "Wed", "Fri"] as const).map(day => (
                  <button
                    key={day}
                    onClick={() => setMarketDayFilter(day)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      marketDayFilter === day
                        ? "bg-[#F26F21] text-white shadow-md shadow-[#F26F21]/30"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {day === "All" ? "All Days" : `${day} Run`}
                  </button>
                ))}
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1.5 bg-[#090D1A] border border-[#222E4E] px-2.5 py-1.5 rounded-xl">
                <span className="text-[9px] font-black text-slate-500 uppercase">Category:</span>
                <select
                  value={marketCategoryFilter}
                  onChange={(e) => setMarketCategoryFilter(e.target.value)}
                  className="bg-transparent text-xs text-slate-300 font-bold outline-none cursor-pointer border-none p-0 focus:ring-0"
                >
                  <option value="All" style={{ background: "#080E1C" }}>All Categories</option>
                  <option value="Vegetables" style={{ background: "#080E1C" }}>Vegetables (12)</option>
                  <option value="Dry Store" style={{ background: "#080E1C" }}>Dry Store (19)</option>
                  <option value="Meat & Seafood" style={{ background: "#080E1C" }}>Meat & Seafood (6)</option>
                  <option value="Frozen" style={{ background: "#080E1C" }}>Frozen (1)</option>
                  <option value="Dairy" style={{ background: "#080E1C" }}>Dairy (3)</option>
                  <option value="Beverages" style={{ background: "#080E1C" }}>Beverages (4)</option>
                  <option value="Packaging" style={{ background: "#080E1C" }}>Packaging (8)</option>
                </select>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyMarketList}
                className="bg-[#090D1A] hover:bg-[#14203A] text-emerald-400 border border-[#222E4E] px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Share2 size={13} />
                WhatsApp List
              </button>
              <button
                onClick={() => window.print()}
                className="bg-[#090D1A] hover:bg-[#14203A] text-slate-300 border border-[#222E4E] px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Printer size={13} />
                Print
              </button>
            </div>
          </div>

          {/* Grouped Market Checklist */}
          {(() => {
            const categories = [
              "Vegetables",
              "Dry Store",
              "Meat & Seafood",
              "Frozen",
              "Dairy",
              "Beverages",
              "Packaging"
            ] as const;

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {categories.map(cat => {
                  if (marketCategoryFilter !== "All" && marketCategoryFilter !== cat) return null;
                  const itemsInCat = marketItems.filter(item => {
                    const matchCat = item.category === cat;
                    const matchSearch = item.name.toLowerCase().includes(marketSearch.toLowerCase());
                    return matchCat && matchSearch;
                  });

                  if (itemsInCat.length === 0) return null;

                  return (
                    <div key={cat} className="bg-[#111625] border border-[#222E4E] rounded-2xl p-4 shadow-xl space-y-3">
                      <div className="flex items-center justify-between border-b border-[#222E4E] pb-2.5">
                        <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                          <Layers size={13} className="text-[#F26F21]" />
                          {cat}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 font-bold">
                          {itemsInCat.length} items
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {itemsInCat.map(item => (
                          <div
                            key={item.id}
                            className="bg-[#090D1A] border border-[#1A2640] hover:border-[#2A3B60] p-2.5 rounded-xl flex items-center justify-between gap-3 transition-colors"
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <span className="text-xs font-bold text-slate-200">{item.name}</span>
                            </div>

                            <div className="flex items-center gap-3">
                              {/* Quantity Target */}
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  value={item.estimatedQty || ""}
                                  onChange={(e) => updateMarketQty(item.id, parseFloat(e.target.value) || 0)}
                                  className="w-14 bg-[#111625] border border-[#222E4E] rounded px-1.5 py-0.5 text-center text-xs font-mono font-bold text-white outline-none"
                                />
                                <span className="text-[10px] text-slate-400 font-mono">{item.unit}</span>
                              </div>

                              {/* Mon / Wed / Fri Checkboxes */}
                              <div className="flex items-center gap-1.5">
                                {(["Mon", "Wed", "Fri"] as const).map(day => {
                                  const isChecked = day === "Mon" ? item.monChecked : day === "Wed" ? item.wedChecked : item.friChecked;
                                  return (
                                    <button
                                      key={day}
                                      onClick={() => toggleMarketDay(item.id, day)}
                                      className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase transition-all cursor-pointer border ${
                                        isChecked
                                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                                          : "bg-[#111625] text-slate-500 border-[#222E4E] hover:border-slate-400"
                                      }`}
                                      title={`Toggle ${day} market order`}
                                    >
                                      {day}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

    </div>
  );
}
