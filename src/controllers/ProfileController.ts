import { supabase } from "@/services/SupabaseClient";

export type UserRole = 'client' | 'admin' | 'restaurant';

export async function getCurrentUserRole(): Promise<UserRole | null> {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error("No se encontró el usuario autenticado");
    }

    const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (error) {
        console.error("Error obteniendo rol:", error.message);
        return null;
    }

    return data?.role as UserRole || null;
}

export async function createOrUpdateProfile(payload: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
}) {
    // Asegurarse de preservar el rol existente o usar 'client' como valor por defecto
    const { data: existing } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", payload.id)
        .single();

    const role = existing?.role || 'client';

    const { error } = await supabase
        .from("profiles")
        .upsert({
            ...payload,
            role
        }, {
            onConflict: 'id'
        });

    if (error) {
        throw error;
    }
}

/**
 * Asegura que exista una fila en `profiles` para el usuario autenticado.
 * Si no existe, crea una con rol 'client' por defecto.
 */
export async function ensureProfileRow() {
    const { data: ures, error: uerr } = await supabase.auth.getUser();
    if (uerr || !ures.user) return;
    const user = ures.user;

    const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

    if (!existing) {
        await supabase
            .from('profiles')
            .upsert({
                id: user.id,
                first_name: '',
                last_name: '',
                email: user.email ?? '',
                phone: '',
                role: 'client'
            }, { onConflict: 'id' })
    }
}
