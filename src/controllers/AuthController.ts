// src/controllers/AuthController.ts
import { supabase } from '@/services/SupabaseClient';
import { isEmail, isStrongPassword } from '@/utils/valitations';

export async function loginWithEmail(email: string, password: string) {
    // Validaciones de RF-02
    if (!isEmail(email)) {
        throw new Error('Correo no válido');
    }
    if (!isStrongPassword(password)) {
        throw new Error('La contraseña no cumple los requisitos');
    }

    const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
    });

    if (error) {
        // Mensaje genérico para no filtrar si el correo existe o no
        throw new Error('Correo o contraseña incorrectos');
    }
}