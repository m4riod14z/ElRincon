export interface Product {
    id: number;
    name: string;
    description?: string | null;
    price: number;
    image_url?: string | null;
    available: boolean;
    category?: string | null;
}

export interface Category {
    id: number;
    name: string;
}

export interface MenuItemLink {
    product_id: number;
    category_id: number;
}

export interface OptionRow {
    id: number;
    name: string;
    price: number;
    available?: boolean;
}