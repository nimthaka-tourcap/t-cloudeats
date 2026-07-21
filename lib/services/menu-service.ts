import { supabase } from "../supabase/client";
import { MenuItem } from "@/types/menu";

export async function fetchMenuItems(): Promise<MenuItem[]> {
  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .order("seq_no", { ascending: true, nullsFirst: false });

  if (error) {
    console.error("Error fetching menu items:", error);
    return [];
  }

  return data as MenuItem[];
}

export async function updateMenuItemAvailability(id: number, available: boolean): Promise<boolean> {
  const { error } = await supabase
    .from("menu_items")
    .update({ available, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error(`Error updating menu item ${id} availability:`, error);
    return false;
  }

  return true;
}
