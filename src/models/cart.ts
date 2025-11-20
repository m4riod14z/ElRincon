export interface CartAddition {
    id: number;
    name: string;
    price: number;
}

export interface CartDrink {
    id: number;
    name: string;
    price: number;
}

export interface CartItem {
    uid: string;
    productId: number;
    name: string;
    image_url?: string | null;
    basePrice: number;
    qty: number;
    addition?: CartAddition | null;
    drink?: CartDrink | null;
}

export interface CartExtraDrink extends CartDrink {
    qty: number;
}

export interface CartExtraAddition extends CartAddition {
    qty: number;
}

export interface CartSnapshot {
    items: CartItem[];
    shipping: number;
    extraDrinks?: CartExtraDrink[];
    extraAdditions?: CartExtraAddition[];
}

export function makeCartUID(
    productId: number,
    additionId?: number | null,
    drinkId?: number | null
): string {
    return `${productId}|${additionId ?? 0}|${drinkId ?? 0}`;
}

