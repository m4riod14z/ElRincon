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
        <ion-item v-for="it in items" :key="it.uid" lines="full">
          <ion-thumbnail slot="start" v-if="it.image_url">
            <img :src="it.image_url" alt="" />
          </ion-thumbnail>
          <ion-label>
            <h3>{{ it.name }}</h3>
            <p v-if="it.addition">Adición: {{ it.addition.name }} ({{ fmtCOP(it.addition.price) }})</p>
            <p v-if="it.drink">Bebida: {{ it.drink.name }} ({{ fmtCOP(it.drink.price) }})</p>
            <p class="price">{{ fmtCOP(it.basePrice) }} · x{{ it.qty }}</p>
          </ion-label>
          <ion-buttons slot="end">
            <ion-button size="small" fill="outline" @click="decrease(it.uid)">-</ion-button>
            <ion-button size="small" fill="outline" @click="increase(it)">+</ion-button>
            <ion-button size="small" color="danger" @click="remove(it.uid)">Quitar</ion-button>
          </ion-buttons>
        </ion-item>
      </ion-list>

      <div v-if="items.length" class="spacer"></div>

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
          <ion-button color="medium" fill="outline" @click="clear">Vaciar carrito</ion-button>
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
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonButtons, IonButton,
  IonFooter, IonInput, IonBackButton, IonCard, IonCardContent, IonAlert, IonSpinner,
  IonItem, IonLabel, IonThumbnail
} from '@ionic/vue'
import { useCart } from '@/controllers/useCart'
import { onMounted, ref, computed, watch } from 'vue'
import { validateAvailability, type AvailabilityIssue } from '@/services/AvailabilityService'
import { useRouter } from 'vue-router'

/* helper local: formato COP */
const fmtCOP = (n: number) =>
  (n ?? 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

const router = useRouter()

const {
  items, shipping, subtotalProducts, subtotalAdditions, subtotalDrinks, total,
  addOrIncrease, decrease, remove, clear, setShipping
} = useCart()

function increase(it: any) {
  addOrIncrease({
    productId: it.productId,
    name: it.name,
    image_url: it.image_url,
    basePrice: it.basePrice,
    addition: it.addition,
    drink: it.drink,
    qty: 1
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
  issues.value.map(i => {
    const k = i.kind === 'product' ? 'Producto' : i.kind === 'addition' ? 'Adición' : 'Bebida'
    return `• ${k}: ${i.name ?? i.id} no está disponible`
  }).join('<br/>')
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
    const bad = issues.value.some(x =>
      (x.kind === 'product' && x.id === it.productId) ||
      (x.kind === 'addition' && x.id === it.addition?.id) ||
      (x.kind === 'drink' && x.id === it.drink?.id)
    )
    if (bad) remove(it.uid)   // <- uid string
  }
  issues.value = []
}

onMounted(checkNow)
watch(items, checkNow, { deep: true })

/* Confirmar: si ok, vamos a /payment */
async function confirmarPedido() {
  await checkNow()
  if (hasIssues.value) return
  router.push('/payment')
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

.price {
  margin: 4px 0 0;
  font-weight: 600;
}

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
</style>
