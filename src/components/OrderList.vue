<template>
    <ion-list v-if="orders.length">
        <ion-item v-for="o in orders" :key="o.id" lines="inset">
            <ion-label>
                <h2>Pedido #{{ o.id }}</h2>
                <p>{{ o.address }}</p>
                <p>Total: <strong>{{ fmtCOP(o.total) }}</strong></p>
                <p v-if="showStatus">Estado: Entregado</p>
            </ion-label>

            <ion-buttons v-if="allowDeliver && o.status === 'DISPATCHED'" slot="end">
                <ion-button color="success" @click="$emit('mark-delivered', o.id)">
                    Marcar entregado
                </ion-button>
            </ion-buttons>
        </ion-item>
    </ion-list>

    <p v-else class="empty">No hay pedidos en esta sección.</p>
</template>

<script setup lang="ts">
import { IonList, IonItem, IonLabel, IonButtons, IonButton } from '@ionic/vue'
import { fmtCOP } from '@/utils/money'
import type { Order } from '@/models/orders'

defineProps<{
    orders: Order[]
    allowDeliver?: boolean
    showStatus?: boolean
}>()

defineEmits(['mark-delivered'])
</script>

<style scoped>
.empty {
    text-align: center;
    color: var(--ion-color-medium);
    margin-top: 8px;
}

h2 {
    font-weight: 700;
    margin: 0;
}

p {
    margin: 0;
    font-size: 14px;
}
</style>