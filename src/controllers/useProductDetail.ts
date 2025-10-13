import { ref, computed } from "vue";
import { fetchAdditions } from "@/models/additions";
import { fetchDrinks } from "@/models/drinks";
import type { OptionRow } from "@/models/types";

export function useProductDetail(basePriceRef: { value: number }) {
    const additions = ref<OptionRow[]>([]);
    const drinks = ref<OptionRow[]>([]);
    const loadedAdd = ref(false);
    const loadedDri = ref(false);

    const selectedAdditionId = ref<number | null>(null);
    const selectedDrinkId = ref<number | null>(null);

    const selectedAddition = computed<OptionRow | null>(
        () => additions.value.find(a => a.id === selectedAdditionId.value) || null
    );
    const selectedDrink = computed<OptionRow | null>(
        () => drinks.value.find(d => d.id === selectedDrinkId.value) || null
    );

    const total = computed<number>(() => {
        const base = Number(basePriceRef.value || 0);
        const add = Number(selectedAddition.value?.price || 0);
        const dri = Number(selectedDrink.value?.price || 0);
        return base + add + dri;
    });

    function clearSelections() {
        selectedAdditionId.value = null;
        selectedDrinkId.value = null;
    }

    async function loadAdditionsOnce() {
        if (loadedAdd.value) return;
        const list = await fetchAdditions();
        additions.value = list;
        loadedAdd.value = true;
    }

    async function loadDrinksOnce() {
        if (loadedDri.value) return;
        const list = await fetchDrinks();
        drinks.value = list;
        loadedDri.value = true;
    }

    return {
        additions,
        drinks,
        selectedAdditionId,
        selectedDrinkId,
        selectedAddition,
        selectedDrink,
        total,
        loadAdditionsOnce,
        loadDrinksOnce,
        clearSelections,
    };
}