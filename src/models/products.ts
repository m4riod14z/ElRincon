import { supabase } from "@/services/SupabaseClient";
import type { Product, Category, MenuItemLink } from "./types";

export async function fetchAvailableProducts(): Promise<Product[]> {
    const { data, error } = await supabase
        .from("products")
        .select("id,name,description,price,image_url,available")
        .eq("available", true)
        .order("id", { ascending: true });

    if (error) throw error;
    return (data ?? []) as Product[];
}

export async function fetchMenuLinks(): Promise<MenuItemLink[]> {
    const { data, error } = await supabase
        .from("menu_items")
        .select("product_id,category_id");

    if (error) throw error;
    return (data ?? []) as MenuItemLink[];
}

export async function fetchCategories(): Promise<Category[]> {
    const { data, error } = await supabase
        .from("categories")
        .select("id,name")
        .order("id", { ascending: true });

    if (error) throw error;
    return (data ?? []) as Category[];
}