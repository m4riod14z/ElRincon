<template>
    <ion-page>
        <ion-header>
            <ion-toolbar>
                <ion-buttons slot="start">
                    <ion-back-button default-href="/tabs/tab1" />
                </ion-buttons>
                <ion-title>Carrito</ion-title>
            </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding cart-content with-footer-pad">
            <div v-if="!items.length" class="empty">
                Tu carrito está vacío.
            </div>

            <ion-list v-else class="cart-list">
                <CartItem v-for="it in items" :key="it.uid" :item="it" @increase="increase" @decrease="decrease"
                    @remove="remove" />
            </ion-list>

            <div v-if="items.length" class="spacer"></div>

            <div v-if="items.length" class="totals">
                <div class="row">
                    <span>Subtotal productos</span>
                    <strong>{{ fmtCOP(subtotalProducts) }}</strong>
                </div>
                <div class="row">
                    <span>Adiciones</span>
                    <strong>{{ fmtCOP(subtotalAdditions) }}</strong>
                </div>
                <div class="row">
                    <span>Bebidas</span>
                    <strong>{{ fmtCOP(subtotalDrinks) }}</strong>
                </div>
                <div class="row">
                    <span>Costo de envío</span>
                    <ion-input type="number" inputmode="numeric" class="ship" :value="shipping"
                        @ionInput="onShip($event)" placeholder="0" />
                </div>
                <div class="row total">
                    <span>Total a pagar</span>
                    <strong>{{ fmtCOP(total) }}</strong>
                </div>
            </div>
        </ion-content>

        <ion-footer v-if="items.length">
            <ion-toolbar>
                <ion-buttons slot="start">
                    <ion-button color="medium" fill="outline" @click="clear">Vaciar carrito</ion-button>
                </ion-buttons>
                <ion-buttons slot="end">
                    <ion-button color="primary">Confirmar pedido</ion-button>
                </ion-buttons>
            </ion-toolbar>
        </ion-footer>
    </ion-page>
</template>

<script setup lang="ts">
import {
    IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
    IonList, IonButtons, IonButton, IonFooter, IonInput, IonBackButton
} from '@ionic/vue';
import CartItem from '@/components/CartItem.vue';
import { useCart } from '@/controllers/useCart';
import { fmtCOP } from '@/utils/money';

const {
    items, shipping, subtotalProducts, subtotalAdditions, subtotalDrinks, total,
    addOrIncrease, decrease, remove, clear, setShipping
} = useCart();

function increase(it: any) {
    addOrIncrease({
        productId: it.productId,
        name: it.name,
        image_url: it.image_url,
        basePrice: it.basePrice,
        addition: it.addition,
        drink: it.drink,
        qty: 1
    });
}

function onShip(ev: any) {
    const v = Number(ev?.target?.value ?? ev?.detail?.value ?? 0);
    setShipping(v);
}
</script>

<style scoped>
.cart-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
    height: 100%;
}

.with-footer-pad {
    --padding-bottom: calc(72px + var(--ion-safe-area-bottom));
}

.cart-list {
    margin: 0;
}

.spacer {
    flex: 1 1 auto;
}

.empty {
    text-align: center;
    color: var(--ion-color-medium);
    margin-top: 16px;
}

.totals {
    border-top: 1px solid #2c2c2c;
    padding-top: 12px;
    display: grid;
    gap: 10px;
}

.row {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.row.total {
    border-top: 1px solid #2c2c2c;
    padding-top: 10px;
    font-size: 18px;
    font-weight: 800;
}

.ship {
    max-width: 120px;
    text-align: right;
}

@media (max-width: 420px) {
    .totals {
        gap: 8px;
    }

    .row span,
    .row strong {
        font-size: 14px;
    }
}
</style>