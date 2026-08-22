export interface FoodCostItem {
  id: number;
  name: string;
  category: "Rice" | "Kothu" | "Chop Suey" | "Other";
  portion: "Medium" | "Large" | "Regular";
  sellingPrice: number;
  foodCost: number;
  foodCostPct: number;
  totalCost: number;
  totalCostPct: number;
  inHouseNetProfit: number;
  inHouseNetProfitPct: number;
  uber33Commission: number;
  uberNetProfit: number;
  discountPrice?: number;
  afterDiscountPrice?: number;
  uberDiscountCommission?: number;
  afterDiscountNetProfit?: number;
}

export interface RecipeIngredient {
  id: string;
  name: string;
  unit: string;
  qty: number;
  unitRate: number;
  cost: number;
}

export interface RecipeCosting {
  id: string;
  dishName: string;
  portion: "Medium" | "Large";
  category: string;
  sellingPrice: number;
  ingredients: RecipeIngredient[];
  utilityRatePct: number; // e.g. 5% or 10%
  packagingCost: number; // e.g. Rs 33
  foodCost: number;
  utilityCost: number;
  totalCost: number;
  inHouseProfit: number;
  inHouseMarginPct: number;
  uberCommissionPct: number; // 33%
  uberCommissionAmount: number;
  uberNetProfit: number;
  uberMarginPct: number;
  pickmeCommissionPct: number; // 22%
  pickmeCommissionAmount: number;
  pickmeNetProfit: number;
  pickmeMarginPct: number;
}

export interface MarketOrderItem {
  id: string;
  category: "Vegetables" | "Dry Store" | "Meat & Seafood" | "Frozen" | "Dairy" | "Beverages" | "Packaging";
  name: string;
  unit: string;
  estimatedQty?: number;
  monChecked: boolean;
  wedChecked: boolean;
  friChecked: boolean;
  notes?: string;
}

// 34 Dishes parsed directly from public/costing.xlsx
export const INITIAL_FOOD_COST_ITEMS: FoodCostItem[] = [
  {
    id: 1,
    name: "EGG FRIED RICE M",
    category: "Rice",
    portion: "Medium",
    sellingPrice: 800,
    foodCost: 377,
    foodCostPct: 47.13,
    totalCost: 448,
    totalCostPct: 56.0,
    inHouseNetProfit: 352,
    inHouseNetProfitPct: 44.0,
    uber33Commission: 264,
    uberNetProfit: 88
  },
  {
    id: 2,
    name: "EGG FRIED RICE L",
    category: "Rice",
    portion: "Large",
    sellingPrice: 1120,
    foodCost: 442,
    foodCostPct: 39.46,
    totalCost: 519,
    totalCostPct: 46.34,
    inHouseNetProfit: 601,
    inHouseNetProfitPct: 53.66,
    uber33Commission: 369.6,
    uberNetProfit: 231.4
  },
  {
    id: 3,
    name: "CHICKEN FRIED RICE M",
    category: "Rice",
    portion: "Medium",
    sellingPrice: 1100,
    foodCost: 502,
    foodCostPct: 45.64,
    totalCost: 587,
    totalCostPct: 53.36,
    inHouseNetProfit: 513,
    inHouseNetProfitPct: 46.64,
    uber33Commission: 363,
    uberNetProfit: 150
  },
  {
    id: 4,
    name: "CHICKEN FRIED RICE L",
    category: "Rice",
    portion: "Large",
    sellingPrice: 1540,
    foodCost: 645,
    foodCostPct: 41.88,
    totalCost: 745,
    totalCostPct: 48.38,
    inHouseNetProfit: 795,
    inHouseNetProfitPct: 51.62,
    uber33Commission: 508.2,
    uberNetProfit: 286.8
  },
  {
    id: 5,
    name: "PRAWNS FRIED RICE M",
    category: "Rice",
    portion: "Medium",
    sellingPrice: 1200,
    foodCost: 500,
    foodCostPct: 41.67,
    totalCost: 585,
    totalCostPct: 48.75,
    inHouseNetProfit: 615,
    inHouseNetProfitPct: 51.25,
    uber33Commission: 396,
    uberNetProfit: 219
  },
  {
    id: 6,
    name: "PRAWNS FRIED RICE L",
    category: "Rice",
    portion: "Large",
    sellingPrice: 1680,
    foodCost: 642,
    foodCostPct: 38.21,
    totalCost: 741,
    totalCostPct: 44.11,
    inHouseNetProfit: 939,
    inHouseNetProfitPct: 55.89,
    uber33Commission: 554.4,
    uberNetProfit: 384.6
  },
  {
    id: 7,
    name: "BEFF FRIED RICE M",
    category: "Rice",
    portion: "Medium",
    sellingPrice: 1600,
    foodCost: 620,
    foodCostPct: 38.75,
    totalCost: 717,
    totalCostPct: 44.81,
    inHouseNetProfit: 883,
    inHouseNetProfitPct: 55.19,
    uber33Commission: 528,
    uberNetProfit: 355
  },
  {
    id: 8,
    name: "BEFF FRIED RICE L",
    category: "Rice",
    portion: "Large",
    sellingPrice: 2240,
    foodCost: 822,
    foodCostPct: 36.70,
    totalCost: 939,
    totalCostPct: 41.92,
    inHouseNetProfit: 1301,
    inHouseNetProfitPct: 58.08,
    uber33Commission: 739.2,
    uberNetProfit: 561.8,
    discountPrice: 250,
    afterDiscountPrice: 1990,
    uberDiscountCommission: 656.7,
    afterDiscountNetProfit: 394.3
  },
  {
    id: 9,
    name: "SEAFOOD FRIED RICE M",
    category: "Rice",
    portion: "Medium",
    sellingPrice: 1500,
    foodCost: 580,
    foodCostPct: 38.67,
    totalCost: 673,
    totalCostPct: 44.87,
    inHouseNetProfit: 827,
    inHouseNetProfitPct: 55.13,
    uber33Commission: 495,
    uberNetProfit: 332
  },
  {
    id: 10,
    name: "SEAFOOD FRIED RICE L",
    category: "Rice",
    portion: "Large",
    sellingPrice: 2100,
    foodCost: 762,
    foodCostPct: 36.29,
    totalCost: 873,
    totalCostPct: 41.57,
    inHouseNetProfit: 1227,
    inHouseNetProfitPct: 58.43,
    uber33Commission: 693,
    uberNetProfit: 534,
    discountPrice: 250,
    afterDiscountPrice: 1850,
    uberDiscountCommission: 610.5,
    afterDiscountNetProfit: 366.5
  },
  {
    id: 11,
    name: "SURF &TURF RICE M",
    category: "Rice",
    portion: "Medium",
    sellingPrice: 1700,
    foodCost: 592,
    foodCostPct: 34.82,
    totalCost: 686,
    totalCostPct: 40.35,
    inHouseNetProfit: 1014,
    inHouseNetProfitPct: 59.65,
    uber33Commission: 561,
    uberNetProfit: 453
  },
  {
    id: 12,
    name: "SURF &TURF RICE L",
    category: "Rice",
    portion: "Large",
    sellingPrice: 2380,
    foodCost: 834,
    foodCostPct: 35.04,
    totalCost: 952,
    totalCostPct: 40.0,
    inHouseNetProfit: 1428,
    inHouseNetProfitPct: 60.0,
    uber33Commission: 785.4,
    uberNetProfit: 642.6,
    discountPrice: 250,
    afterDiscountPrice: 2130,
    uberDiscountCommission: 702.9,
    afterDiscountNetProfit: 475.1
  },
  {
    id: 13,
    name: "EGG FRIED KOTHU M",
    category: "Kothu",
    portion: "Medium",
    sellingPrice: 800,
    foodCost: 327,
    foodCostPct: 40.88,
    totalCost: 393,
    totalCostPct: 49.13,
    inHouseNetProfit: 407,
    inHouseNetProfitPct: 50.88,
    uber33Commission: 264,
    uberNetProfit: 143
  },
  {
    id: 14,
    name: "EGG FRIED KOTHU L",
    category: "Kothu",
    portion: "Large",
    sellingPrice: 1120,
    foodCost: 359,
    foodCostPct: 32.05,
    totalCost: 428,
    totalCostPct: 38.21,
    inHouseNetProfit: 692,
    inHouseNetProfitPct: 61.79,
    uber33Commission: 369.6,
    uberNetProfit: 322.4,
    afterDiscountPrice: 1120,
    uberDiscountCommission: 369.6,
    afterDiscountNetProfit: 322.4
  },
  {
    id: 15,
    name: "CHICKEN KOTHU M",
    category: "Kothu",
    portion: "Medium",
    sellingPrice: 1100,
    foodCost: 452,
    foodCostPct: 41.09,
    totalCost: 532,
    totalCostPct: 48.36,
    inHouseNetProfit: 568,
    inHouseNetProfitPct: 51.64,
    uber33Commission: 363,
    uberNetProfit: 205
  },
  {
    id: 16,
    name: "CHICKEN KOTHU L",
    category: "Kothu",
    portion: "Large",
    sellingPrice: 1540,
    foodCost: 590,
    foodCostPct: 38.31,
    totalCost: 684,
    totalCostPct: 44.42,
    inHouseNetProfit: 856,
    inHouseNetProfitPct: 55.58,
    uber33Commission: 508.2,
    uberNetProfit: 347.8
  },
  {
    id: 17,
    name: "BEEF KOTHU M",
    category: "Kothu",
    portion: "Medium",
    sellingPrice: 1600,
    foodCost: 570,
    foodCostPct: 35.63,
    totalCost: 662,
    totalCostPct: 41.38,
    inHouseNetProfit: 938,
    inHouseNetProfitPct: 58.63,
    uber33Commission: 528,
    uberNetProfit: 410
  },
  {
    id: 18,
    name: "BEEF KOTHU L",
    category: "Kothu",
    portion: "Large",
    sellingPrice: 2240,
    foodCost: 740,
    foodCostPct: 33.04,
    totalCost: 849,
    totalCostPct: 37.90,
    inHouseNetProfit: 1391,
    inHouseNetProfitPct: 62.10,
    uber33Commission: 739.2,
    uberNetProfit: 651.8,
    discountPrice: 250,
    afterDiscountPrice: 1990,
    uberDiscountCommission: 656.7,
    afterDiscountNetProfit: 484.3
  },
  {
    id: 19,
    name: "SEAFOOD KOTHU M",
    category: "Kothu",
    portion: "Medium",
    sellingPrice: 1500,
    foodCost: 515,
    foodCostPct: 34.33,
    totalCost: 602,
    totalCostPct: 40.13,
    inHouseNetProfit: 898,
    inHouseNetProfitPct: 59.87,
    uber33Commission: 495,
    uberNetProfit: 403
  },
  {
    id: 20,
    name: "SEAFOOD KOTHU L",
    category: "Kothu",
    portion: "Large",
    sellingPrice: 2100,
    foodCost: 680,
    foodCostPct: 32.38,
    totalCost: 783,
    totalCostPct: 37.29,
    inHouseNetProfit: 1317,
    inHouseNetProfitPct: 62.71,
    uber33Commission: 693,
    uberNetProfit: 624,
    discountPrice: 250,
    afterDiscountPrice: 1850,
    uberDiscountCommission: 610.5,
    afterDiscountNetProfit: 456.5
  },
  {
    id: 21,
    name: "SURF &TURF KOTHU M",
    category: "Kothu",
    portion: "Medium",
    sellingPrice: 1700,
    foodCost: 560,
    foodCostPct: 32.94,
    totalCost: 650,
    totalCostPct: 38.24,
    inHouseNetProfit: 1050,
    inHouseNetProfitPct: 61.76,
    uber33Commission: 561,
    uberNetProfit: 489
  },
  {
    id: 22,
    name: "SURF &TURF KOTHU L",
    category: "Kothu",
    portion: "Large",
    sellingPrice: 2380,
    foodCost: 752,
    foodCostPct: 31.60,
    totalCost: 860,
    totalCostPct: 36.13,
    inHouseNetProfit: 1520,
    inHouseNetProfitPct: 63.87,
    uber33Commission: 785.4,
    uberNetProfit: 734.6,
    discountPrice: 250,
    afterDiscountPrice: 2130,
    uberDiscountCommission: 702.9,
    afterDiscountNetProfit: 567.1
  },
  {
    id: 23,
    name: "CHICKEN CHEESE KOTHU M",
    category: "Kothu",
    portion: "Medium",
    sellingPrice: 1600,
    foodCost: 722,
    foodCostPct: 45.13,
    totalCost: 827,
    totalCostPct: 51.69,
    inHouseNetProfit: 773,
    inHouseNetProfitPct: 48.31,
    uber33Commission: 528,
    uberNetProfit: 245
  },
  {
    id: 24,
    name: "CHICKEN CHEESE KOTHU L",
    category: "Kothu",
    portion: "Large",
    sellingPrice: 2240,
    foodCost: 893,
    foodCostPct: 39.87,
    totalCost: 1015,
    totalCostPct: 45.31,
    inHouseNetProfit: 1225,
    inHouseNetProfitPct: 54.69,
    uber33Commission: 739.2,
    uberNetProfit: 485.8,
    discountPrice: 250,
    afterDiscountPrice: 1990,
    uberDiscountCommission: 656.7,
    afterDiscountNetProfit: 318.3
  },
  {
    id: 25,
    name: "CHICKEN CHOSUEY M",
    category: "Chop Suey",
    portion: "Medium",
    sellingPrice: 1300,
    foodCost: 662,
    foodCostPct: 50.92,
    totalCost: 762,
    totalCostPct: 58.62,
    inHouseNetProfit: 538,
    inHouseNetProfitPct: 41.38,
    uber33Commission: 429,
    uberNetProfit: 109
  },
  {
    id: 26,
    name: "CHICKEN CHOSUEY L",
    category: "Chop Suey",
    portion: "Large",
    sellingPrice: 1820,
    foodCost: 804,
    foodCostPct: 44.18,
    totalCost: 920,
    totalCostPct: 50.55,
    inHouseNetProfit: 900,
    inHouseNetProfitPct: 49.45,
    uber33Commission: 600.6,
    uberNetProfit: 299.4
  },
  {
    id: 27,
    name: "PRAWNS CHOSUEY M",
    category: "Chop Suey",
    portion: "Medium",
    sellingPrice: 1400,
    foodCost: 620,
    foodCostPct: 44.29,
    totalCost: 714,
    totalCostPct: 51.0,
    inHouseNetProfit: 686,
    inHouseNetProfitPct: 49.0,
    uber33Commission: 462,
    uberNetProfit: 224
  },
  {
    id: 28,
    name: "PRAWNS CHOSUEY L",
    category: "Chop Suey",
    portion: "Large",
    sellingPrice: 1960,
    foodCost: 761,
    foodCostPct: 38.83,
    totalCost: 870,
    totalCostPct: 44.39,
    inHouseNetProfit: 1090,
    inHouseNetProfitPct: 55.61,
    uber33Commission: 646.8,
    uberNetProfit: 443.2,
    discountPrice: 250,
    afterDiscountPrice: 1710,
    uberDiscountCommission: 564.3,
    afterDiscountNetProfit: 275.7
  },
  {
    id: 29,
    name: "SEAFOOD CHOSUEY M",
    category: "Chop Suey",
    portion: "Medium",
    sellingPrice: 1600,
    foodCost: 691,
    foodCostPct: 43.19,
    totalCost: 793,
    totalCostPct: 49.56,
    inHouseNetProfit: 807,
    inHouseNetProfitPct: 50.44,
    uber33Commission: 528,
    uberNetProfit: 279
  },
  {
    id: 30,
    name: "SEAFOOD CHOSUEY L",
    category: "Chop Suey",
    portion: "Large",
    sellingPrice: 2240,
    foodCost: 874,
    foodCostPct: 39.02,
    totalCost: 993,
    totalCostPct: 44.33,
    inHouseNetProfit: 1247,
    inHouseNetProfitPct: 55.67,
    uber33Commission: 739.2,
    uberNetProfit: 507.8,
    discountPrice: 250,
    afterDiscountPrice: 1990,
    uberDiscountCommission: 656.7,
    afterDiscountNetProfit: 340.3
  },
  {
    id: 31,
    name: "SURF &TURF CHOSUEY M",
    category: "Chop Suey",
    portion: "Medium",
    sellingPrice: 1800,
    foodCost: 775,
    foodCostPct: 43.06,
    totalCost: 886,
    totalCostPct: 49.22,
    inHouseNetProfit: 914,
    inHouseNetProfitPct: 50.78,
    uber33Commission: 594,
    uberNetProfit: 320
  },
  {
    id: 32,
    name: "SURF &TURF CHOSUEY L",
    category: "Chop Suey",
    portion: "Large",
    sellingPrice: 2520,
    foodCost: 945,
    foodCostPct: 37.50,
    totalCost: 1073,
    totalCostPct: 42.58,
    inHouseNetProfit: 1447,
    inHouseNetProfitPct: 57.42,
    uber33Commission: 831.6,
    uberNetProfit: 615.4,
    discountPrice: 250,
    afterDiscountPrice: 2270,
    uberDiscountCommission: 749.1,
    afterDiscountNetProfit: 447.9
  },
  {
    id: 33,
    name: "NASI GERUNG M",
    category: "Rice",
    portion: "Medium",
    sellingPrice: 1400,
    foodCost: 617,
    foodCostPct: 44.07,
    totalCost: 714,
    totalCostPct: 51.0,
    inHouseNetProfit: 686,
    inHouseNetProfitPct: 49.0,
    uber33Commission: 462,
    uberNetProfit: 224
  },
  {
    id: 34,
    name: "NASI GERUNG L",
    category: "Rice",
    portion: "Large",
    sellingPrice: 1960,
    foodCost: 773,
    foodCostPct: 39.44,
    totalCost: 886,
    totalCostPct: 45.20,
    inHouseNetProfit: 1074,
    inHouseNetProfitPct: 54.80,
    uber33Commission: 646.8,
    uberNetProfit: 427.2,
    discountPrice: 250,
    afterDiscountPrice: 1710,
    uberDiscountCommission: 564.3,
    afterDiscountNetProfit: 259.7
  }
];

// Market Order Items by 7 Categories
export const INITIAL_MARKET_ORDER_ITEMS: MarketOrderItem[] = [
  // Vegetables
  { id: "veg-1", category: "Vegetables", name: "Carrot", unit: "kg", estimatedQty: 5, monChecked: false, wedChecked: false, friChecked: false },
  { id: "veg-2", category: "Vegetables", name: "Leeks", unit: "kg", estimatedQty: 4, monChecked: false, wedChecked: false, friChecked: false },
  { id: "veg-3", category: "Vegetables", name: "Cabbage", unit: "kg", estimatedQty: 6, monChecked: false, wedChecked: false, friChecked: false },
  { id: "veg-4", category: "Vegetables", name: "Capsicum", unit: "kg", estimatedQty: 3, monChecked: false, wedChecked: false, friChecked: false },
  { id: "veg-5", category: "Vegetables", name: "Ginger", unit: "kg", estimatedQty: 2, monChecked: false, wedChecked: false, friChecked: false },
  { id: "veg-6", category: "Vegetables", name: "Garlic", unit: "kg", estimatedQty: 3, monChecked: false, wedChecked: false, friChecked: false },
  { id: "veg-7", category: "Vegetables", name: "Onion", unit: "kg", estimatedQty: 10, monChecked: false, wedChecked: false, friChecked: false },
  { id: "veg-8", category: "Vegetables", name: "Curry Leaves", unit: "bunches", estimatedQty: 5, monChecked: false, wedChecked: false, friChecked: false },
  { id: "veg-9", category: "Vegetables", name: "Pandan Leaves", unit: "bunches", estimatedQty: 3, monChecked: false, wedChecked: false, friChecked: false },
  { id: "veg-10", category: "Vegetables", name: "Lemongrass", unit: "bunches", estimatedQty: 2, monChecked: false, wedChecked: false, friChecked: false },
  { id: "veg-11", category: "Vegetables", name: "Potato", unit: "kg", estimatedQty: 8, monChecked: false, wedChecked: false, friChecked: false },
  { id: "veg-12", category: "Vegetables", name: "Bird Eye Chili", unit: "g", estimatedQty: 500, monChecked: false, wedChecked: false, friChecked: false },

  // Dry Store
  { id: "dry-1", category: "Dry Store", name: "Basmathi Rice", unit: "kg", estimatedQty: 25, monChecked: false, wedChecked: false, friChecked: false },
  { id: "dry-2", category: "Dry Store", name: "Soya Sauce", unit: "bottles", estimatedQty: 4, monChecked: false, wedChecked: false, friChecked: false },
  { id: "dry-3", category: "Dry Store", name: "Oyster Sauce", unit: "bottles", estimatedQty: 3, monChecked: false, wedChecked: false, friChecked: false },
  { id: "dry-4", category: "Dry Store", name: "Tomato Sauce", unit: "bottles", estimatedQty: 4, monChecked: false, wedChecked: false, friChecked: false },
  { id: "dry-5", category: "Dry Store", name: "Black Pepper", unit: "g", estimatedQty: 1000, monChecked: false, wedChecked: false, friChecked: false },
  { id: "dry-6", category: "Dry Store", name: "Fish Sauce", unit: "bottles", estimatedQty: 2, monChecked: false, wedChecked: false, friChecked: false },
  { id: "dry-7", category: "Dry Store", name: "Red Chili (Flakes/Powder)", unit: "kg", estimatedQty: 2, monChecked: false, wedChecked: false, friChecked: false },
  { id: "dry-8", category: "Dry Store", name: "Coriander Powder", unit: "g", estimatedQty: 500, monChecked: false, wedChecked: false, friChecked: false },
  { id: "dry-9", category: "Dry Store", name: "Cumin Powder", unit: "g", estimatedQty: 500, monChecked: false, wedChecked: false, friChecked: false },
  { id: "dry-10", category: "Dry Store", name: "Sweet Cumin (Fennel)", unit: "g", estimatedQty: 500, monChecked: false, wedChecked: false, friChecked: false },
  { id: "dry-11", category: "Dry Store", name: "Salt", unit: "kg", estimatedQty: 5, monChecked: false, wedChecked: false, friChecked: false },
  { id: "dry-12", category: "Dry Store", name: "Seasoning Powder / Stock", unit: "kg", estimatedQty: 2, monChecked: false, wedChecked: false, friChecked: false },
  { id: "dry-13", category: "Dry Store", name: "Noodles", unit: "packs", estimatedQty: 10, monChecked: false, wedChecked: false, friChecked: false },
  { id: "dry-14", category: "Dry Store", name: "Coconut Milk Powder", unit: "kg", estimatedQty: 3, monChecked: false, wedChecked: false, friChecked: false },
  { id: "dry-15", category: "Dry Store", name: "Shrimp Paste", unit: "jars", estimatedQty: 2, monChecked: false, wedChecked: false, friChecked: false },
  { id: "dry-16", category: "Dry Store", name: "Palm Oil / Cooking Oil", unit: "L", estimatedQty: 10, monChecked: false, wedChecked: false, friChecked: false },
  { id: "dry-17", category: "Dry Store", name: "Sesame Oil", unit: "bottles", estimatedQty: 2, monChecked: false, wedChecked: false, friChecked: false },
  { id: "dry-18", category: "Dry Store", name: "Corn Flour", unit: "kg", estimatedQty: 3, monChecked: false, wedChecked: false, friChecked: false },
  { id: "dry-19", category: "Dry Store", name: "Wheat Flour", unit: "kg", estimatedQty: 5, monChecked: false, wedChecked: false, friChecked: false },

  // Meat & Seafood
  { id: "meat-1", category: "Meat & Seafood", name: "Chicken (Boneless / Curry Cut)", unit: "kg", estimatedQty: 15, monChecked: false, wedChecked: false, friChecked: false },
  { id: "meat-2", category: "Meat & Seafood", name: "Fish (Seer / Tuna Cubes)", unit: "kg", estimatedQty: 5, monChecked: false, wedChecked: false, friChecked: false },
  { id: "meat-3", category: "Meat & Seafood", name: "Beef (Tender Cubes)", unit: "kg", estimatedQty: 8, monChecked: false, wedChecked: false, friChecked: false },
  { id: "meat-4", category: "Meat & Seafood", name: "Pork (Fresh Cut)", unit: "kg", estimatedQty: 5, monChecked: false, wedChecked: false, friChecked: false },
  { id: "meat-5", category: "Meat & Seafood", name: "Prawns (Cleaned)", unit: "kg", estimatedQty: 6, monChecked: false, wedChecked: false, friChecked: false },
  { id: "meat-6", category: "Meat & Seafood", name: "Cuttlefish / Squid", unit: "kg", estimatedQty: 4, monChecked: false, wedChecked: false, friChecked: false },

  // Frozen
  { id: "froz-1", category: "Frozen", name: "Kotthu Roti Strips", unit: "kg", estimatedQty: 20, monChecked: false, wedChecked: false, friChecked: false },

  // Dairy
  { id: "dai-1", category: "Dairy", name: "Fresh Milk", unit: "L", estimatedQty: 6, monChecked: false, wedChecked: false, friChecked: false },
  { id: "dai-2", category: "Dairy", name: "Cheese Slices / Block", unit: "packs", estimatedQty: 8, monChecked: false, wedChecked: false, friChecked: false },
  { id: "dai-3", category: "Dairy", name: "Eggs (Fresh Farm)", unit: "pcs", estimatedQty: 100, monChecked: false, wedChecked: false, friChecked: false },

  // Beverages
  { id: "bev-1", category: "Beverages", name: "Water 1L", unit: "bottles", estimatedQty: 24, monChecked: false, wedChecked: false, friChecked: false },
  { id: "bev-2", category: "Beverages", name: "Coca Cola (Can / 400ml)", unit: "cans", estimatedQty: 24, monChecked: false, wedChecked: false, friChecked: false },
  { id: "bev-3", category: "Beverages", name: "Ginger Beer EGB", unit: "cans", estimatedQty: 24, monChecked: false, wedChecked: false, friChecked: false },
  { id: "bev-4", category: "Beverages", name: "Sprite", unit: "cans", estimatedQty: 24, monChecked: false, wedChecked: false, friChecked: false },

  // Packaging & Consumables
  { id: "pack-1", category: "Packaging", name: "Take Away Box (L)", unit: "pcs", estimatedQty: 150, monChecked: false, wedChecked: false, friChecked: false },
  { id: "pack-2", category: "Packaging", name: "Take Away Box (Regular)", unit: "pcs", estimatedQty: 150, monChecked: false, wedChecked: false, friChecked: false },
  { id: "pack-3", category: "Packaging", name: "Sauce Cup (50ml)", unit: "pcs", estimatedQty: 200, monChecked: false, wedChecked: false, friChecked: false },
  { id: "pack-4", category: "Packaging", name: "Chili Paste Cup", unit: "pcs", estimatedQty: 200, monChecked: false, wedChecked: false, friChecked: false },
  { id: "pack-5", category: "Packaging", name: "Aluminium Foil Take Away Box", unit: "pcs", estimatedQty: 100, monChecked: false, wedChecked: false, friChecked: false },
  { id: "pack-6", category: "Packaging", name: "Kraft Grocery Bag", unit: "pcs", estimatedQty: 100, monChecked: false, wedChecked: false, friChecked: false },
  { id: "pack-7", category: "Packaging", name: "Black Food Prep Gloves (Box)", unit: "boxes", estimatedQty: 2, monChecked: false, wedChecked: false, friChecked: false },
  { id: "pack-8", category: "Packaging", name: "Face Masks (Box)", unit: "boxes", estimatedQty: 1, monChecked: false, wedChecked: false, friChecked: false },
];

// Initial Recipes including the detailed Excel Chicken Cheese Kotthu recipe
export const INITIAL_RECIPES: RecipeCosting[] = [
  {
    id: "rec-1",
    dishName: "CHICKEN CHEESE KOTHU M",
    portion: "Medium",
    category: "Kothu",
    sellingPrice: 1600,
    utilityRatePct: 10, // 10% prep & utility
    packagingCost: 33, // standard take away pack
    ingredients: [
      { id: "ing-1", name: "Egg Kottu Base", unit: "portion", qty: 1, unitRate: 290, cost: 290 },
      { id: "ing-2", name: "Chicken Cubes", unit: "g", qty: 60, unitRate: 2.7, cost: 162 },
      { id: "ing-3", name: "Cheese Slices", unit: "slice", qty: 2, unitRate: 75, cost: 150 },
      { id: "ing-4", name: "Fresh Milk", unit: "ml", qty: 200, unitRate: 0.6, cost: 120 },
    ],
    foodCost: 722,
    utilityCost: 72.2,
    totalCost: 827.2,
    inHouseProfit: 772.8,
    inHouseMarginPct: 48.3,
    uberCommissionPct: 33,
    uberCommissionAmount: 528,
    uberNetProfit: 244.8,
    uberMarginPct: 15.3,
    pickmeCommissionPct: 22,
    pickmeCommissionAmount: 352,
    pickmeNetProfit: 420.8,
    pickmeMarginPct: 26.3,
  },
  {
    id: "rec-2",
    dishName: "CHICKEN FRIED RICE M",
    portion: "Medium",
    category: "Rice",
    sellingPrice: 1100,
    utilityRatePct: 10,
    packagingCost: 33,
    ingredients: [
      { id: "ing-10", name: "Basmathi Cooked Rice", unit: "g", qty: 350, unitRate: 0.5, cost: 175 },
      { id: "ing-11", name: "Chicken Fillet Cubes", unit: "g", qty: 80, unitRate: 2.7, cost: 216 },
      { id: "ing-12", name: "Fresh Egg", unit: "pc", qty: 1, unitRate: 45, cost: 45 },
      { id: "ing-13", name: "Vegetables (Carrot/Leeks)", unit: "g", qty: 70, unitRate: 0.5, cost: 35 },
      { id: "ing-14", name: "Sauces & Spices", unit: "mix", qty: 1, unitRate: 31, cost: 31 },
    ],
    foodCost: 502,
    utilityCost: 52,
    totalCost: 587,
    inHouseProfit: 513,
    inHouseMarginPct: 46.64,
    uberCommissionPct: 33,
    uberCommissionAmount: 363,
    uberNetProfit: 150,
    uberMarginPct: 13.64,
    pickmeCommissionPct: 22,
    pickmeCommissionAmount: 242,
    pickmeNetProfit: 271,
    pickmeMarginPct: 24.64,
  },
  {
    id: "rec-3",
    dishName: "BEEF FRIED RICE L",
    portion: "Large",
    category: "Rice",
    sellingPrice: 2240,
    utilityRatePct: 10,
    packagingCost: 35,
    ingredients: [
      { id: "ing-20", name: "Basmathi Cooked Rice", unit: "g", qty: 500, unitRate: 0.5, cost: 250 },
      { id: "ing-21", name: "Prime Beef Cubes", unit: "g", qty: 150, unitRate: 3.0, cost: 450 },
      { id: "ing-22", name: "Fresh Eggs", unit: "pcs", qty: 1.5, unitRate: 45, cost: 67 },
      { id: "ing-23", name: "Vegetables (Carrot/Leeks/Onion)", unit: "g", qty: 90, unitRate: 0.45, cost: 40 },
      { id: "ing-24", name: "Special Seasoning & Sesame Oil", unit: "mix", qty: 1, unitRate: 15, cost: 15 },
    ],
    foodCost: 822,
    utilityCost: 82,
    totalCost: 939,
    inHouseProfit: 1301,
    inHouseMarginPct: 58.08,
    uberCommissionPct: 33,
    uberCommissionAmount: 739.2,
    uberNetProfit: 561.8,
    uberMarginPct: 25.08,
    pickmeCommissionPct: 22,
    pickmeCommissionAmount: 492.8,
    pickmeNetProfit: 808.2,
    pickmeMarginPct: 36.08,
  }
];

export function calculateRecipeTotals(
  sellingPrice: number,
  ingredients: RecipeIngredient[],
  utilityRatePct: number = 10,
  packagingCost: number = 33,
  uberCommissionPct: number = 33,
  pickmeCommissionPct: number = 22
) {
  const foodCost = ingredients.reduce((sum, ing) => sum + (Number(ing.cost) || 0), 0);
  const utilityCost = Number((foodCost * (utilityRatePct / 100)).toFixed(2));
  const totalCost = Number((foodCost + utilityCost + packagingCost).toFixed(2));

  const inHouseProfit = Number((sellingPrice - totalCost).toFixed(2));
  const inHouseMarginPct = sellingPrice > 0 ? Number(((inHouseProfit / sellingPrice) * 100).toFixed(2)) : 0;

  const uberCommissionAmount = Number((sellingPrice * (uberCommissionPct / 100)).toFixed(2));
  const uberNetProfit = Number((sellingPrice - uberCommissionAmount - totalCost).toFixed(2));
  const uberMarginPct = sellingPrice > 0 ? Number(((uberNetProfit / sellingPrice) * 100).toFixed(2)) : 0;

  const pickmeCommissionAmount = Number((sellingPrice * (pickmeCommissionPct / 100)).toFixed(2));
  const pickmeNetProfit = Number((sellingPrice - pickmeCommissionAmount - totalCost).toFixed(2));
  const pickmeMarginPct = sellingPrice > 0 ? Number(((pickmeNetProfit / sellingPrice) * 100).toFixed(2)) : 0;

  return {
    foodCost,
    utilityCost,
    totalCost,
    inHouseProfit,
    inHouseMarginPct,
    uberCommissionAmount,
    uberNetProfit,
    uberMarginPct,
    pickmeCommissionAmount,
    pickmeNetProfit,
    pickmeMarginPct,
  };
}
