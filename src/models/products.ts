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

export async function fetchAllProducts(): Promise<Product[]> {
    const { data, error } = await supabase
        .from("products")
        .select("id,name,description,price,image_url,available,category")
        .order("id", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Product[];
}

export async function upsertProduct(payload: Partial<Product> & { name: string; price: number }) {
    const { data, error } = await supabase
        .from("products")
        .upsert(payload, { onConflict: "id" })
        .select()
        .single();
    if (error) throw error;
    return data as Product;
}

export async function deleteProductById(id: number) {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;
}

export async function setProductAvailability(id: number, available: boolean) {
    const { error } = await supabase.from("products").update({ available }).eq("id", id);
    if (error) throw error;
}
