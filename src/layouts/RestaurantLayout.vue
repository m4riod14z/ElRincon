<template>
    <ion-page>
        <ion-header>
            <ion-toolbar>
                <ion-title>Restaurante</ion-title>
            </ion-toolbar>
        </ion-header>

        <ion-content :scroll-y="false">
            <ion-router-outlet />
        </ion-content>

        <ion-footer>
            <ion-toolbar>
                <ion-segment :value="current" @ionChange="onChange">
                    <ion-segment-button value="restaurant-products">
                        <ion-label>Productos</ion-label>
                    </ion-segment-button>

                    <ion-segment-button value="restaurant-orders">
                        <ion-label>Pedidos</ion-label>
                        <ion-badge v-if="pendingCount > 0" class="tab-badge">
                            {{ pendingCount }}
                        </ion-badge>
                    </ion-segment-button>

                    <ion-segment-button value="restaurant-profile">
                        <ion-label>Perfil</ion-label>
                    </ion-segment-button>
                </ion-segment>
            </ion-toolbar>
        </ion-footer>
    </ion-page>
</template>

<script setup lang="ts">
import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonFooter,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonRouterOutlet,
    IonBadge,
} from '@ionic/vue'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRestaurantOrders } from '@/controllers/useRestaurantOrders'

const route = useRoute()
const router = useRouter()

const current = computed(() => (route.name as string) ?? 'restaurant-products')

// SOLO NEW para el contador
const { nuevos } = useRestaurantOrders()
const pendingCount = computed(() => nuevos.value?.length || 0)

function onChange(ev: CustomEvent) {
    const value = (ev as any).detail?.value as string
    if (value) router.push({ name: value })
}
</script>

<style scoped>
ion-content {
    --padding-top: 0;
    --padding-bottom: 0;
    display: flex;
}

ion-content>ion-router-outlet {
    flex: 1;
    min-height: 0;
}

ion-title {
    width: 100%;
    text-align: center;
}

ion-segment-button {
    position: relative;
}

.tab-badge {
    position: absolute;
    top: 4px;
    right: 10px;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 999px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    background: var(--ion-color-danger, #e11d48);
    color: #fff;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.4);
}
</style>
