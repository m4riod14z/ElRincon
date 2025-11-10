<template>
  <ion-page>
    <ion-content class="ion-padding" fullscreen>
      <h2 class="title">Pedidos</h2>
      <ion-item v-if="error" color="danger" lines="full">
        <ion-label>⚠️ {{ error }}</ion-label>
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
              <ion-button color="medium" @click.stop="markReady(o.id)">Listo para enviar</ion-button>
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
              <p>Estado: {{ mapStatus(o.status) }}</p>
              <p>Total: <strong>{{ fmtCOP(o.total) }}</strong></p>
            </ion-label>
            <ion-buttons slot="end">
              <ion-button v-if="o.status === 'READY_TO_SEND'" color="primary" @click.stop="dispatch(o.id)">Marcar enviado</ion-button>
              <ion-button v-else color="success" @click.stop="deliver(o.id)">Marcar entregado</ion-button>
            </ion-buttons>
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
  IonModal, IonHeader, IonToolbar, IonTitle
} from '@ionic/vue'
import { ref } from 'vue'
import { fmtCOP } from '@/utils/money'
import { useRestaurantOrders } from '@/controllers/useRestaurantOrders'
import type { Order, OrderItemDetail, OrderDetail } from '@/models/orders'

const {
  nuevos, enPreparacion, enviados,
  getOrderDetail,
  acceptOrder, readyToSend, dispatchOrder, deliverOrder,
  error,
} = useRestaurantOrders()

const detail = ref<OrderDetail | null>(null)

function fullName(o: Partial<Order>) {
  const fn = (o.first_name || '').trim()
  const ln = (o.last_name || '').trim()
  return [fn, ln].filter(Boolean).join(' ') || o.client_id
}

function mapStatus(st: Order['status']) {
  switch (st) {
    case 'NEW': return 'En espera'
    case 'ACCEPTED': return 'En preparación'
    case 'READY_TO_SEND': return 'Listo para enviar'
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
async function markReady(orderId: number) {
  await readyToSend(orderId)
}
async function dispatch(orderId: number) {
  await dispatchOrder(orderId)
}
async function deliver(orderId: number) {
  await deliverOrder(orderId)
}
</script>

<style scoped>
.title {
  font-weight: 800;
  margin-bottom: 10px;
}

.section { margin-bottom: 16px; }
.section-header { display: flex; align-items: center; justify-content: space-between; }
.empty { text-align: center; color: var(--ion-color-medium); margin: 8px 0; }

h2 { font-weight: 700; margin: 0; }
h3 { font-weight: 700; margin: 8px 0; }
p { margin: 0; font-size: 14px; }

.totals { margin-top: 12px; font-size: 16px; display: grid; gap: 6px; }
</style>
