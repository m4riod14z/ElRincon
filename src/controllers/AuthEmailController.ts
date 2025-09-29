import { supabase } from "@/services/SupabaseClient";
import { isEmail, isNotEmpty } from "@/utils/validatorsLogin";

export async function loginWithEmail(email: string, password: string) {
    if (!isNotEmpty(email)) throw new Error('Ingresa tu correo');
    if (!isEmail(email)) throw new Error('Ingresa un correo válido');
    if (!isNotEmpty(password)) throw new Error('Ingresa tu contraseña');

    const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
    });

    if (error) {
        throw new Error('Correo o contraseña incorrectos');
    }
}