import { ref, computed, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/services/SupabaseClient'
import { fetchOrdersByClient, markOrderAsDelivered } from '@/models/orders'
import type { Order } from '@/models/orders'
import type { RealtimeChannel } from '@supabase/supabase-js'

const orders = ref<Order[]>([])
const loading = ref(false)
const error = ref('')
const clientId = ref<string | null>(null)
const channel = ref<RealtimeChannel | null>(null)
const inited = ref(false)

async function resolveClientId() {
    const { data, error: authErr } = await supabase.auth.getUser()
    if (authErr || !data?.user) throw new Error('Usuario no autenticado')
    clientId.value = data.user.id
}

async function load() {
    if (!clientId.value) await resolveClientId()
    if (!clientId.value) return
    loading.value = true
    error.value = ''
    try {
        orders.value = await fetchOrdersByClient(clientId.value)
    } catch (e: any) {
        error.value = e?.message || 'Error al cargar pedidos'
        orders.value = []
    } finally {
        loading.value = false
    }
}

function subscribe() {
    if (channel.value || !clientId.value) return
    channel.value = supabase
        .channel(`orders:${clientId.value}`)
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'orders', filter: `client_id=eq.${clientId.value}` },
            (payload) => {
                const ev = payload.eventType
                if (ev === 'INSERT') {
                    const row = payload.new as Order
                    if (!orders.value.some(o => o.id === row.id)) orders.value.unshift(row)
                } else if (ev === 'UPDATE') {
                    const row = payload.new as Order
                    const i = orders.value.findIndex(o => o.id === row.id)
                    if (i >= 0) orders.value[i] = row
                    else orders.value.unshift(row)
                } else if (ev === 'DELETE') {
                    const row = payload.old as Order
                    orders.value = orders.value.filter(o => o.id !== row.id)
                }
            }
        )
        .subscribe()
}

async function unsubscribe() {
    if (channel.value) {
        await channel.value.unsubscribe()
        channel.value = null
    }
}

async function initIfNeeded() {
    if (inited.value) return
    await resolveClientId()
    await load()
    subscribe()
    inited.value = true
}

const solicitados = computed(() => orders.value.filter(o => o.status === 'NEW'))
const enProgreso = computed(() =>
    orders.value.filter(o => ['ACCEPTED', 'READY_TO_SEND', 'DISPATCHED'].includes(o.status))
)
const enviados = computed(() => orders.value.filter(o => o.status === 'DISPATCHED'))
const entregados = computed(() => orders.value.filter(o => o.status === 'DELIVERED'))

async function marcarEntregado(orderId: number) {
    const i = orders.value.findIndex(o => o.id === orderId)
    if (i >= 0) orders.value[i] = { ...orders.value[i], status: 'DELIVERED' as Order['status'] }

    try {
        await markOrderAsDelivered(orderId)
    } catch (e) {
        if (i >= 0) orders.value[i] = { ...orders.value[i], status: 'DISPATCHED' as Order['status'] }
        throw e
    }
}

export function useOrders() {
    onMounted(initIfNeeded)
    onUnmounted(unsubscribe)

    return {
        orders, loading, error,
        solicitados, enProgreso, enviados, entregados,
        load, marcarEntregado,
        initIfNeeded, subscribe, unsubscribe,
    }
}