import { NextResponse } from "next/server";
import { getPool, withTransaction } from "@/lib/db";
import { postJournalEntry } from "@/lib/accounting/ledger";
import { computeIngredientCost, convertUnit } from "@/lib/accounting/units";
import { round2, todayISO } from "@/lib/accounting/format";

export async function GET() {
  try {
    const pool = getPool();
    const [invRes, recRes, movRes] = await Promise.all([
      pool.query(`SELECT * FROM tce_inventory ORDER BY name ASC`),
      pool.query(`
        SELECT r.*,
          COALESCE(
            json_agg(
              json_build_object(
                'id', ri.id,
                'inventory_id', ri.inventory_id,
                'ingredient_name', ri.ingredient_name,
                'recipe_qty', ri.recipe_qty,
                'recipe_unit', ri.recipe_unit,
                'unit_cost_override', ri.unit_cost_override,
                'inv_unit', inv.unit,
                'inv_unit_cost', inv.unit_cost
              ) ORDER BY ri.id
            ) FILTER (WHERE ri.id IS NOT NULL),
            '[]'::json
          ) AS ingredients
        FROM tce_recipes r
        LEFT JOIN tce_recipe_ingredients ri ON ri.recipe_id = r.id
        LEFT JOIN tce_inventory inv ON inv.id = ri.inventory_id
        GROUP BY r.id
        ORDER BY r.dish_name ASC
      `),
      pool.query(`SELECT * FROM tce_stock_movements ORDER BY created_at DESC LIMIT 100`),
    ]);

    const recipes = recRes.rows.map((r) => {
      let foodCost = 0;
      const ingredients = (r.ingredients || []).map((ing: any) => {
        const unitCost = Number(ing.unit_cost_override ?? ing.inv_unit_cost ?? 0);
        const invUnit = ing.inv_unit || ing.recipe_unit;
        const calc = computeIngredientCost(
          Number(ing.recipe_qty),
          ing.recipe_unit,
          unitCost,
          invUnit
        );
        foodCost = round2(foodCost + calc.cost);
        return { ...ing, computed_cost: calc.cost, warning: calc.warning };
      });
      return {
        ...r,
        ingredients,
        computed_food_cost: foodCost,
        computed_total_cost: round2(foodCost + Number(r.packaging_cost || 0)),
      };
    });

    return NextResponse.json({
      inventory: invRes.rows,
      recipes,
      movements: movRes.rows,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "PURCHASE") {
      const {
        inventoryId,
        purchaseQty,
        purchaseUnit,
        totalCost,
        inventoryAccount = "1140", // 1140 Raw, 1150 Packaging, 1160 Cleaning
        paymentAccount = "1120", // 1120 Bank, 1110 Cash, 2110 AP
        supplier,
        entryDate = todayISO(),
        createdBy = "DIRECTOR",
      } = body;

      const result = await withTransaction(async (client) => {
        const invRes = await client.query(
          `SELECT * FROM tce_inventory WHERE id = $1 FOR UPDATE`,
          [inventoryId]
        );
        if (invRes.rows.length === 0) throw new Error("Inventory item not found");
        const inv = invRes.rows[0];

        const conv = convertUnit(Number(purchaseQty), purchaseUnit || inv.unit, inv.unit);
        if (!conv.converted) throw new Error(conv.error || "Unit conversion failed");

        const addedQty = conv.value;
        const cost = round2(Number(totalCost));
        const oldQty = Math.max(0, Number(inv.quantity || 0));
        const oldVal = oldQty * Number(inv.unit_cost || 0);
        const newQty = oldQty + addedQty;
        const newUnitCost = newQty > 0 ? round2((oldVal + cost) / newQty) : round2(cost / addedQty);

        await client.query(
          `UPDATE tce_inventory SET quantity = $1, unit_cost = $2, supplier = COALESCE($3, supplier) WHERE id = $4`,
          [newQty, newUnitCost, supplier || null, inventoryId]
        );

        const je = await postJournalEntry(client, {
          entryDate,
          referenceType: "PURCHASE",
          referenceId: inventoryId,
          description: `Inventory Purchase: ${inv.name} (${purchaseQty} ${purchaseUnit || inv.unit})`,
          createdBy,
          lines: [
            { accountCode: inventoryAccount, debit: cost, memo: `Restock ${inv.name}` },
            { accountCode: paymentAccount, credit: cost, memo: `Payment/AP (${supplier || "Supplier"})` },
          ],
        });

        await client.query(
          `INSERT INTO tce_stock_movements
            (id, inventory_id, movement_type, quantity_delta, unit, unit_cost, total_cost, reference_id, reason, journal_entry_id, created_by)
           VALUES ($1, $2, 'PURCHASE', $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            `SM-${Date.now()}`,
            inventoryId,
            addedQty,
            inv.unit,
            newUnitCost,
            cost,
            je.id,
            `Purchase from ${supplier || "Supplier"}`,
            je.id,
            createdBy,
          ]
        );

        return { journalEntryId: je.id, newQty, newUnitCost };
      });
      return NextResponse.json(result, { status: 201 });
    }

    if (action === "WASTE" || action === "STOCK_TAKE") {
      const {
        inventoryId,
        qty, // For WASTE: qty wasted (>0). For STOCK_TAKE: physicalCount
        unit,
        reason,
        entryDate = todayISO(),
        createdBy = "DIRECTOR",
      } = body;

      const result = await withTransaction(async (client) => {
        const invRes = await client.query(
          `SELECT * FROM tce_inventory WHERE id = $1 FOR UPDATE`,
          [inventoryId]
        );
        if (invRes.rows.length === 0) throw new Error("Inventory item not found");
        const inv = invRes.rows[0];

        const conv = convertUnit(Number(qty), unit || inv.unit, inv.unit);
        if (!conv.converted) throw new Error(conv.error || "Unit conversion failed");

        const currentQty = Number(inv.quantity || 0);
        const unitCost = Number(inv.unit_cost || 0);

        let delta = 0;
        let newQty = currentQty;
        if (action === "WASTE") {
          delta = -Math.abs(conv.value);
          newQty = Math.max(0, currentQty + delta);
        } else {
          newQty = Math.max(0, conv.value);
          delta = newQty - currentQty;
        }

        if (Math.abs(delta) < 0.0001) {
          return { message: "No variance detected.", delta: 0 };
        }

        const absCost = round2(Math.abs(delta) * unitCost);

        await client.query(`UPDATE tce_inventory SET quantity = $1 WHERE id = $2`, [
          newQty,
          inventoryId,
        ]);

        const expenseAcc = action === "WASTE" ? "5130" : "5140";
        const lines =
          delta < 0
            ? [
                { accountCode: expenseAcc, debit: absCost, memo: `${action}: ${inv.name}` },
                { accountCode: "1140", credit: absCost, memo: `Inventory reduction: ${inv.name}` },
              ]
            : [
                { accountCode: "1140", debit: absCost, memo: `Stock-take surplus: ${inv.name}` },
                { accountCode: expenseAcc, credit: absCost, memo: `Variance gain: ${inv.name}` },
              ];

        let jeId = null;
        if (absCost > 0) {
          const je = await postJournalEntry(client, {
            entryDate,
            referenceType: action === "WASTE" ? "WASTE" : "STOCK_ADJ",
            referenceId: inventoryId,
            description: `${action}: ${inv.name} (${delta > 0 ? "+" : ""}${delta.toFixed(3)} ${inv.unit}) - ${reason || "Kitchen log"}`,
            createdBy,
            lines,
          });
          jeId = je.id;
        }

        await client.query(
          `INSERT INTO tce_stock_movements
            (id, inventory_id, movement_type, quantity_delta, unit, unit_cost, total_cost, reference_id, reason, journal_entry_id, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            `SM-${Date.now()}`,
            inventoryId,
            action === "WASTE" ? "WASTE" : "STOCK_TAKE_VARIANCE",
            delta,
            inv.unit,
            unitCost,
            absCost,
            jeId,
            reason || action,
            jeId,
            createdBy,
          ]
        );

        return { journalEntryId: jeId, delta, newQty, varianceCost: absCost };
      });
      return NextResponse.json(result, { status: 201 });
    }

    if (action === "SAVE_RECIPE") {
      const { id, dish_name, portion = "Regular", packaging_cost = 0, utility_rate_pct = 5, ingredients = [] } = body;
      const result = await withTransaction(async (client) => {
        const recipeId = id || `REC-${Date.now()}`;
        await client.query(
          `INSERT INTO tce_recipes (id, dish_name, portion, packaging_cost, utility_rate_pct)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (id) DO UPDATE SET
             dish_name = EXCLUDED.dish_name,
             portion = EXCLUDED.portion,
             packaging_cost = EXCLUDED.packaging_cost,
             utility_rate_pct = EXCLUDED.utility_rate_pct`,
          [recipeId, dish_name, portion, packaging_cost, utility_rate_pct]
        );
        await client.query(`DELETE FROM tce_recipe_ingredients WHERE recipe_id = $1`, [recipeId]);
        for (const ing of ingredients) {
          await client.query(
            `INSERT INTO tce_recipe_ingredients
              (recipe_id, inventory_id, ingredient_name, recipe_qty, recipe_unit, unit_cost_override)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              recipeId,
              ing.inventory_id || null,
              ing.ingredient_name,
              Number(ing.recipe_qty),
              ing.recipe_unit,
              ing.unit_cost_override ?? null,
            ]
          );
        }
        return { recipeId };
      });
      return NextResponse.json(result, { status: 201 });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      sku,
      category,
      unit,
      quantity,
      par_level,
      unit_cost,
      supplier,
      storage_location,
      expiration_date,
    } = body;

    if (!id || !name) {
      return NextResponse.json({ error: "Ingredient id and name are required" }, { status: 400 });
    }

    const pool = getPool();
    const res = await pool.query(
      `UPDATE tce_inventory
       SET name = $1,
           sku = COALESCE($2, sku),
           category = COALESCE($3, category),
           unit = COALESCE($4, unit),
           quantity = COALESCE($5, quantity),
           par_level = COALESCE($6, par_level),
           unit_cost = COALESCE($7, unit_cost),
           supplier = $8,
           storage_location = COALESCE($9, storage_location),
           expiration_date = $10
       WHERE id = $11
       RETURNING *`,
      [
        name.trim(),
        sku || null,
        category || null,
        unit || null,
        quantity !== undefined ? Number(quantity) : null,
        par_level !== undefined ? Number(par_level) : null,
        unit_cost !== undefined ? Number(unit_cost) : null,
        supplier || null,
        storage_location || null,
        expiration_date || null,
        id,
      ]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Ingredient not found" }, { status: 404 });
    }
    return NextResponse.json(res.rows[0]);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const inventoryId = searchParams.get("inventoryId");
    const recipeId = searchParams.get("recipeId");
    const pool = getPool();

    if (inventoryId) {
      await pool.query(`DELETE FROM tce_inventory WHERE id = $1`, [inventoryId]);
      return NextResponse.json({ success: true });
    }
    if (recipeId) {
      await pool.query(`DELETE FROM tce_recipes WHERE id = $1`, [recipeId]);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Missing inventoryId or recipeId" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
