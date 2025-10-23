import { supabase } from '@/services/SupabaseClient'

export interface Order {
    id: number
    client_id: string
    address: string
    total: number
    status: 'NEW' | 'ACCEPTED' | 'READY_TO_SEND' | 'DISPATCHED' | 'DELIVERED'
}

export async function fetchOrdersByClient(clientId: string): Promise<Order[]> {
    const { data, error } = await supabase
        .from('orders')
        .select('id, client_id, address, total, status')
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