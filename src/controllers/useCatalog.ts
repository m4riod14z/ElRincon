import { ref, computed } from "vue";
import { fetchAvailableProducts } from "@/models/products";
import type { Product } from "@/models/types";

const ORDER = ["Personales", "Dobles", "Para 3", "Para 4", "Para 7–8", "Desgranados", "Nachos"];

const normalizeCat = (s: string) =>
    (s || "")
        .replace("7-8", "7–8").replace("7 – 8", "7–8")
        .toLowerCase()
        .replace(/(^|\s)\S/g, t => t.toUpperCase());

const inferFromName = (name: string) => {
    const n = (name || "").toLowerCase();
    if (n.includes("personal")) return "Personales";
    if (n.includes("doble")) return "Dobles";
    if (n.includes("para 3")) return "Para 3";
    if (n.includes("para 4")) return "Para 4";
    if (n.includes("7–8") || n.includes("7-8") || n.includes("7 – 8")) return "Para 7–8";
    if (n.includes("desgran")) return "Desgranados";
    if (n.includes("nacho")) return "Nachos";
    return "Otros";
};

export function useCatalog() {
    const productos = ref<Product[]>([]);
    const error = ref("");
    const loading = ref(false);

    async function load() {
        loading.value = true;
        error.value = "";
        try {
            const prods = await fetchAvailableProducts();
            productos.value = prods.map(p => ({
                ...p,
                image_url: p.image_url || "/Logo.png",
            }));
        } catch (e: any) {
            console.error(e);
            error.value = e?.message || "Error cargando catálogo";
            productos.value = [];
        } finally {
            loading.value = false;
        }
    }

    const grupos = computed(() => {
        const g = new Map<string, Product[]>();
        for (const p of productos.value) {
            // usa category si existe; si no, infiere por nombre
            const cat = normalizeCat(p.category || inferFromName(p.name));
            if (!g.has(cat)) g.set(cat, []);
            g.get(cat)!.push(p);
        }

        const list: Array<{ nombre: string; items: Product[] }> = [];
        for (const name of ORDER) {
            const items = g.get(name) || [];
            if (items.length) list.push({ nombre: name, items });
        }
        for (const [name, items] of g) {
            if (!ORDER.includes(name) && items.length) list.push({ nombre: name, items });
        }
        return list;
    });

    return { load, productos, grupos, error, loading };
}