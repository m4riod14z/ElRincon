import { fetchDrinks } from "@/models/drinks";

export async function getDrinks() {
    try {
        const data = await fetchDrinks();
        return { data, error: null as any };
    } catch (error: any) {
        console.error("Error obteniendo bebidas:", error?.message || error);
        return { data: null, error };
    }
}