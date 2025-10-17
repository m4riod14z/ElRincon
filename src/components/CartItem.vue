<template>
    <ion-item lines="full">
        <ion-thumbnail slot="start">
            <img :src="item.image_url || '/Logo.png'" :alt="item.name" />
        </ion-thumbnail>

        <ion-label>
            <h2 class="name">{{ item.name }}</h2>
            <p class="opt">
                Adición: <strong>{{ item.addition?.name ?? 'Ninguna' }}</strong>
                <span v-if="item.addition">({{ fmtCOP(item.addition.price) }})</span>
            </p>
            <p class="opt">
                Bebida: <strong>{{ item.drink?.name ?? 'Ninguna' }}</strong>
                <span v-if="item.drink">({{ fmtCOP(item.drink.price) }})</span>
            </p>
            <p class="line-total">
                <span>Subtotal ítem</span>
                <strong>{{ fmtCOP(lineTotal) }}</strong>
            </p>
        </ion-label>

        <ion-buttons slot="end" class="qty">
            <ion-button size="small" fill="outline" @click="$emit('decrease', item.uid)">−</ion-button>
            <span class="q">{{ item.qty }}</span>
            <ion-button size="small" fill="outline" @click="$emit('increase', item)">＋</ion-button>
        </ion-buttons>

        <ion-buttons slot="end">
            <ion-button color="danger" fill="clear" @click="$emit('remove', item.uid)">
                Eliminar
            </ion-button>
        </ion-buttons>
    </ion-item>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { IonItem, IonLabel, IonButton, IonButtons, IonThumbnail } from '@ionic/vue';
import { fmtCOP } from '@/utils/money';
import type { CartItem } from '@/models/cart';

const props = defineProps<{ item: CartItem }>();

const lineTotal = computed(() => {
    const add = props.item.addition?.price ?? 0;
    const dri = props.item.drink?.price ?? 0;
    return (props.item.basePrice + add + dri) * props.item.qty;
});
</script>

<style scoped>
.name {
    font-weight: 700;
    margin: 0 0 4px;
}

.opt {
    margin: 0;
    font-size: 13px;
    color: var(--ion-color-medium);
}

.line-total {
    display: flex;
    justify-content: space-between;
    margin-top: 6px;
}

.qty {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-right: 6px;
}

.q {
    min-width: 20px;
    text-align: center;
    font-weight: 700;
}

ion-thumbnail img {
    object-fit: cover;
}
</style>