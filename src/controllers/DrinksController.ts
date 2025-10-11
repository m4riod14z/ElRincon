// src/controllers/DrinksController.ts
import { supabase } from "@/services/SupabaseClient";

export async function getDrinks() {
    const { data, error } = await supabase
        .from("drinks")
        .select("*")
        .eq("available", true)
        .order("name", { ascending: true });

    return { data, error };
}