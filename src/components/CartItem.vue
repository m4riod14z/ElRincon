<template>
    <ion-item lines="full" class="cart-row">
        <ion-thumbnail slot="start" class="thumb">
            <img :src="item.image_url || '/Logo.png'" :alt="item.name" />
        </ion-thumbnail>

        <ion-label class="info">
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

        <!-- 1 solo bloque de acciones al extremo derecho -->
        <div slot="end" class="actions">
            <div class="qty">
                <ion-button size="small" fill="outline" class="qbtn" @click="$emit('decrease', item.uid)">−</ion-button>
                <span class="q">{{ item.qty }}</span>
                <ion-button size="small" fill="outline" class="qbtn" @click="$emit('increase', item)">＋</ion-button>
            </div>

            <ion-button color="danger" fill="clear" class="remove" @click="$emit('remove', item.uid)">
                Eliminar
            </ion-button>
        </div>
    </ion-item>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { IonItem, IonLabel, IonButton, IonThumbnail } from '@ionic/vue';
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
.cart-row {
    --padding-start: 8px;
    --inner-padding-end: 8px;
    align-items: center;
}

.thumb {
    width: 56px;
    height: 56px;
    border-radius: 8px;
    overflow: hidden;
}

.thumb img {
    object-fit: cover;
}

.info {
    min-width: 0;
    white-space: normal;
    word-break: normal;
    overflow-wrap: break-word;
}

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
    align-items: center;
    margin-top: 6px;
}

.actions {
    display: grid;
    gap: 6px;
    justify-items: end;
    align-items: center;
    margin-left: 8px;
}

.qty {
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

.qbtn {
    --padding-start: 6px;
    --padding-end: 6px;
    height: 28px;
    min-width: 28px;
}

.q {
    min-width: 20px;
    text-align: center;
    font-weight: 700;
}

.remove {
    height: 24px;
    --padding-start: 0;
    --padding-end: 0;
    font-size: 12px;
}
</style>