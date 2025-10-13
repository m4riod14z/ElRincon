import { ref, computed } from "vue";
import { fetchAdditions } from "@/models/additions";
import { fetchDrinks } from "@/models/drinks";
import type { OptionRow } from "@/models/types";

export function useProductDetail(basePriceRef: { value: number }) {
    const additions = ref<OptionRow[]>([]);
    const drinks = ref<OptionRow[]>([]);
    const selectedAdditionId = ref<number | null>(null);
    const selectedDrinkId = ref<number | null>(null);

    const selectedAddition = computed(() =>
        additions.value.find(a => a.id === selectedAdditionId.value) || null
    );
    const selectedDrink = computed(() =>
        drinks.value.find(d => d.id === selectedDrinkId.value) || null
    );
    const total = computed(() =>
        (basePriceRef.value || 0) + (selectedAddition.value?.price || 0) + (selectedDrink.value?.price || 0)
    );

    async function loadAdditionsOnce() { if (!additions.value.length) additions.value = await fetchAdditions(); }
    async function loadDrinksOnce() { if (!drinks.value.length) drinks.value = await fetchDrinks(); }
    function clearAddition() { selectedAdditionId.value = null; }
    function clearDrink() { selectedDrinkId.value = null; }

    return {
        additions, drinks,
        selectedAdditionId, selectedDrinkId,
        selectedAddition, selectedDrink, total,
        loadAdditionsOnce, loadDrinksOnce,
        clearAddition, clearDrink,
    };
}