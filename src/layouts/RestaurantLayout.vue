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
    IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
    IonFooter, IonSegment, IonSegmentButton, IonLabel, IonRouterOutlet
} from '@ionic/vue'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const current = computed(() => (route.name as string) ?? 'restaurant-products')

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

ion-content > ion-router-outlet {
    flex: 1;
    min-height: 0;
}

ion-title {
    width: 100%;
    display: flex;
    justify-content: center;
}
</style>
