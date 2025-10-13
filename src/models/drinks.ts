import { supabase } from "@/services/SupabaseClient";
import type { OptionRow } from "./types";

export async function fetchDrinks(): Promise<OptionRow[]> {
    const { data, error } = await supabase
        .from("drinks")
        .select("id,name,price,available")
        .eq("available", true)
        .order("name", { ascending: true });

    if (error) throw error;
    return (data ?? []) as OptionRow[];
}