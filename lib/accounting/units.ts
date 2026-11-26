/**
 * Purchase-to-Recipe Unit Conversion Engine.
 * Supports automatic conversion between purchase units (kg, liters, lbs, cases)
 * and recipe units (g, ml, tsp, tbsp, cup, pcs).
 */

type Dimension = "MASS" | "VOLUME" | "COUNT";

interface UnitDef {
  dimension: Dimension;
  toBase: number; // Base: g for MASS, ml for VOLUME, pcs for COUNT
}

const UNIT_MAP: Record<string, UnitDef> = {
  // Mass (base: grams)
  g: { dimension: "MASS", toBase: 1 },
  gram: { dimension: "MASS", toBase: 1 },
  grams: { dimension: "MASS", toBase: 1 },
  kg: { dimension: "MASS", toBase: 1000 },
  kilogram: { dimension: "MASS", toBase: 1000 },
  kilograms: { dimension: "MASS", toBase: 1000 },
  lb: { dimension: "MASS", toBase: 453.59237 },
  lbs: { dimension: "MASS", toBase: 453.59237 },
  oz: { dimension: "MASS", toBase: 28.349523 },

  // Volume (base: milliliters)
  ml: { dimension: "VOLUME", toBase: 1 },
  milliliter: { dimension: "VOLUME", toBase: 1 },
  l: { dimension: "VOLUME", toBase: 1000 },
  liter: { dimension: "VOLUME", toBase: 1000 },
  liters: { dimension: "VOLUME", toBase: 1000 },
  litre: { dimension: "VOLUME", toBase: 1000 },
  litres: { dimension: "VOLUME", toBase: 1000 },
  tsp: { dimension: "VOLUME", toBase: 5 },
  tbsp: { dimension: "VOLUME", toBase: 15 },
  cup: { dimension: "VOLUME", toBase: 240 },

  // Count (base: pieces)
  pcs: { dimension: "COUNT", toBase: 1 },
  pc: { dimension: "COUNT", toBase: 1 },
  unit: { dimension: "COUNT", toBase: 1 },
  units: { dimension: "COUNT", toBase: 1 },
  pack: { dimension: "COUNT", toBase: 1 },
  packs: { dimension: "COUNT", toBase: 1 },
  bottle: { dimension: "COUNT", toBase: 1 },
  can: { dimension: "COUNT", toBase: 1 },
  cases: { dimension: "COUNT", toBase: 1 },
};

export function normalizeUnit(unit: string): string {
  return (unit || "pcs").trim().toLowerCase();
}

export function convertUnit(
  qty: number,
  fromUnit: string,
  toUnit: string
): { value: number; converted: boolean; error?: string } {
  const f = normalizeUnit(fromUnit);
  const t = normalizeUnit(toUnit);
  if (f === t) return { value: qty, converted: true };

  const fromDef = UNIT_MAP[f];
  const toDef = UNIT_MAP[t];

  if (!fromDef || !toDef) {
    return { value: qty, converted: false, error: `Unknown unit: ${!fromDef ? fromUnit : toUnit}` };
  }
  if (fromDef.dimension !== toDef.dimension) {
    return {
      value: qty,
      converted: false,
      error: `Incompatible dimensions: ${fromUnit} (${fromDef.dimension}) vs ${toUnit} (${toDef.dimension})`,
    };
  }

  const inBase = qty * fromDef.toBase;
  return { value: inBase / toDef.toBase, converted: true };
}

/**
 * Given a purchase unit cost (e.g. Rs. 2,500 per kg) and a recipe quantity (e.g. 50 g),
 * computes the exact recipe line cost.
 */
export function computeIngredientCost(
  recipeQty: number,
  recipeUnit: string,
  inventoryUnitCost: number,
  inventoryUnit: string
): { qtyInInventoryUnit: number; cost: number; warning?: string } {
  const conv = convertUnit(recipeQty, recipeUnit, inventoryUnit);
  if (!conv.converted) {
    return {
      qtyInInventoryUnit: recipeQty,
      cost: 0,
      warning: conv.error,
    };
  }
  return {
    qtyInInventoryUnit: conv.value,
    cost: Math.round(conv.value * inventoryUnitCost * 100) / 100,
  };
}
