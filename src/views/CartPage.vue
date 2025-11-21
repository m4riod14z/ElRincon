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
      <div v-if="!items.length" class="empty">Tu carrito está vacío.</div>

      <ion-list v-else class="cart-list">
        <ion-item v-for="it in items" :key="it.uid" lines="none" class="cart-item">
          <div class="cart-item-inner">
            <!-- IZQUIERDA: imagen -->
            <div class="thumb-wrapper" v-if="it.image_url">
              <img :src="it.image_url" alt="" />
            </div>

            <!-- CENTRO: textos + controles -->
            <div class="cart-main">
              <div class="cart-header-row">
                <h3 class="product-name">{{ it.name }}</h3>

                <div class="qty-controls">
                  <ion-button size="small" fill="outline" class="qty-btn" @click="decrease(it.uid)">
                    −
                  </ion-button>

                  <span class="qty-pill">x{{ it.qty }}</span>

                  <ion-button size="small" fill="outline" class="qty-btn" @click="increase(it)" :disabled="it.qty >= 5">
                    +
                  </ion-button>
                </div>
              </div>

              <p class="line">
                <span class="line-label">Adición:</span>
                <span class="line-value">
                  <template v-if="it.addition">
                    {{ it.addition.name }} · x{{ it.qty }}
                    ({{ fmtCOP(it.addition.price * it.qty) }})
                  </template>
                  <template v-else>
                    Ninguna
                  </template>
                </span>
              </p>

              <p class="line">
                <span class="line-label">Bebida:</span>
                <span class="line-value">
                  <template v-if="it.drink">
                    {{ it.drink.name }} · x{{ it.qty }}
                    ({{ fmtCOP(it.drink.price * it.qty) }})
                  </template>
                  <template v-else>
                    Ninguna
                  </template>
                </span>
              </p>

              <p class="line line-total">
                <span>Producto · x{{ it.qty }}</span>
                <span>{{ fmtCOP(it.basePrice * it.qty) }}</span>
              </p>

              <button class="remove-link" type="button" @click="remove(it.uid)">
                Quitar
              </button>
            </div>
          </div>
        </ion-item>
      </ion-list>

      <div v-if="items.length" class="spacer" />

      <!-- Totales -->
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
          <ion-input type="number" inputmode="numeric" class="ship" :value="shipping" @ionInput="onShip($event)"
            placeholder="0" />
        </div>
        <div class="row total">
          <span>Total a pagar</span>
          <strong>{{ fmtCOP(total) }}</strong>
        </div>
      </div>

      <!-- Aviso de disponibilidad -->
      <ion-card v-if="hasIssues && items.length" class="warn">
        <ion-card-content>
          <h3 class="warn-title">No podemos confirmar el pedido</h3>
          <ul class="warn-list" v-html="issuesHtml"></ul>
          <ion-button size="small" fill="outline" color="danger" @click="removeUnavailable">
            Quitar no disponibles
          </ion-button>
        </ion-card-content>
      </ion-card>
    </ion-content>

    <ion-footer v-if="items.length">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button color="medium" fill="outline" @click="clear">
            Vaciar carrito
          </ion-button>
        </ion-buttons>
        <ion-buttons slot="end">
          <ion-button color="primary" :disabled="checking || hasIssues || !items.length" @click="confirmarPedido">
            <ion-spinner v-if="checking" name="dots" />
            <span v-else>Confirmar pedido</span>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-footer>

    <ion-alert :is-open="alertOpen" header="No podemos confirmar" :message="issuesHtml" :buttons="['OK']"
      @didDismiss="alertOpen = false" />
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonButtons,
  IonButton,
  IonFooter,
  IonInput,
  IonBackButton,
  IonCard,
  IonCardContent,
  IonAlert,
  IonSpinner,
  IonItem,
} from '@ionic/vue'
import { useCart } from '@/controllers/useCart'
import { onMounted, ref, computed, watch } from 'vue'
import {
  validateAvailability,
  type AvailabilityIssue,
} from '@/services/AvailabilityService'
import { useRouter } from 'vue-router'

/* helper local: formato COP */
const fmtCOP = (n: number) =>
  (n ?? 0).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  })

const router = useRouter()

const {
  items,
  shipping,
  subtotalProducts,
  subtotalAdditions,
  subtotalDrinks,
  total,
  addOrIncrease,
  decrease,
  remove,
  clear,
  setShipping,
} = useCart()

function increase(it: any) {
  if (it.qty >= 5) return
  addOrIncrease({
    productId: it.productId,
    name: it.name,
    image_url: it.image_url,
    basePrice: it.basePrice,
    addition: it.addition,
    drink: it.drink,
    qty: 1,
  })
}

function onShip(ev: any) {
  const v = Number(ev?.target?.value ?? ev?.detail?.value ?? 0)
  setShipping(v)
}

const checking = ref(false)
const issues = ref<AvailabilityIssue[]>([])
const alertOpen = ref(false)

const hasIssues = computed(() => issues.value.length > 0)
const issuesHtml = computed(() =>
  issues.value
    .map((i) => {
      const k =
        i.kind === 'product'
          ? 'Producto'
          : i.kind === 'addition'
            ? 'Adición'
            : 'Bebida'
      return `• ${k}: ${i.name ?? i.id} no está disponible`
    })
    .join('<br/>'),
)

async function checkNow() {
  checking.value = true
  try {
    issues.value = await validateAvailability(items.value)
    if (issues.value.length) alertOpen.value = true
  } finally {
    checking.value = false
  }
}

function removeUnavailable() {
  for (let i = items.value.length - 1; i >= 0; i--) {
    const it = items.value[i]
    const bad = issues.value.some(
      (x) =>
        (x.kind === 'product' && x.id === it.productId) ||
        (x.kind === 'addition' && x.id === it.addition?.id) ||
        (x.kind === 'drink' && x.id === it.drink?.id),
    )
    if (bad) remove(it.uid)
  }
  issues.value = []
}

onMounted(() => {
  checkNow()
})
watch(items, checkNow, { deep: true })

async function confirmarPedido() {
  await checkNow()
  if (hasIssues.value) return
  try {
    await router.push('/payment')
  } catch (navErr) {
    console.error('Navigation to /payment failed:', navErr)
    // Try named route as fallback
    try {
      await router.push({ name: 'payment' })
      return
    } catch (e2) {
      console.error('Fallback navigation by name also failed:', e2)
    }

    // Fallback: show a simple alert so the user knows
    try { alert('No se pudo ir a la pasarela de pago. Intenta nuevamente.') } catch {}
  }
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

/* Card del item */
.cart-item {
  --background: #ffffff;
  --inner-padding-start: 0;
  --inner-padding-end: 0;
  margin-bottom: 10px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.16);
}

.cart-item-inner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  width: 100%;
}

/* Imagen */
.thumb-wrapper {
  width: 68px;
  height: 68px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
  background: #f3f4f6;
}

.thumb-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Texto + controles */
.cart-main {
  flex: 1 1 auto;
  min-width: 0;
  display: grid;
  gap: 4px;
}

.cart-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.product-name {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  word-break: break-word;
}

/* Controles de cantidad */
.qty-controls {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.qty-btn {
  --padding-start: 6px;
  --padding-end: 6px;
  min-width: 32px;
}

.qty-pill {
  min-width: 24px;
  text-align: center;
  font-weight: 700;
  font-size: 13px;
}

/* Líneas de detalle */
.line {
  margin: 0;
  font-size: 13px;
  display: flex;
  justify-content: space-between;
  gap: 6px;
  color: var(--ion-color-medium);
}

.line-label {
  white-space: nowrap;
}

.line-value {
  text-align: right;
  flex: 1 1 auto;
}

.line-total {
  margin-top: 2px;
  font-weight: 600;
  color: var(--ion-text-color);
}

/* Quitar */
.remove-link {
  margin-top: 2px;
  padding: 0;
  border: none;
  background: none;
  color: var(--ion-color-danger, #ef4444);
  font-size: 12px;
  font-weight: 600;
  text-align: left;
}

/* Layout responsive: en pantallas muy pequeñas, apilar */
@media (max-width: 360px) {
  .cart-item-inner {
    align-items: flex-start;
  }

  .cart-header-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}

/* General */
.spacer {
  flex: 1 1 auto;
}

.empty {
  text-align: center;
  color: var(--ion-color-medium);
  margin-top: 16px;
}

/* Totales */
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

/* Aviso */
.warn {
  border: 1px solid #fde7e7;
  background: #fff7f7;
}

.warn-title {
  margin: 0 0 6px;
  color: #b71c1c;
  font-weight: 800;
}

.warn-list {
  margin: 0 0 8px;
  padding-left: 16px;
}

/* Dark mode – bordes un poco más suaves */
@media (prefers-color-scheme: dark) {
  .cart-item {
    --background: #262728;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.45);
  }

  .totals {
    border-top-color: #3f3f46;
  }

  .row.total {
    border-top-color: #3f3f46;
  }
}
</style>