import { fetchAdditions } from "@/models/additions";

export async function getAdditions() {
    try {
        const data = await fetchAdditions();
        return { data, error: null as any };
    } catch (error: any) {
        console.error("Error obteniendo adiciones:", error?.message || error);
        return { data: null, error };
    }
}