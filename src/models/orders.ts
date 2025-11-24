import { supabase } from '@/services/SupabaseClient'

export interface Order {
    id: number
    client_id: string
    address: string
    total: number
    status: 'NEW' | 'ACCEPTED' | 'DISPATCHED' | 'DELIVERED'
    first_name?: string | null
    last_name?: string | null
    phone?: string | null
}

export interface OrderItemDetail {
    product_id: number
    qty: number
    unit_price: number
    addition_id?: number | null
    drink_id?: number | null
    product_name?: string | null
    product_image_url?: string | null
    addition_name?: string | null
    drink_name?: string | null
    addition_price?: number | null
    drink_price?: number | null
}

export interface OrderDetail extends Order {
    items: OrderItemDetail[]
}

async function hydrateOrdersWithProfiles(orders: Order[]): Promise<Order[]> {
    const clientIds = Array.from(
        new Set(orders.map(o => o.client_id).filter(Boolean)),
    )
    if (!clientIds.length) return orders

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, phone')
        .in('id', clientIds)

    if (error || !profiles) return orders

    const map = new Map<
        string,
        { first_name: string | null; last_name: string | null; phone: string | null }
    >()
    for (const p of profiles as any[]) {
        map.set(p.id as string, {
            first_name: (p.first_name as string | null) ?? null,
            last_name: (p.last_name as string | null) ?? null,
            phone: (p.phone as string | null) ?? null,
        })
    }

    return orders.map(o => {
        const p = map.get(o.client_id)
        if (p) {
            o.first_name = p.first_name
            o.last_name = p.last_name
            o.phone = p.phone
        }
        return o
    })
}

export async function fetchOrdersByClient(
    clientId: string,
): Promise<Order[]> {
    const { data, error } = await supabase
        .from('orders')
        .select('id, client_id, address, total, status')
        .eq('client_id', clientId)
        .order('id', { ascending: false })

    if (error) throw error
    const orders = (data ?? []) as Order[]
    if (!orders.length) return []

    return hydrateOrdersWithProfiles(orders)
}

export async function markOrderAsDelivered(orderId: number) {
    const { error } = await supabase
        .from('orders')
        .update({ status: 'DELIVERED' })
        .eq('id', orderId)

    if (error) throw error
}

export async function fetchAllOrders(): Promise<Order[]> {
    const { data, error } = await supabase
        .from('orders')
        .select('id, client_id, address, total, status')
        .order('id', { ascending: false })

    if (error) throw error
    const orders = (data ?? []) as Order[]
    if (!orders.length) return []

    return hydrateOrdersWithProfiles(orders)
}

export async function fetchOrderItems(
    orderId: number,
): Promise<OrderItemDetail[]> {
    const { data: items, error: itemsErr } = await supabase
        .from('order_items')
        .select('product_id, qty, unit_price, addition_id, drink_id')
        .eq('order_id', orderId)

    if (itemsErr) throw itemsErr
    const rows = (items ?? []) as Array<{
        product_id: number
        qty: number
        unit_price: number
        addition_id?: number | null
        drink_id?: number | null
    }>

    if (!rows.length) return []

    const productIds = Array.from(
        new Set(rows.map(r => r.product_id)),
    ).filter(Boolean) as number[]
    const additionIds = Array.from(
        new Set(rows.map(r => r.addition_id).filter(Boolean)),
    ) as number[]
    const drinkIds = Array.from(
        new Set(rows.map(r => r.drink_id).filter(Boolean)),
    ) as number[]

    const [pRes, aRes, dRes] = await Promise.all([
        productIds.length
            ? supabase
                .from('products')
                .select('id, name, price, image_url')
                .in('id', productIds)
            : Promise.resolve({ data: [], error: null }),
        additionIds.length
            ? supabase
                .from('additions')
                .select('id, name, price')
                .in('id', additionIds)
            : Promise.resolve({ data: [], error: null }),
        drinkIds.length
            ? supabase
                .from('drinks')
                .select('id, name, price')
                .in('id', drinkIds)
            : Promise.resolve({ data: [], error: null }),
    ])

    if ((pRes as any).error) throw (pRes as any).error
    if ((aRes as any).error) throw (aRes as any).error
    if ((dRes as any).error) throw (dRes as any).error

    type ProductRow = {
        id: number
        name: string
        price?: number | null
        image_url?: string | null
    }
    type NamedRow = { id: number; name: string; price?: number | null }

    const productMap = new Map<number, ProductRow>(
        (((pRes as any).data ?? []) as ProductRow[]).map(r => [r.id, r]),
    )

    const additionMap = new Map<number, { name: string; price: number | null }>(
        (((aRes as any).data ?? []) as NamedRow[]).map(r => [
            r.id,
            { name: r.name, price: r.price ?? null },
        ]),
    )

    const drinkMap = new Map<number, { name: string; price: number | null }>(
        (((dRes as any).data ?? []) as NamedRow[]).map(r => [
            r.id,
            { name: r.name, price: r.price ?? null },
        ]),
    )

    return rows.map(it => {
        const prod = productMap.get(it.product_id)
        return {
            product_id: it.product_id,
            qty: it.qty,
            unit_price: it.unit_price,
            addition_id: it.addition_id ?? null,
            drink_id: it.drink_id ?? null,
            product_name: prod?.name ?? null,
            product_image_url: prod?.image_url ?? null,
            addition_name: it.addition_id
                ? additionMap.get(it.addition_id)?.name ?? null
                : null,
            drink_name: it.drink_id
                ? drinkMap.get(it.drink_id)?.name ?? null
                : null,
            addition_price: it.addition_id
                ? additionMap.get(it.addition_id)?.price ?? null
                : null,
            drink_price: it.drink_id
                ? drinkMap.get(it.drink_id)?.price ?? null
                : null,
        }
    })
}

export async function fetchOrderDetail(
    orderId: number,
): Promise<OrderDetail | null> {
    const { data, error } = await supabase
        .from('orders')
        .select('id, client_id, address, total, status')
        .eq('id', orderId)
        .single()

    if (error) throw error
    if (!data) return null

    const order = data as Order

    const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, phone')
        .eq('id', order.client_id)
        .maybeSingle()

    if (profile) {
        order.first_name = (profile.first_name as string | null) ?? null
        order.last_name = (profile.last_name as string | null) ?? null
        order.phone = (profile.phone as string | null) ?? null
    }

    const items = await fetchOrderItems(orderId)
    return { ...order, items }
}

export async function updateOrderStatus(
    orderId: number,
    status: Order['status'],
) {
    const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)

    if (error) throw error
}