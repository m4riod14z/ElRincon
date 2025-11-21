<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Mis pedidos</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding view-fade-up" fullscreen>
      <h2 class="title">Pedidos</h2>

      <ion-item v-if="error" color="danger" lines="full">
        <ion-label>⚠️ {{ error }}</ion-label>
      </ion-item>

      <div v-if="loading" class="loading-wrap">
        <ion-spinner name="dots" />
      </div>

      <template v-else>
        <!-- SOLICITADOS -->
        <section class="section">
          <div class="section-header">
            <h3>Solicitados</h3>
          </div>
          <ion-list>
            <ion-item
              v-for="o in solicitados"
              :key="o.id"
              button
              detail
              @click="openDetail(o)"
            >
              <ion-label>
                <h2>Pedido #{{ o.id }}</h2>
                <p>Estado: {{ mapStatus(o.status) }}</p>
                <p>Dirección: {{ o.address || 'Sin dirección' }}</p>
                <p>
                  Total:
                  <strong>{{ fmtCOP(o.total) }}</strong>
                </p>
              </ion-label>
            </ion-item>
            <p v-if="!solicitados.length" class="empty">
              No tienes pedidos solicitados.
            </p>
          </ion-list>
        </section>

        <!-- EN PROGRESO -->
        <section class="section">
          <div class="section-header">
            <h3>En preparación</h3>
          </div>
          <ion-list>
            <ion-item
              v-for="o in enProgreso"
              :key="o.id"
              button
              detail
              @click="openDetail(o)"
            >
              <ion-label>
                <h2>Pedido #{{ o.id }}</h2>
                <p>Estado: {{ mapStatus(o.status) }}</p>
                <p>Dirección: {{ o.address || 'Sin dirección' }}</p>
                <p>
                  Total:
                  <strong>{{ fmtCOP(o.total) }}</strong>
                </p>
              </ion-label>
              <ion-note slot="end" color="medium" class="status-pill">
                {{ mapStatus(o.status) }}
              </ion-note>
            </ion-item>
            <p v-if="!enProgreso.length" class="empty">
              No tienes pedidos en preparación.
            </p>
          </ion-list>
        </section>

        <!-- ENVIADOS -->
        <section class="section">
          <div class="section-header">
            <h3>Enviados</h3>
          </div>
          <ion-list>
            <ion-item
              v-for="o in enviados"
              :key="o.id"
              button
              detail
              @click="openDetail(o)"
            >
              <ion-label>
                <h2>Pedido #{{ o.id }}</h2>
                <p>Estado: {{ mapStatus(o.status) }}</p>
                <p>Dirección: {{ o.address || 'Sin dirección' }}</p>
                <p>
                  Total:
                  <strong>{{ fmtCOP(o.total) }}</strong>
                </p>
              </ion-label>
              <ion-buttons slot="end">
                <!-- Botón corto y con mejor estilo -->
                <ion-button
                  color="success"
                  size="small"
                  fill="solid"
                  class="received-btn"
                  @click.stop="marcarEntregado(o.id)"
                >
                  Recibido
                </ion-button>
              </ion-buttons>
            </ion-item>
            <p v-if="!enviados.length" class="empty">
              No tienes pedidos enviados.
            </p>
          </ion-list>
        </section>
      </template>

      <!-- Modal de detalle reutilizable -->
      <OrderDetailModal
        :is-open="detailOpen"
        :order="detail"
        @close="closeDetail"
      />

      <!-- Spinner sobre la modal mientras carga el detalle -->
      <div v-if="detailOpen && detailLoading" class="detail-overlay">
        <ion-spinner name="dots" />
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonList,
  IonButtons,
  IonButton,
  IonNote,
  IonSpinner,
} from '@ionic/vue'
import { ref } from 'vue'
import { fmtCOP } from '@/utils/money'
import { useOrders } from '@/controllers/useOrders'
import type { Order, OrderDetail } from '@/models/orders'
import { fetchOrderItems } from '@/models/orders'
import OrderDetailModal from '@/components/OrderDetailModal.vue'

const {
  loading,
  error,
  solicitados,
  enProgreso,
  enviados,
  marcarEntregado,
} = useOrders()

// ---- Modal de detalle ----
const detailOpen = ref(false)
const detailLoading = ref(false)
const detail = ref<OrderDetail | null>(null)

async function openDetail(o: Order) {
  // evitamos problemas de foco dentro de ion-router-outlet
  const active = document.activeElement as HTMLElement | null
  active?.blur()

  detailOpen.value = true
  detailLoading.value = true
  detail.value = null

  try {
    const items = await fetchOrderItems(o.id)
    detail.value = {
      ...o,
      items,
    } as OrderDetail
  } catch (e) {
    console.error('Error cargando detalle de pedido', e)
  } finally {
    detailLoading.value = false
  }
}

function closeDetail() {
  detailOpen.value = false
  detail.value = null
  detailLoading.value = false
}

// ---- Utilidades UI ----
function mapStatus(st: Order['status']) {
  switch (st) {
    case 'NEW':
      return 'En espera'
    case 'ACCEPTED':
      return 'En preparación'
    case 'DISPATCHED':
      return 'Enviado'
    case 'DELIVERED':
      return 'Entregado'
    default:
      return st
  }
}
</script>

<style scoped>
.title {
  font-weight: 800;
  margin-bottom: 10px;
}

.loading-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 120px;
}

.section {
  margin-bottom: 16px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.empty {
  text-align: center;
  color: var(--ion-color-medium);
  margin: 8px 0;
}

.status-pill {
  min-width: 80px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  align-self: center;
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid var(--ion-color-medium);
  font-weight: 600;
  font-size: 13px;
}

/* Botón "Recibido" como píldora compacta */
.received-btn {
  --border-radius: 999px;
  --padding-start: 12px;
  --padding-end: 12px;
  --padding-top: 4px;
  --padding-bottom: 4px;
  font-weight: 600;
  font-size: 13px;
}

/* Overlay de loading sobre la modal */
.detail-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: none;
}
</style>