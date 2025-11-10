import { supabase } from '@/services/SupabaseClient'

export interface Order {
    id: number
    client_id: string
    address: string
    total: number
    status: 'NEW' | 'ACCEPTED' | 'READY_TO_SEND' | 'DISPATCHED' | 'DELIVERED'
    first_name?: string | null
    last_name?: string | null
    created_at?: string | null
}

export interface OrderItemDetail {
    product_id: number
    qty: number
    unit_price: number
    addition_id?: number | null
    drink_id?: number | null
    product_name?: string | null
    addition_name?: string | null
    drink_name?: string | null
    addition_price?: number | null
    drink_price?: number | null
}

export interface OrderDetail extends Order {
    items: OrderItemDetail[]
}

// CLIENTE: Pedidos por cliente
export async function fetchOrdersByClient(clientId: string): Promise<Order[]> {
    const { data, error } = await supabase
        .from('orders')
        .select('id, client_id, address, total, status, first_name, last_name')
        .eq('client_id', clientId)
        .order('id', { ascending: false })

    if (error) throw error
    return (data ?? []) as Order[]
}

export async function markOrderAsDelivered(orderId: number) {
    const { error } = await supabase
        .from('orders')
        .update({ status: 'DELIVERED' })
        .eq('id', orderId)

    if (error) throw error
}

// RESTAURANTE: Pedidos y gestión de estados
export async function fetchAllOrders(): Promise<Order[]> {
    const { data, error } = await supabase
        .from('orders')
        .select('id, client_id, address, total, status, first_name, last_name')
        .order('id', { ascending: false })

    if (error) throw error
    return (data ?? []) as Order[]
}

export async function fetchOrderItems(orderId: number): Promise<OrderItemDetail[]> {
    // Traer filas de order_items (ids crudos)
    const { data: items, error: itemsErr } = await supabase
        .from('order_items')
        .select('product_id, qty, unit_price, addition_id, drink_id')
        .eq('order_id', orderId)

    if (itemsErr) throw itemsErr
    const rows = (items ?? []) as Array<{ product_id: number; qty: number; unit_price: number; addition_id?: number | null; drink_id?: number | null }>

    if (!rows.length) return []

    // Resolver nombres en lotes para productos, adiciones y bebidas
    const productIds = Array.from(new Set(rows.map(r => r.product_id))).filter(Boolean) as number[]
    const additionIds = Array.from(new Set(rows.map(r => r.addition_id).filter(Boolean))) as number[]
    const drinkIds = Array.from(new Set(rows.map(r => r.drink_id).filter(Boolean))) as number[]

    const [pRes, aRes, dRes] = await Promise.all([
        productIds.length ? supabase.from('products').select('id, name, price').in('id', productIds) : Promise.resolve({ data: [], error: null }),
        additionIds.length ? supabase.from('additions').select('id, name, price').in('id', additionIds) : Promise.resolve({ data: [], error: null }),
        drinkIds.length ? supabase.from('drinks').select('id, name, price').in('id', drinkIds) : Promise.resolve({ data: [], error: null }),
    ])

    if ((pRes as any).error) throw (pRes as any).error
    if ((aRes as any).error) throw (aRes as any).error
    if ((dRes as any).error) throw (dRes as any).error

    type NamedRow = { id: number; name: string; price?: number | null }
    const productName = new Map<number, string>((((pRes as any).data ?? []) as NamedRow[]).map(r => [r.id, r.name]))
    const additionMap = new Map<number, { name: string; price: number | null }>((((aRes as any).data ?? []) as NamedRow[]).map(r => [r.id, { name: r.name, price: r.price ?? null }]))
    const drinkMap = new Map<number, { name: string; price: number | null }>((((dRes as any).data ?? []) as NamedRow[]).map(r => [r.id, { name: r.name, price: r.price ?? null }]))

    return rows.map(it => ({
        product_id: it.product_id,
        qty: it.qty,
        unit_price: it.unit_price,
        addition_id: it.addition_id ?? null,
        drink_id: it.drink_id ?? null,
        product_name: productName.get(it.product_id) ?? null,
        addition_name: it.addition_id ? (additionMap.get(it.addition_id)?.name ?? null) : null,
        drink_name: it.drink_id ? (drinkMap.get(it.drink_id)?.name ?? null) : null,
        addition_price: it.addition_id ? (additionMap.get(it.addition_id)?.price ?? null) : null,
        drink_price: it.drink_id ? (drinkMap.get(it.drink_id)?.price ?? null) : null,
    }))
}

export async function fetchOrderDetail(orderId: number): Promise<OrderDetail | null> {
    const { data, error } = await supabase
        .from('orders')
        .select('id, client_id, address, total, status, first_name, last_name')
        .eq('id', orderId)
        .single()

    if (error) throw error
    if (!data) return null

    const items = await fetchOrderItems(orderId)
    return { ...(data as Order), items }
}

export async function updateOrderStatus(orderId: number, status: Order['status']) {
    const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)

    if (error) throw error
}
