import { supabase } from "@/services/SupabaseClient";

export async function getCurrentUserRole(): Promise<string | null> {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error("No se encontró el usuario autenticado");
    }

    // 2. consultar la tabla profiles
    const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (error) {
        console.error("Error obteniendo rol:", error.message);
        return null;
    }

    return data?.role || null;
}