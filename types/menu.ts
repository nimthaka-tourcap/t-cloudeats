export type SpiceLevel = "mild" | "medium" | "spicy" | "extra-spicy";

export interface MenuItem {
  id: number;
  title: string;
  category: string;
  price: number;
  description?: string;
  image?: string;
  code?: string;
  available?: boolean;
  serves?: number;
  isPopular?: boolean;
  isBestSeller?: boolean;
  spiceLevel?: SpiceLevel;
  tags?: string[];
  seq_no?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  count?: number;
}
