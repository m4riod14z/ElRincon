<template>
    <ion-modal :is-open="isOpen" @didDismiss="emit('close')">
        <ion-header>
            <ion-toolbar>
                <ion-title>Detalle del pedido</ion-title>
                <ion-buttons slot="end">
                    <ion-button @click="emit('close')">Cerrar</ion-button>
                </ion-buttons>
            </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding">
            <template v-if="order">
                <div class="detail-card">
                    <header class="detail-header">
                        <h2 class="detail-title">Pedido #{{ order.id }}</h2>
                        <p class="detail-client">
                            Cliente: <strong>{{ fullName }}</strong>
                        </p>
                        <p class="detail-address" v-if="order.address">
                            Dirección: {{ order.address }}
                        </p>
                    </header>

                    <!-- Producto principal -->
                    <section v-if="order.items && order.items.length" class="detail-main">
                        <div class="detail-image">
                            <img :src="mainItem.product_image_url || '/Logo.png'"
                                :alt="mainItem.product_name || ('Producto ' + mainItem.product_id)" />
                        </div>
                        <div class="detail-main-info">
                            <p class="detail-main-name">
                                {{ mainItem.qty }} x
                                {{ mainItem.product_name || ('Producto ' + mainItem.product_id) }}
                            </p>
                            <p v-if="mainItem.addition_name" class="detail-sub">
                                Adición: {{ mainItem.addition_name }}
                            </p>
                            <p v-if="mainItem.drink_name" class="detail-sub">
                                Bebida: {{ mainItem.drink_name }}
                            </p>
                            <p class="detail-sub">
                                Subtotal: {{ fmtCOP(lineSubtotal(mainItem)) }}
                            </p>
                        </div>
                    </section>

                    <!-- Otros ítems -->
                    <section v-if="order.items && order.items.length > 1" class="detail-items-list">
                        <h3 class="detail-section-title">Otros ítems</h3>
                        <ion-list>
                            <ion-item lines="inset" v-for="(it, idx) in order.items.slice(1)" :key="idx">
                                <ion-label>
                                    <h3>{{ it.qty }} x {{ it.product_name || ('Producto ' + it.product_id) }}</h3>
                                    <p v-if="it.addition_name">Adición: {{ it.addition_name }}</p>
                                    <p v-if="it.drink_name">Bebida: {{ it.drink_name }}</p>
                                    <p>Subtotal: {{ fmtCOP(lineSubtotal(it)) }}</p>
                                </ion-label>
                            </ion-item>
                        </ion-list>
                    </section>

                    <footer class="detail-totals">
                        <div>
                            Total:
                            <strong>{{ fmtCOP(order.total) }}</strong>
                        </div>
                        <div>
                            Estado:
                            <span class="detail-status">{{ mapStatus(order.status) }}</span>
                        </div>
                    </footer>
                </div>
            </template>
        </ion-content>
    </ion-modal>
</template>

<script setup lang="ts">
import {
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonList,
    IonItem,
    IonLabel
} from '@ionic/vue'
import { computed } from 'vue'
import type { OrderDetail, OrderItemDetail, Order } from '@/models/orders'
import { fmtCOP } from '@/utils/money'

const props = defineProps<{
    isOpen: boolean
    order: OrderDetail | null
}>()

const emit = defineEmits<{
    (e: 'close'): void
}>()

const mainItem = computed<OrderItemDetail>(() => {
    return (props.order?.items?.[0] as OrderItemDetail) ?? {
        product_id: 0,
        qty: 0,
        unit_price: 0
    }
})

const fullName = computed(() => {
    if (!props.order) return 'Cliente'
    const fn = (props.order.first_name || '').trim()
    const ln = (props.order.last_name || '').trim()
    const label = [fn, ln].filter(Boolean).join(' ').trim()
    return label || 'Cliente'
})

function lineSubtotal(it: OrderItemDetail) {
    const base = (it.unit_price || 0) * (it.qty || 0)
    const add = (it.addition_price || 0) * (it.qty || 0)
    const drk = (it.drink_price || 0) * (it.qty || 0)
    return base + add + drk
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
</script>

<style scoped>
.detail-card {
    background: var(--ion-item-background, #111111);
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(148, 163, 184, 0.25);
}

.detail-header {
    margin-bottom: 12px;
}

.detail-title {
    margin: 0 0 4px;
    font-size: 20px;
    font-weight: 800;
}

.detail-client,
.detail-address {
    margin: 0;
    font-size: 14px;
    color: var(--ion-color-medium);
}

.detail-main {
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 1.4fr);
    gap: 12px;
    margin-top: 14px;
    align-items: center;
}

.detail-image {
    border-radius: 10px;
    overflow: hidden;
    background: #000;
}

.detail-image img {
    width: 100%;
    height: 150px;
    object-fit: cover;
    display: block;
}

.detail-main-info {
    display: grid;
    gap: 4px;
    font-size: 14px;
}

.detail-main-name {
    margin: 0 0 2px;
    font-weight: 700;
    font-size: 15px;
}

.detail-sub {
    margin: 0;
    color: var(--ion-color-medium);
}

.detail-items-list {
    margin-top: 16px;
}

.detail-section-title {
    margin: 0 0 6px;
    font-size: 15px;
    font-weight: 700;
}

.detail-totals {
    margin-top: 16px;
    padding-top: 8px;
    border-top: 1px solid rgba(148, 163, 184, 0.35);
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 15px;
}

.detail-status {
    font-weight: 600;
}

@media (max-width: 480px) {
    .detail-main {
        grid-template-columns: 1fr;
    }

    .detail-image img {
        height: 180px;
    }
}
</style>