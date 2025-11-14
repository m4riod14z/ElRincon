<template>
  <ion-page>
    <ion-content class="ion-padding" fullscreen>
      <h2 class="title">Pedidos</h2>

      <div v-if="alert.visible" :class="['orders-alert', alert.kind]">
        <span class="icon" v-if="alert.kind === 'new'">🔔</span>
        <span class="icon" v-else>✅</span>
        <span class="text">{{ alert.message }}</span>
      </div>

      <ion-item v-if="error" color="danger" lines="full">
        <ion-label>⚠️{{ error }}</ion-label>
      </ion-item>

      <!-- Nuevos -->
      <section class="section">
        <div class="section-header">
          <h3>Nuevos</h3>
        </div>
        <ion-list>
          <ion-item v-for="o in nuevos" :key="o.id" button detail @click="openDetail(o.id)">
            <ion-label>
              <h2>Pedido #{{ o.id }}</h2>
              <p>Cliente: {{ fullName(o) }}</p>
              <p>{{ o.address }}</p>
              <p>Total: <strong>{{ fmtCOP(o.total) }}</strong></p>
            </ion-label>
            <ion-buttons slot="end">
              <ion-button color="primary" @click.stop="accept(o.id)">Aceptar</ion-button>
            </ion-buttons>
          </ion-item>
          <p v-if="!nuevos.length" class="empty">No hay pedidos nuevos.</p>
        </ion-list>
      </section>

      <!-- En preparación -->
      <section class="section">
        <div class="section-header">
          <h3>En preparación</h3>
        </div>
        <ion-list>
          <ion-item v-for="o in enPreparacion" :key="o.id" button detail @click="openDetail(o.id)">
          <ion-label>
              <h2>Pedido #{{ o.id }}</h2>
              <p>Cliente: {{ fullName(o) }}</p>
              <p>{{ o.address }}</p>
              <p>Total: <strong>{{ fmtCOP(o.total) }}</strong></p>
            </ion-label>
            <ion-buttons slot="end">
              <ion-button color="primary" @click.stop="dispatch(o.id)">Enviar</ion-button>
            </ion-buttons>
          </ion-item>
          <p v-if="!enPreparacion.length" class="empty">No hay pedidos en preparación.</p>
        </ion-list>
      </section>

      <!-- Enviados -->
      <section class="section">
        <div class="section-header">
          <h3>Enviados</h3>
        </div>
        <ion-list>
          <ion-item v-for="o in enviados" :key="o.id" button detail @click="openDetail(o.id)">
            <ion-label>
              <h2>Pedido #{{ o.id }}</h2>
              <p>Cliente: {{ fullName(o) }}</p>
              <p>{{ o.address }}</p>
              <p>Total: <strong>{{ fmtCOP(o.total) }}</strong></p>
            </ion-label>
            <ion-note slot="end" color="warning" class="sent-pill">{{ mapStatus(o.status) }}</ion-note>
          </ion-item>
          <p v-if="!enviados.length" class="empty">No hay pedidos enviados.</p>
        </ion-list>
      </section>

      <!-- Detalle -->
      <ion-modal :is-open="!!detail" @didDismiss="detail = null">
        <ion-header>
          <ion-toolbar>
            <ion-title>Detalle del pedido</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="detail = null">Cerrar</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <template v-if="detail">
            <h2>Pedido #{{ detail.id }}</h2>
            <p>Cliente: {{ fullName(detail) }}</p>
            <p>Dirección: {{ detail.address }}</p>
            <ion-list>
              <ion-item lines="inset" v-for="(it, idx) in detail.items" :key="idx">
                <ion-label>
                  <h3>{{ it.qty }} x {{ it.product_name || ('Producto ' + it.product_id) }}</h3>
                  <p v-if="it.addition_name">Adición: {{ it.addition_name }}</p>
                  <p v-if="it.drink_name">Bebida: {{ it.drink_name }}</p>
                  <p>Subtotal: {{ fmtCOP(lineSubtotal(it)) }}</p>
                </ion-label>
              </ion-item>
            </ion-list>
            <div class="totals">
              <div>Total: <strong>{{ fmtCOP(detail.total) }}</strong></div>
              <div>Estado: {{ mapStatus(detail.status) }}</div>
            </div>
          </template>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonContent, IonList, IonItem, IonLabel, IonButtons, IonButton,
  IonModal, IonHeader, IonToolbar, IonTitle, IonNote
} from '@ionic/vue'
import { ref, watch, onBeforeUnmount } from 'vue'
import { fmtCOP } from '@/utils/money'
import { useRestaurantOrders } from '@/controllers/useRestaurantOrders'
import type { Order, OrderItemDetail, OrderDetail } from '@/models/orders'
import { supabase } from '@/services/SupabaseClient'

const {
  orders, nuevos, enPreparacion, enviados,
  getOrderDetail,
  acceptOrder, dispatchOrder,
  error,
} = useRestaurantOrders()

const detail = ref<OrderDetail | null>(null)
const nameCache = ref<Record<string, string>>({})
const pendingNames = new Set<string>()

// ----- RF-23: aviso de nuevos / entregados -----
type AlertKind = 'new' | 'delivered' | null
const alert = ref<{ visible: boolean; kind: AlertKind; message: string }>({
  visible: false,
  kind: null,
  message: ''
})
let alertTimer: ReturnType<typeof setTimeout> | null = null
const ordersInitialized = ref(false)

function showAlert(kind: AlertKind, count: number) {
  if (!kind || count <= 0) return
  let message = ''
  if (kind === 'new') {
    message = count === 1 ? 'Nuevo pedido recibido' : `${count} pedidos nuevos recibidos`
  } else {
    message = count === 1 ? 'Un pedido fue marcado como entregado' : `${count} pedidos marcados como entregados`
  }
  alert.value = { visible: true, kind, message }
  if (alertTimer) clearTimeout(alertTimer)
  alertTimer = setTimeout(() => {
    alert.value.visible = false
    alert.value.kind = null
    alert.value.message = ''
  }, 4000)
}

onBeforeUnmount(() => {
  if (alertTimer) clearTimeout(alertTimer)
})

// watcher original para nombres
watch(orders, (list) => {
  if (!Array.isArray(list)) return
  const updates: Record<string, string> = {}
  const missing: string[] = []
  list.forEach((o) => {
    const cid = o.client_id
    if (!cid) return
    const label = [o.first_name, o.last_name].filter(Boolean).join(' ').trim()
    if (label) {
      if (nameCache.value[cid] !== label) updates[cid] = label
    } else if (!nameCache.value[cid] && !pendingNames.has(cid)) {
      missing.push(cid)
      pendingNames.add(cid)
    }
  })
  if (Object.keys(updates).length) {
    nameCache.value = { ...nameCache.value, ...updates }
  }
  if (missing.length) fetchClientNames(missing)
}, { immediate: true })

// watcher adicional para detectar nuevos / entregados
watch(orders, (list, oldList) => {
  const next = Array.isArray(list) ? list as Order[] : []
  const prev = Array.isArray(oldList) ? oldList as Order[] : []

  if (!ordersInitialized.value) {
    ordersInitialized.value = true
    return
  }

  const prevMap = new Map<number, Order>()
  prev.forEach(o => prevMap.set(o.id, o))

  let newCount = 0
  let deliveredCount = 0

  for (const o of next) {
    const before = prevMap.get(o.id)
    if (!before) {
      if (o.status === 'NEW') newCount++
    } else if (before.status !== 'DELIVERED' && o.status === 'DELIVERED') {
      deliveredCount++
    }
  }

  if (newCount > 0) {
    showAlert('new', newCount)
  } else if (deliveredCount > 0) {
    showAlert('delivered', deliveredCount)
  }
}, { deep: false })

async function fetchClientNames(ids: string[]) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', ids)
    if (error) throw error
    const updates: Record<string, string> = {}
    for (const row of (data ?? [])) {
      const label = [row.first_name, row.last_name].filter(Boolean).join(' ').trim() || row.id
      updates[row.id] = label
    }
    if (Object.keys(updates).length) {
      nameCache.value = { ...nameCache.value, ...updates }
    }
  } catch (err) {
    console.error('Error fetching client names', err)
  } finally {
    ids.forEach(id => pendingNames.delete(id))
  }
}

function fullName(o: Partial<Order>) {
  const fn = (o.first_name || '').trim()
  const ln = (o.last_name || '').trim()
  const label = [fn, ln].filter(Boolean).join(' ').trim()
  if (label) return label
  if (o.client_id) return nameCache.value[o.client_id] || o.client_id
  return 'Cliente'
}

function mapStatus(st: Order['status']) {
  switch (st) {
    case 'NEW': return 'En espera'
    case 'ACCEPTED': return 'En preparación'
    case 'DISPATCHED': return 'Enviado'
    case 'DELIVERED': return 'Entregado'
    default: return st
  }
}

function lineSubtotal(it: OrderItemDetail) {
  const base = (it.unit_price || 0) * (it.qty || 0)
  const add = (it.addition_price || 0) * (it.qty || 0)
  const drk = (it.drink_price || 0) * (it.qty || 0)
  return base + add + drk
}

async function openDetail(orderId: number) {
  detail.value = await getOrderDetail(orderId)
}

async function accept(orderId: number) {
  await acceptOrder(orderId)
}
async function dispatch(orderId: number) {
  await dispatchOrder(orderId)
}
</script>

<style scoped>
.title {
  font-weight: 800;
  margin-bottom: 10px;
}

/* Aviso RF-23 */
.orders-alert {
  margin-bottom: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.orders-alert.new {
  background: rgba(59, 130, 246, 0.12);
  color: var(--ion-color-primary);
}

.orders-alert.delivered {
  background: rgba(16, 185, 129, 0.12);
  color: var(--ion-color-success, #16a34a);
}

.orders-alert .icon {
  font-size: 16px;
}

.section {
  margin-bottom: 16px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.empty {
  text-align: center;
  color: var(--ion-color-medium);
  margin: 8px 0;
}

h2 {
  font-weight: 700;
  margin: 0;
}

h3 {
  font-weight: 700;
  margin: 8px 0;
}

p {
  margin: 0;
  font-size: 14px;
}

.sent-pill {
  min-width: 70px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  align-self: center;
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid var(--ion-color-warning, #fbbf24);
  color: var(--ion-color-warning, #fbbf24);
  font-weight: 600;
  font-size: 13px;
}

.totals {
  margin-top: 12px;
  font-size: 16px;
  display: grid;
  gap: 6px;
}
</style>