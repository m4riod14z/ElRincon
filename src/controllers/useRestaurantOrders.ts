import { computed, onMounted, onUnmounted, ref } from 'vue'
import { supabase } from '@/services/SupabaseClient'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Order, OrderDetail } from '@/models/orders'
import { fetchAllOrders, fetchOrderDetail, updateOrderStatus } from '@/models/orders'

const orders = ref<Order[]>([])
const loading = ref(false)
const error = ref('')
const channel = ref<RealtimeChannel | null>(null)

async function load() {
  loading.value = true
  error.value = ''
  try {
    orders.value = await fetchAllOrders()
  } catch (e: any) {
    error.value = e?.message || 'Error al cargar pedidos'
    // Ayuda para depurar en runtime
    console.error('[useRestaurantOrders] load error:', e)
  } finally {
    loading.value = false
  }
}

function subscribe() {
  if (channel.value) return
  channel.value = supabase
    .channel('orders:restaurant')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
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
    })
    .subscribe()
}

async function unsubscribe() {
  if (channel.value) {
    await channel.value.unsubscribe()
    channel.value = null
  }
}

// Computed lists
const nuevos = computed(() => orders.value.filter(o => o.status === 'NEW').sort((a, b) => a.id - b.id)) // más recientes abajo
const enPreparacion = computed(() => orders.value.filter(o => o.status === 'ACCEPTED'))
const enviados = computed(() => orders.value.filter(o => ['READY_TO_SEND', 'DISPATCHED'].includes(o.status)))

// Detail fetcher
async function getOrderDetail(orderId: number): Promise<OrderDetail | null> {
  return await fetchOrderDetail(orderId)
}

// Status transitions
async function acceptOrder(orderId: number) {
  await optimisticUpdate(orderId, 'ACCEPTED')
}
async function readyToSend(orderId: number) {
  await optimisticUpdate(orderId, 'READY_TO_SEND')
}
async function dispatchOrder(orderId: number) {
  await optimisticUpdate(orderId, 'DISPATCHED')
}
async function deliverOrder(orderId: number) {
  await optimisticUpdate(orderId, 'DELIVERED')
}

async function optimisticUpdate(orderId: number, next: Order['status']) {
  const i = orders.value.findIndex(o => o.id === orderId)
  const prev = i >= 0 ? orders.value[i].status : null
  if (i >= 0) orders.value[i] = { ...orders.value[i], status: next }
  try {
    await updateOrderStatus(orderId, next)
  } catch (e) {
    if (i >= 0 && prev) orders.value[i] = { ...orders.value[i], status: prev }
    throw e
  }
}

export function useRestaurantOrders() {
  onMounted(() => { load(); subscribe() })
  onUnmounted(unsubscribe)

  return {
    orders, loading, error,
    nuevos, enPreparacion, enviados,
    load, subscribe, unsubscribe,
    getOrderDetail,
    acceptOrder, readyToSend, dispatchOrder, deliverOrder,
  }
}
