import { ref, computed } from "vue";
import { fetchAvailableProducts, fetchMenuLinks, fetchCategories } from "@/models/products";
import type { Product } from "@/models/types";

const ORDER = ['Personales', 'Dobles', 'Para 3', 'Para 4', 'Para 7–8', 'Desgranados', 'Nachos'];

const normalizeCat = (s: string) =>
    (s || "")
        .replace("7-8", "7–8").replace("7 – 8", "7–8")
        .toLowerCase().replace(/(^|\s)\S/g, t => t.toUpperCase());

export function useCatalog() {
    const productos = ref<Product[]>([]);
    const catNameByProductId = ref<Map<number, string>>(new Map());
    const error = ref<string>(""); const loading = ref(false);

    async function load() {
        loading.value = true; error.value = "";
        try {
            const [prods, links, cats] = await Promise.all([
                fetchAvailableProducts(), fetchMenuLinks(), fetchCategories()
            ]);
            const catMap = new Map(cats.map(c => [c.id, c.name]));
            const map = new Map<number, string>();
            for (const l of links) {
                const name = catMap.get(l.category_id);
                if (name) map.set(l.product_id, normalizeCat(name));
            }
            productos.value = prods;
            catNameByProductId.value = map;
        } catch (e: any) {
            error.value = e?.message || "Error cargando catálogo";
        } finally {
            loading.value = false;
        }
    }

    const grupos = computed(() => {
        const g = new Map<string, Product[]>();
        for (const p of productos.value) {
            const byLink = catNameByProductId.value.get(p.id) || "";
            const inferred =
                p.name.toLowerCase().includes("personal") ? "Personales" :
                    p.name.toLowerCase().includes("doble") ? "Dobles" :
                        p.name.toLowerCase().includes("para 3") ? "Para 3" :
                            p.name.toLowerCase().includes("para 4") ? "Para 4" :
                                /7( ?[–-] ?8)/.test(p.name.toLowerCase()) ? "Para 7–8" :
                                    p.name.toLowerCase().includes("desgran") ? "Desgranados" :
                                        p.name.toLowerCase().includes("nacho") ? "Nachos" : "";
            const cat = normalizeCat(byLink || inferred);
            if (!g.has(cat)) g.set(cat, []);
            g.get(cat)!.push(p);
        }
        const list: any[] = [];
        for (const n of ORDER) { const items = g.get(n) || []; if (items.length) list.push({ nombre: n, items }); }
        for (const [n, items] of g) if (!ORDER.includes(n) && items.length) list.push({ nombre: n, items });
        return list;
    });

    return { load, productos, grupos, error, loading };
}