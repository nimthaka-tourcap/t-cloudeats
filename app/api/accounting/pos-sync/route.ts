import { NextResponse } from "next/server";
import { getPool, withTransaction } from "@/lib/db";
import { postJournalEntry, reverseJournalEntry } from "@/lib/accounting/ledger";
import { decomposeTaxInclusiveSale, AccountingSettings } from "@/lib/accounting/tax";
import { computeIngredientCost } from "@/lib/accounting/units";
import { round2, todayISO } from "@/lib/accounting/format";

export async function GET() {
  try {
    const pool = getPool();
    const res = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM tce_orders WHERE LOWER(COALESCE(status, '')) NOT IN ('voided', 'cancelled', 'ignored')) AS total_valid_orders,
        (SELECT COUNT(DISTINCT reference_id) FROM tce_journal_entries WHERE reference_type = 'POS_SALE' AND status = 'POSTED') AS posted_orders
    `);
    const total = Number(res.rows[0].total_valid_orders || 0);
    const posted = Number(res.rows[0].posted_orders || 0);
    return NextResponse.json({
      totalValidOrders: total,
      postedOrders: posted,
      unpostedOrders: Math.max(0, total - posted),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const limit = Math.min(Number(body.limit || 200), 1000);
    const userId = body.userId || "POS_SYNC";

    const result = await withTransaction(async (client) => {
      const settingsRes = await client.query(
        `SELECT * FROM tce_accounting_settings WHERE id = 'DEFAULT'`
      );
      const settings: AccountingSettings = settingsRes.rows[0];

      // Find unposted valid orders (excluding voided, cancelled, ignored)
      const ordersRes = await client.query(
        `SELECT o.*
         FROM tce_orders o
         LEFT JOIN tce_journal_entries je
           ON je.reference_type = 'POS_SALE' AND je.reference_id = o.id
         WHERE je.id IS NULL
           AND LOWER(COALESCE(o.status, '')) NOT IN ('voided', 'cancelled', 'ignored')
         ORDER BY o.timestamp ASC
         LIMIT $1`,
        [limit]
      );

      // Preload recipes & inventory for theoretical COGS deduction
      const recipesRes = await client.query(`
        SELECT r.*, ri.inventory_id, ri.ingredient_name, ri.recipe_qty, ri.recipe_unit, ri.unit_cost_override,
               inv.unit AS inv_unit, inv.unit_cost AS inv_unit_cost
        FROM tce_recipes r
        LEFT JOIN tce_recipe_ingredients ri ON ri.recipe_id = r.id
        LEFT JOIN tce_inventory inv ON inv.id = ri.inventory_id
      `);

      const recipeMap = new Map<string, { packagingCost: number; ingredients: any[] }>();
      for (const row of recipesRes.rows) {
        const key = (row.dish_name || "").trim().toUpperCase();
        if (!recipeMap.has(key)) {
          recipeMap.set(key, {
            packagingCost: Number(row.packaging_cost || 0),
            ingredients: [],
          });
        }
        if (row.ingredient_name) {
          recipeMap.get(key)!.ingredients.push(row);
        }
      }

      let syncedCount = 0;
      let totalGrossPosted = 0;
      let totalCogsPosted = 0;

      for (const order of ordersRes.rows) {
        const orderDate = new Date(order.timestamp || Date.now())
          .toISOString()
          .slice(0, 10);
        const subtotal = round2(Number(order.subtotal || 0));
        const total = round2(Number(order.total || 0));
        const cust = order.customer || {};
        const orderType = (order.type || "").toUpperCase();
        const paymentMethod = (cust.payment_method || "").toUpperCase();
        const custName = (cust.name || "").toUpperCase();

        if (subtotal <= 0 && total <= 0) continue;

        const isThirdParty =
          orderType === "3RD PARTY" ||
          orderType === "UBER_EATS" ||
          orderType === "PICKME" ||
          custName.includes("UBER") ||
          custName.includes("PICKME");

        const lines: { accountCode: string; debit?: number; credit?: number; memo?: string }[] = [];

        if (isThirdParty) {
          const isPickMe =
            orderType === "PICKME" ||
            custName.includes("PICKME") ||
            (subtotal > 0 && Math.abs(1 - total / subtotal - 0.22) < 0.04);

          const grossOrderVal = subtotal > 0 ? subtotal : total;
          const netReceivable = total > 0 && total <= grossOrderVal ? total : round2(grossOrderVal * (1 - (isPickMe ? Number(settings.pickme_commission_rate) : Number(settings.uber_commission_rate))));
          const commission = round2(grossOrderVal - netReceivable);

          const taxSplit = decomposeTaxInclusiveSale(grossOrderVal, settings);

          lines.push({
            accountCode: isPickMe ? "1131" : "1130",
            debit: netReceivable,
            memo: `${isPickMe ? "PickMe Food" : "Uber Eats"} net receivable`,
          });
          if (commission > 0) {
            lines.push({
              accountCode: "6200",
              debit: commission,
              memo: `${isPickMe ? "PickMe" : "Uber Eats"} marketplace commission`,
            });
          }
          lines.push({
            accountCode: isPickMe ? "4121" : "4120",
            credit: taxSplit.taxExclusiveRevenue,
            memo: `Gross ${isPickMe ? "PickMe" : "Uber Eats"} sales`,
          });
          if (taxSplit.vatAmount > 0) {
            lines.push({ accountCode: "2140", credit: taxSplit.vatAmount, memo: "Output VAT (18%)" });
          }
          if (taxSplit.ssclAmount > 0) {
            lines.push({ accountCode: "2145", credit: taxSplit.ssclAmount, memo: "SSCL (2.5%)" });
          }
          totalGrossPosted = round2(totalGrossPosted + grossOrderVal);
        } else {
          // Direct sale (Take Away, Delivery, Dine In, POS)
          const grossBeforeDiscount = Math.max(subtotal, total);
          const discountAmt = round2(Math.max(0, grossBeforeDiscount - total));
          const taxSplit = decomposeTaxInclusiveSale(total, settings);

          const isBankOrCard =
            paymentMethod.includes("CARD") ||
            paymentMethod.includes("HELAPOS") ||
            paymentMethod.includes("BANK") ||
            paymentMethod.includes("ONLINE") ||
            paymentMethod.includes("PICKME PAY");

          const debitAccount = isBankOrCard ? "1120" : "1110";

          lines.push({
            accountCode: debitAccount,
            debit: total,
            memo: `Direct POS receipt (${cust.payment_method || "Cash"})`,
          });
          if (discountAmt > 0) {
            lines.push({
              accountCode: "4900",
              debit: discountAmt,
              memo: "Order discount",
            });
          }
          lines.push({
            accountCode: "4110",
            credit: round2(taxSplit.taxExclusiveRevenue + discountAmt),
            memo: "Direct kitchen sales (tax-exclusive)",
          });
          if (taxSplit.vatAmount > 0) {
            lines.push({ accountCode: "2140", credit: taxSplit.vatAmount, memo: "Output VAT (18%)" });
          }
          if (taxSplit.ssclAmount > 0) {
            lines.push({ accountCode: "2145", credit: taxSplit.ssclAmount, memo: "SSCL (2.5%)" });
          }
          totalGrossPosted = round2(totalGrossPosted + total);
        }

        // Theoretical COGS from recipes if mapped
        let orderFoodCogs = 0;
        let orderPkgCogs = 0;
        const items = Array.isArray(order.items) ? order.items : [];
        for (const item of items) {
          const qty = Number(item.quantity || 1);
          const titleKey = (item.title || "").trim().toUpperCase();
          const recipe = recipeMap.get(titleKey);
          if (recipe) {
            orderPkgCogs = round2(orderPkgCogs + recipe.packagingCost * qty);
            for (const ing of recipe.ingredients) {
              const unitCost = Number(ing.unit_cost_override ?? ing.inv_unit_cost ?? 0);
              const invUnit = ing.inv_unit || ing.recipe_unit;
              const calc = computeIngredientCost(
                Number(ing.recipe_qty) * qty,
                ing.recipe_unit,
                unitCost,
                invUnit
              );
              orderFoodCogs = round2(orderFoodCogs + calc.cost);

              // Deduct perpetual inventory if linked
              if (ing.inventory_id && calc.qtyInInventoryUnit > 0) {
                await client.query(
                  `UPDATE tce_inventory SET quantity = GREATEST(0, quantity - $1) WHERE id = $2`,
                  [calc.qtyInInventoryUnit, ing.inventory_id]
                );
                await client.query(
                  `INSERT INTO tce_stock_movements
                    (id, inventory_id, movement_type, quantity_delta, unit, unit_cost, total_cost, reference_id, reason, created_by)
                   VALUES ($1, $2, 'SALE_DEDUCTION', $3, $4, $5, $6, $7, $8, $9)`,
                  [
                    `SM-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    ing.inventory_id,
                    -calc.qtyInInventoryUnit,
                    invUnit,
                    unitCost,
                    calc.cost,
                    order.id,
                    `POS order ${order.id} (${item.title})`,
                    userId,
                  ]
                );
              }
            }
          }
        }

        if (orderFoodCogs > 0) {
          lines.push({ accountCode: "5110", debit: orderFoodCogs, memo: "Theoretical food COGS" });
          lines.push({ accountCode: "1140", credit: orderFoodCogs, memo: "Raw inventory deduction" });
          totalCogsPosted = round2(totalCogsPosted + orderFoodCogs);
        }
        if (orderPkgCogs > 0) {
          lines.push({ accountCode: "5120", debit: orderPkgCogs, memo: "Packaging COGS" });
          lines.push({ accountCode: "1150", credit: orderPkgCogs, memo: "Packaging inventory deduction" });
          totalCogsPosted = round2(totalCogsPosted + orderPkgCogs);
        }

        await postJournalEntry(client, {
          entryDate: orderDate,
          referenceType: "POS_SALE",
          referenceId: order.id,
          description: `POS Sale ${order.id} (${order.type || "Direct"})`,
          createdBy: userId,
          lines,
        });

        syncedCount++;
      }

      // Auto-reverse any POSTED POS_SALE journals whose order was subsequently Voided/Cancelled/Ignored
      const voidedRes = await client.query(`
        SELECT je.id
        FROM tce_journal_entries je
        JOIN tce_orders o ON o.id = je.reference_id
        WHERE je.reference_type = 'POS_SALE'
          AND je.status = 'POSTED'
          AND LOWER(COALESCE(o.status, '')) IN ('voided', 'cancelled', 'ignored')
      `);

      let reversedCount = 0;
      for (const row of voidedRes.rows) {
        await reverseJournalEntry(
          client,
          row.id,
          "POS Order Voided / Cancelled",
          userId,
          todayISO()
        );
        reversedCount++;
      }

      return { syncedCount, reversedCount, totalGrossPosted, totalCogsPosted };
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
