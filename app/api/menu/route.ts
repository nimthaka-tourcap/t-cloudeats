import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { syncMenuAcrossPlatforms } from "@/lib/sync";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, price, category, portion, image, sku } = body;

    if (!title || !price || !category || !portion) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("menu_items")
      .insert([{ title, price: Number(price), category, portion, image, sku }])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Trigger background sync across platforms
    syncMenuAcrossPlatforms();

    return NextResponse.json(data[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, title, price, category, portion, image, sku } = body;

    if (!id || !title || !price || !category || !portion) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("menu_items")
      .update({ title, price: Number(price), category, portion, image, sku })
      .eq("id", id)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Trigger background sync across platforms
    syncMenuAcrossPlatforms();

    return NextResponse.json(data[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("menu_items")
      .delete()
      .eq("id", Number(id))
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Trigger background sync across platforms
    syncMenuAcrossPlatforms();

    return NextResponse.json({ success: true, message: "Item deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
