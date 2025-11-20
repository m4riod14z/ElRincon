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
        <div class="extra-additions-block">
          <div class="extra-additions-header">
            <div>
              <strong>¿Quieres agregar más adiciones?</strong>
              <p class="extra-label">Selecciona aderezos o toppings extra.</p>
            </div>
            <ion-button size="small" fill="outline" @click="extraAdditionFormOpen = !extraAdditionFormOpen">
              {{ extraAdditionFormOpen ? 'Cerrar' : 'Agregar adiciones' }}
            </ion-button>
          </div>
          <div v-if="extraAdditionFormOpen" class="extra-additions-form">
            <ion-select
              class="extra-additions-select"
              :disabled="additionsLoading"
              placeholder="Selecciona una adición"
              :interface="selectInterface"
              :interface-options="selectInterface === 'popover' ? selectPopoverOpts : undefined"
              ok-text="Aceptar"
              cancel-text="Cancelar"
              v-model="selectedAdditionId"
            >
              <ion-select-option value="none">Seleccionar</ion-select-option>
              <ion-select-option
                v-for="addition in availableAdditions"
                :key="addition.id"
                :value="String(addition.id)"
              >
                {{ addition.name }} ({{ fmtCOP(addition.price) }})
              </ion-select-option>
            </ion-select>
            <div class="addition-qty-field">
              <label>Cantidad</label>
              <ion-input
                class="addition-qty-input"
                type="number"
                inputmode="numeric"
                min="1"
                :value="selectedAdditionQty"
                @ionInput="selectedAdditionQty = Number($event?.target?.value ?? $event?.detail?.value ?? 1)"
              />
            </div>
            <ion-button size="small" @click="submitExtraAddition" :disabled="selectedAdditionId === 'none'">
              Agregar
            </ion-button>
          </div>
          <div v-if="extraAdditions.length" class="extra-additions-list">
            <div v-for="addition in extraAdditions" :key="addition.id" class="extra-addition-item">
              <div class="extra-addition-info">
                <span class="extra-addition-name">{{ addition.name }}</span>
                <small>{{ fmtCOP(addition.price) }} cada uno</small>
              </div>
              <div class="extra-addition-qty">
                <span class="qty-label">Cantidad</span>
                <ion-button size="small" fill="clear" @click="changeExtraAdditionQty(addition.id, addition.qty - 1)">-</ion-button>
                <span class="qty-value">{{ addition.qty }}</span>
                <ion-button size="small" fill="clear" @click="changeExtraAdditionQty(addition.id, addition.qty + 1)">+</ion-button>
              </div>
              <ion-button size="small" color="danger" fill="clear" @click="removeExtraAdditionItem(addition.id)">Quitar</ion-button>
            </div>
          </div>
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
        <div class="extra-drinks-block">
          <div class="extra-drinks-header">
            <div>
              <strong>¿Quieres agregar más bebidas?</strong>
              <p class="extra-label">Elige un tipo y cantidad para sumar al pedido.</p>
            </div>
            <ion-button size="small" fill="outline" @click="extraDrinkFormOpen = !extraDrinkFormOpen">
              {{ extraDrinkFormOpen ? 'Cerrar' : 'Agregar bebidas' }}
            </ion-button>
          </div>
          <div v-if="extraDrinkFormOpen" class="extra-drinks-form">
            <ion-select
              class="extra-drinks-select"
              :disabled="drinksLoading"
              placeholder="Selecciona una bebida"
              :interface="selectInterface"
              :interface-options="selectInterface === 'popover' ? selectPopoverOpts : undefined"
              ok-text="Aceptar"
              cancel-text="Cancelar"
              v-model="selectedDrinkId"
            >
              <ion-select-option value="none">Seleccionar</ion-select-option>
              <ion-select-option
                v-for="drink in availableDrinks"
                :key="drink.id"
                :value="String(drink.id)"
              >
                {{ drink.name }} ({{ fmtCOP(drink.price) }})
              </ion-select-option>
            </ion-select>
            <div class="drink-qty-field">
              <label>Cantidad</label>
              <ion-input
                class="drink-qty-input"
                type="number"
                inputmode="numeric"
                min="1"
                :value="selectedDrinkQty"
                @ionInput="selectedDrinkQty = Number($event?.target?.value ?? $event?.detail?.value ?? 1)"
              />
            </div>
            <ion-button size="small" @click="submitExtraDrink" :disabled="selectedDrinkId === 'none'">
              Agregar
            </ion-button>
          </div>
          <div v-if="extraDrinks.length" class="extra-drinks-list">
            <div v-for="drink in extraDrinks" :key="drink.id" class="extra-drink-item">
              <div class="extra-drink-info">
                <span class="extra-drink-name">{{ drink.name }}</span>
                <small>{{ fmtCOP(drink.price) }} cada uno</small>
              </div>
              <div class="extra-drink-qty">
                <span class="qty-label">Cantidad</span>
                <ion-button size="small" fill="clear" @click="changeExtraDrinkQty(drink.id, drink.qty - 1)">-</ion-button>
                <span class="qty-value">{{ drink.qty }}</span>
                <ion-button size="small" fill="clear" @click="changeExtraDrinkQty(drink.id, drink.qty + 1)">+</ion-button>
              </div>
              <ion-button size="small" color="danger" fill="clear" @click="removeExtra(drink.id)">Quitar</ion-button>
            </div>
          </div>
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
  IonItem, IonLabel, IonThumbnail, IonSelect, IonSelectOption, isPlatform
} from '@ionic/vue'
import { useCart } from '@/controllers/useCart'
import { onMounted, ref, computed, watch } from 'vue'
import { validateAvailability, type AvailabilityIssue } from '@/services/AvailabilityService'
import { useRouter } from 'vue-router'
import { fetchDrinks } from '@/models/drinks'
import { fetchAdditions } from '@/models/additions'
import type { OptionRow } from '@/models/types'

/* helper local: formato COP */
const fmtCOP = (n: number) =>
  (n ?? 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

const router = useRouter()

const {
  items, shipping, subtotalProducts, subtotalAdditions, subtotalDrinks, total,
  addOrIncrease, decrease, remove, clear, setShipping,
  extraDrinks, extraAdditions,
  addExtraDrink, updateExtraDrinkQty, removeExtraDrink,
  addExtraAddition, updateExtraAdditionQty, removeExtraAddition
} = useCart()

const availableDrinks = ref<OptionRow[]>([])
const extraDrinkFormOpen = ref(false)
const selectedDrinkId = ref<string>('none')
const selectedDrinkQty = ref<number>(1)
const drinksLoading = ref(false)

const availableAdditions = ref<OptionRow[]>([])
const extraAdditionFormOpen = ref(false)
const selectedAdditionId = ref<string>('none')
const selectedAdditionQty = ref<number>(1)
const additionsLoading = ref(false)
const isMobile = isPlatform('hybrid') || isPlatform('ios') || isPlatform('android') || isPlatform('mobile')
const selectInterface = isMobile ? 'alert' : 'popover'
const selectPopoverOpts = { cssClass: 'wide-select-popover' }

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

async function loadDrinkOptions() {
  if (drinksLoading.value) return
  drinksLoading.value = true
  try {
    availableDrinks.value = await fetchDrinks()
  } catch (err) {
    console.error('Error cargando bebidas', err)
    availableDrinks.value = []
  } finally {
    drinksLoading.value = false
  }
}

function submitExtraDrink() {
  const id = selectedDrinkId.value === 'none' ? null : Number(selectedDrinkId.value)
  const qty = Math.max(1, Number(selectedDrinkQty.value) || 1)
  if (!id) return
  const drink = availableDrinks.value.find(d => d.id === id)
  if (!drink) return
  addExtraDrink({ id: drink.id, name: drink.name, price: drink.price }, qty)
  selectedDrinkQty.value = 1
  selectedDrinkId.value = 'none'
  extraDrinkFormOpen.value = false
}

function changeExtraDrinkQty(id: number, qty: number) {
  updateExtraDrinkQty(id, qty)
}

function removeExtra(id: number) {
  removeExtraDrink(id)
}

async function loadAdditionOptions() {
  if (additionsLoading.value) return
  additionsLoading.value = true
  try {
    availableAdditions.value = await fetchAdditions()
  } catch (err) {
    console.error('Error cargando adiciones', err)
    availableAdditions.value = []
  } finally {
    additionsLoading.value = false
  }
}

function submitExtraAddition() {
  const id = selectedAdditionId.value === 'none' ? null : Number(selectedAdditionId.value)
  const qty = Math.max(1, Number(selectedAdditionQty.value) || 1)
  if (!id) return
  const addition = availableAdditions.value.find(a => a.id === id)
  if (!addition) return
  addExtraAddition({ id: addition.id, name: addition.name, price: addition.price }, qty)
  selectedAdditionQty.value = 1
  selectedAdditionId.value = 'none'
  extraAdditionFormOpen.value = false
}

function changeExtraAdditionQty(id: number, qty: number) {
  updateExtraAdditionQty(id, qty)
}

function removeExtraAdditionItem(id: number) {
  removeExtraAddition(id)
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

onMounted(() => {
  checkNow()
  loadDrinkOptions()
  loadAdditionOptions()
})
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

.extra-drinks-block,
.extra-additions-block {
  border: 1px dashed rgba(0, 0, 0, 0.15);
  border-radius: 10px;
  padding: 10px;
  display: grid;
  gap: 8px;
}

.extra-drinks-header,
.extra-additions-header {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
  font-size: 0.9rem;
}

.extra-label {
  margin: 0;
  color: var(--ion-color-medium);
  font-size: 0.8rem;
}

.extra-drinks-form,
.extra-additions-form {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.extra-drinks-select,
.extra-additions-select {
  flex: 1 1 400px;
  min-width: 320px;
  width: 100%;
  max-width: 640px;
}

.drink-qty-field,
.addition-qty-field {
  display: flex;
  flex-direction: column;
  min-width: 100px;
}

.drink-qty-field label,
.addition-qty-field label {
  font-size: 0.75rem;
  color: var(--ion-color-medium);
  margin-bottom: 2px;
}

.drink-qty-input,
.addition-qty-input {
  max-width: 120px;
}

.extra-drinks-list,
.extra-additions-list {
  display: grid;
  gap: 6px;
}

.extra-drink-item,
.extra-addition-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 0.85rem;
  border-top: 1px dotted rgba(0, 0, 0, 0.15);
  padding-top: 6px;
}

.extra-drink-qty,
.extra-addition-qty {
  display: flex;
  align-items: center;
  gap: 4px;
}

.extra-drink-info,
.extra-addition-info {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
}

.extra-drink-name,
.extra-addition-name {
  font-weight: 600;
}

.qty-label {
  font-size: 0.75rem;
  color: var(--ion-color-medium);
  margin-right: 4px;
}

.qty-value {
  font-weight: 600;
  min-width: 20px;
  text-align: center;
}

:global(.wide-select-popover) {
  --width: min(900px, 98vw);
}

:global(.wide-select-popover .popover-content),
:global(.wide-select-popover .popover-content.sc-ion-popover-md),
:global(.wide-select-popover .popover-content.sc-ion-popover-ios) {
  width: min(900px, 98vw);
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



