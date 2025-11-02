import { ref, computed, watch } from "vue";
import type { CartItem, CartAddition, CartDrink, CartSnapshot } from "@/models/cart";
import { makeCartUID } from "@/models/cart";
import { supabase } from "@/services/SupabaseClient";

// Namespace cart by user to avoid leaking items across accounts
const STORAGE_PREFIX = "cart:v1:";
let currentKey = STORAGE_PREFIX + "guest";

const items = ref<CartItem[]>([]);
const shipping = ref<number>(0);

function loadFromStorage() {
    try {
        const raw = localStorage.getItem(currentKey);
        if (!raw) return;
        const snap = JSON.parse(raw) as CartSnapshot;
        items.value = Array.isArray(snap.items) ? snap.items : [];
        shipping.value = Number(snap.shipping || 0);
    } catch {
        items.value = [];
        shipping.value = 0;
    }
}

function saveToStorage() {
    const snap: CartSnapshot = {
        items: items.value,
        shipping: shipping.value,
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
watch([items, shipping], saveToStorage, { deep: true });

const subtotalProducts = computed(() =>
    items.value.reduce((acc, it) => acc + it.basePrice * it.qty, 0)
);

const subtotalAdditions = computed(() =>
    items.value.reduce((acc, it) => acc + (it.addition?.price ?? 0) * it.qty, 0)
);

const subtotalDrinks = computed(() =>
    items.value.reduce((acc, it) => acc + (it.drink?.price ?? 0) * it.qty, 0)
);

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
}

function setShipping(value: number) {
    shipping.value = Math.max(0, Number(value) || 0);
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
        addOrIncrease,
        decrease,
        remove,
        clear,
        setShipping
    };
}
