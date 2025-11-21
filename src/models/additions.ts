import { supabase } from "@/services/SupabaseClient";
import type { OptionRow } from "./types";

export async function fetchAdditions(): Promise<OptionRow[]> {
    const { data, error } = await supabase
        .from("additions")
        .select("id,name,price,available,image_url")
        .eq("available", true)
        .order("name", { ascending: true });

    if (error) throw error;
    return (data ?? []) as OptionRow[];
}

export async function fetchAllAdditions(): Promise<OptionRow[]> {
    const { data, error } = await supabase
        .from("additions")
        .select("id,name,price,available,image_url")
        .order("name", { ascending: true });
    if (error) throw error;
    return (data ?? []) as OptionRow[];
}

export async function upsertAddition(payload: Partial<OptionRow> & { name: string; price: number }) {
    const { data, error } = await supabase
        .from("additions")
        .upsert(payload, { onConflict: "id" })
        .select()
        .single();
    if (error) throw error;
    return data as OptionRow;
}

export async function deleteAdditionById(id: number) {
    const { error } = await supabase.from("additions").delete().eq("id", id);
    if (error) throw error;
}

export async function setAdditionAvailability(id: number, available: boolean) {
    const { error } = await supabase.from("additions").update({ available }).eq("id", id);
    if (error) throw error;
}
