import { ref, computed } from "vue";
import { getAdditions } from "@/controllers/AdditionsController";
import { getDrinks } from "@/controllers/DrinksController";
import type { OptionRow } from "@/models/types";

export function useProductDetail(basePrice: { value: number }) {
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
        (basePrice.value || 0) +
        (selectedAddition.value?.price || 0) +
        (selectedDrink.value?.price || 0)
    );

    async function loadAdditionsOnce() {
        if (additions.value.length) return;
        const { data, error } = await getAdditions();
        if (!error && data) additions.value = data;
    }

    async function loadDrinksOnce() {
        if (drinks.value.length) return;
        const { data, error } = await getDrinks();
        if (!error && data) drinks.value = data;
    }

    function clearSelections() {
        selectedAdditionId.value = null;
        selectedDrinkId.value = null;
    }

    return {
        additions, drinks,
        selectedAdditionId, selectedDrinkId,
        selectedAddition, selectedDrink, total,
        loadAdditionsOnce, loadDrinksOnce, clearSelections,
    };
}