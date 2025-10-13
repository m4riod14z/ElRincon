import { supabase } from "@/services/SupabaseClient";
import type { Product } from "./types";

export async function fetchAvailableProducts(): Promise<Product[]> {
    const { data, error } = await supabase
        .from("products")
        .select("id,name,description,price,image_url,available,category")
        .eq("available", true)
        .order("id", { ascending: true });

    if (error) throw error;
    return (data ?? []) as Product[];
}