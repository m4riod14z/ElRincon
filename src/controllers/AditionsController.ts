import { supabase } from "@/services/SupabaseClient";

export async function getAditions() {
    const { data, error } = await supabase
        .from("additions")
        .select("*")
    return { data, error };
}