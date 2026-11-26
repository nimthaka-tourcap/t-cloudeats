import { NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      sourceTitles,
      newTitle,
      newPrice,
      category,
      portion,
      unifyHistoricalOrders = true,
    } = body;

    if (!Array.isArray(sourceTitles) || sourceTitles.length < 2) {
      return NextResponse.json(
        { error: "Select at least 2 dishes to merge." },
        { status: 400 }
      );
    }
    if (!newTitle || !newTitle.trim() || newPrice === undefined || Number(newPrice) < 0) {
      return NextResponse.json(
        { error: "New unified dish name and valid price are required." },
        { status: 400 }
      );
    }

    const cleanNewTitle = newTitle.trim();
    const cleanPrice = Number(newPrice);
    const upperSources = new Set(sourceTitles.map((t: string) => t.trim().toUpperCase()));

    const result = await withTransaction(async (client) => {
      // 1. Find matching tce_menu_items
      const menuRes = await client.query(
        `SELECT * FROM tce_menu_items ORDER BY id ASC`
      );
      const matchingMenu = menuRes.rows.filter((m) =>
        upperSources.has((m.title || "").trim().toUpperCase())
      );

      let primaryMenuId: number | null = null;
      let removedMenuCount = 0;

      if (matchingMenu.length > 0) {
        const primary = matchingMenu[0];
        primaryMenuId = primary.id;
        await client.query(
          `UPDATE tce_menu_items
           SET title = $1, price = $2, category = COALESCE($3, category), portion = COALESCE($4, portion)
           WHERE id = $5`,
          [cleanNewTitle, cleanPrice, category || null, portion || null, primary.id]
        );
        const dupIds = matchingMenu.slice(1).map((m) => m.id);
        if (dupIds.length > 0) {
          await client.query(`DELETE FROM tce_menu_items WHERE id = ANY($1::int[])`, [dupIds]);
          removedMenuCount = dupIds.length;
        }
      } else {
        const ins = await client.query(
          `INSERT INTO tce_menu_items (title, price, category, portion)
           VALUES ($1, $2, $3, $4) RETURNING id`,
          [cleanNewTitle, cleanPrice, category || "Fried Rice", portion || "Regular"]
        );
        primaryMenuId = ins.rows[0].id;
      }

      // 2. Preserve/update tce_recipes links
      const recRes = await client.query(`SELECT id, dish_name FROM tce_recipes`);
      let recipesUpdated = 0;
      for (const r of recRes.rows) {
        if (upperSources.has((r.dish_name || "").trim().toUpperCase())) {
          await client.query(`UPDATE tce_recipes SET dish_name = $1 WHERE id = $2`, [
            cleanNewTitle,
            r.id,
          ]);
          recipesUpdated++;
        }
      }

      // 3. Optionally unify historical order item titles WITHOUT touching subtotal/tax/total
      let ordersUpdated = 0;
      if (unifyHistoricalOrders) {
        const ordersRes = await client.query(`SELECT id, items FROM tce_orders`);
        for (const o of ordersRes.rows) {
          if (!Array.isArray(o.items)) continue;
          let changed = false;
          const nextItems = o.items.map((item: any) => {
            const t = (item.menuItem?.title || item.title || "").trim().toUpperCase();
            if (upperSources.has(t)) {
              changed = true;
              const updated = { ...item };
              if (updated.title !== undefined) updated.title = cleanNewTitle;
              if (updated.menuItem) {
                updated.menuItem = { ...updated.menuItem, title: cleanNewTitle };
              }
              return updated;
            }
            return item;
          });
          if (changed) {
            await client.query(`UPDATE tce_orders SET items = $1::jsonb WHERE id = $2`, [
              JSON.stringify(nextItems),
              o.id,
            ]);
            ordersUpdated++;
          }
        }
      }

      return { primaryMenuId, removedMenuCount, recipesUpdated, ordersUpdated };
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
