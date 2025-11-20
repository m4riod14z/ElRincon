import { ref, computed, watch } from "vue";
import type { CartItem, CartAddition, CartDrink, CartSnapshot, CartExtraDrink, CartExtraAddition } from "@/models/cart";
import { makeCartUID } from "@/models/cart";
import { supabase } from "@/services/SupabaseClient";

// Namespace cart by user to avoid leaking items across accounts
const STORAGE_PREFIX = "cart:v1:";
let currentKey = STORAGE_PREFIX + "guest";

const items = ref<CartItem[]>([]);
const shipping = ref<number>(0);
const extraDrinks = ref<CartExtraDrink[]>([]);
const extraAdditions = ref<CartExtraAddition[]>([]);

function loadFromStorage() {
    try {
        const raw = localStorage.getItem(currentKey);
        if (!raw) return;
        const snap = JSON.parse(raw) as CartSnapshot;
        items.value = Array.isArray(snap.items) ? snap.items : [];
        shipping.value = Number(snap.shipping || 0);
        extraDrinks.value = Array.isArray(snap.extraDrinks) ? snap.extraDrinks : [];
        extraAdditions.value = Array.isArray(snap.extraAdditions) ? snap.extraAdditions : [];
    } catch {
        items.value = [];
        shipping.value = 0;
        extraDrinks.value = [];
        extraAdditions.value = [];
    }
}

function saveToStorage() {
    const snap: CartSnapshot = {
        items: items.value,
        shipping: shipping.value,
        extraDrinks: extraDrinks.value,
        extraAdditions: extraAdditions.value,
    };
    try { localStorage.setItem(currentKey, JSON.stringify(snap)); } catch {}
}

// Resolve initial key based on current auth user, then load
supabase.auth.getUser().then(({ data }) => {
    const uid = data?.user?.id ?? "guest";
    currentKey = STORAGE_PREFIX + uid;
    loadFromStorage();
}).catch(() => {
    currentKey = STORAGE_PREFIX + "guest";
    loadFromStorage();
});

// When auth state changes, switch storage key and load that user's cart
supabase.auth.onAuthStateChange((_event, session) => {
    const uid = session?.user?.id ?? "guest";
    const newKey = STORAGE_PREFIX + uid;
    if (newKey !== currentKey) {
        currentKey = newKey;
        // Load the target user's cart; default to empty if none
        items.value = [];
        shipping.value = 0;
        loadFromStorage();
    }
});
watch([items, shipping, extraDrinks, extraAdditions], saveToStorage, { deep: true });

const subtotalProducts = computed(() =>
    items.value.reduce((acc, it) => acc + it.basePrice * it.qty, 0)
);

const subtotalAdditions = computed(() => {
    const cartAdds = items.value.reduce((acc, it) => acc + (it.addition?.price ?? 0) * it.qty, 0);
    const extrasAdds = extraAdditions.value.reduce((acc, it) => acc + (it.price ?? 0) * it.qty, 0);
    return cartAdds + extrasAdds;
});

const subtotalDrinks = computed(() => {
    const cartDrinkTotal = items.value.reduce((acc, it) => acc + (it.drink?.price ?? 0) * it.qty, 0);
    const extraDrinkTotal = extraDrinks.value.reduce((acc, it) => acc + (it.price ?? 0) * it.qty, 0);
    return cartDrinkTotal + extraDrinkTotal;
});

const subtotal = computed(() =>
    subtotalProducts.value + subtotalAdditions.value + subtotalDrinks.value
);

const total = computed(() => subtotal.value + shipping.value);

const totalQty = computed(() =>
    items.value.reduce((acc, it) => acc + it.qty, 0)
);

function addOrIncrease(payload: {
    productId: number;
    name: string;
    image_url?: string | null;
    basePrice: number;
    addition?: CartAddition | null;
    drink?: CartDrink | null;
    qty?: number;
}) {
    const uid = makeCartUID(payload.productId, payload.addition?.id ?? null, payload.drink?.id ?? null);
    const inc = Math.max(1, Number(payload.qty ?? 1));
    const idx = items.value.findIndex((i) => i.uid === uid);
    if (idx >= 0) {
        items.value[idx].qty += inc;
        return items.value[idx];
    }
    const newItem: CartItem = {
        uid,
        productId: payload.productId,
        name: payload.name,
        image_url: payload.image_url ?? null,
        basePrice: payload.basePrice,
        qty: inc,
        addition: payload.addition ?? null,
        drink: payload.drink ?? null,
    };
    items.value.unshift(newItem);
    return newItem;
}

function decrease(uid: string, amount = 1) {
    const idx = items.value.findIndex((i) => i.uid === uid);
    if (idx === -1) return;
    items.value[idx].qty -= Math.max(1, amount);
    if (items.value[idx].qty <= 0) {
        items.value.splice(idx, 1);
    }
}

function remove(uid: string) {
    const idx = items.value.findIndex((i) => i.uid === uid);
    if (idx === -1) return;
    items.value.splice(idx, 1);
}

function clear() {
    items.value = [];
    extraDrinks.value = [];
    extraAdditions.value = [];
}

function setShipping(value: number) {
    shipping.value = Math.max(0, Number(value) || 0);
}

function addExtraDrink(option: CartDrink, qty: number) {
    const amount = Math.max(1, Number(qty) || 1);
    const idx = extraDrinks.value.findIndex((d) => d.id === option.id);
    if (idx >= 0) {
        extraDrinks.value[idx].qty += amount;
    } else {
        extraDrinks.value.push({ ...option, qty: amount });
    }
}

function updateExtraDrinkQty(id: number, qty: number) {
    const idx = extraDrinks.value.findIndex((d) => d.id === id);
    if (idx === -1) return;
    const amount = Math.max(0, Number(qty) || 0);
    if (amount <= 0) {
        extraDrinks.value.splice(idx, 1);
    } else {
        extraDrinks.value[idx].qty = amount;
    }
}

function removeExtraDrink(id: number) {
    const idx = extraDrinks.value.findIndex((d) => d.id === id);
    if (idx === -1) return;
    extraDrinks.value.splice(idx, 1);
}

function addExtraAddition(option: CartAddition, qty: number) {
    const amount = Math.max(1, Number(qty) || 1);
    const idx = extraAdditions.value.findIndex((d) => d.id === option.id);
    if (idx >= 0) {
        extraAdditions.value[idx].qty += amount;
    } else {
        extraAdditions.value.push({ ...option, qty: amount });
    }
}

function updateExtraAdditionQty(id: number, qty: number) {
    const idx = extraAdditions.value.findIndex((d) => d.id === id);
    if (idx === -1) return;
    const amount = Math.max(0, Number(qty) || 0);
    if (amount <= 0) extraAdditions.value.splice(idx, 1);
    else extraAdditions.value[idx].qty = amount;
}

function removeExtraAddition(id: number) {
    const idx = extraAdditions.value.findIndex((d) => d.id === id);
    if (idx === -1) return;
    extraAdditions.value.splice(idx, 1);
}

export function useCart() {
    return {
        items,
        shipping,
        subtotalProducts,
        subtotalAdditions,
        subtotalDrinks,
        subtotal,
        total,
        totalQty,
        extraDrinks,
        extraAdditions,
        addOrIncrease,
        decrease,
        remove,
        clear,
        setShipping,
        addExtraDrink,
        updateExtraDrinkQty,
        removeExtraDrink,
        addExtraAddition,
        updateExtraAdditionQty,
        removeExtraAddition
    };
}

