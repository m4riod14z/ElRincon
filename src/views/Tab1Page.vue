<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>El Rincón</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="clear" @click="goCart">
            <ion-icon :icon="cartOutline" />
            <ion-badge v-if="totalQty > 0" class="cart-badge">{{ totalQty }}</ion-badge>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>

      <ion-toolbar>
        <!-- 🔎 ahora sí filtra -->
        <ion-searchbar
          placeholder="Buscar en El Rincón"
          v-model="searchQuery"
          @ionInput="onSearch"
        />
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding with-custom-tabs view-fade-up">
      <div v-if="currentFeatured" class="featured-container">
        <div class="featured-card" @click="abrirDetalle(currentFeatured)">
          <transition name="featured-fade" mode="out-in">
            <div class="featured-slide" :key="currentFeaturedKey">
              <div class="featured-media">
                <img :src="currentFeatured.image_url || '/Logo.png'" :alt="currentFeatured.name || 'Producto destacado'" />
              </div>
              <div class="featured-info">
                <p class="featured-label">Recomendado</p>
                <h2 class="featured-name">{{ currentFeatured.name }}</h2>
                <p class="featured-price">{{ fmtCOP(currentFeatured.price ?? 0) }}</p>
                <p class="featured-desc">{{ currentFeatured.description || 'Pronto compartiremos mas detalles.' }}</p>
                <div class="featured-progress">
                  {{ currentFeaturedIndex + 1 }} / {{ featuredProducts.length }}
                </div>
              </div>
            </div>
          </transition>
        </div>
      </div>

      <div v-if="error" class="err">{{ error }}</div>

      <div v-else class="menu-sections">
        <!-- 👇 usamos gruposFiltrados -->
        <section
          v-for="cat in gruposFiltrados"
          :key="cat.nombre"
          class="section"
        >
          <h2 class="section-title">{{ cat.nombre }}</h2>

          <div class="carousel">
            <button
              v-for="item in cat.items"
              :key="item.id"
              class="card"
              type="button"
              @click="abrirDetalle(item)"
            >
              <img :src="item.image_url || '/Logo.png'" :alt="item.name || 'Producto'" />
              <h3 class="card-title">{{ item.name }}</h3>
              <p class="precio">{{ fmtCOP(item.price) }}</p>
            </button>
          </div>
        </section>

        <!-- Estado vacío cuando no hay coincidencias -->
        <div v-if="gruposFiltrados.length === 0" class="ion-text-center ion-padding">
          <p>No encontramos productos para “{{ searchQuery }}”.</p>
        </div>
      </div>
    </ion-content>

    <!-- ======= MODAL DE DETALLE ======= -->
    <ion-modal :is-open="detalleAbierto" @didDismiss="cerrarDetalle" :can-dismiss="true">
      <ion-header>
        <ion-toolbar>
          <ion-title>Detalle</ion-title>
          <ion-buttons slot="end">
            <ion-button fill="clear" @click="cerrarDetalle">Cerrar</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <ion-content class="ion-padding detail-content">
        <div class="detail-wrap" v-if="seleccionado">
          <img class="detail-img" :src="seleccionado.image_url || '/Logo.png'" :alt="seleccionado.name || 'Producto'" />
          <h2 class="detail-title">{{ seleccionado.name }}</h2>
          <p class="detail-desc">{{ seleccionado.description }}</p>

          <!-- Bloque de precios -->
          <div class="price-block">
            <div class="base">
              <span>Precio base</span>
              <strong>{{ fmtCOP(seleccionado.price) }}</strong>
            </div>

            <div class="row">
              <span class="label">Adición</span>
              <span class="name">{{ selectedAddition?.name ?? 'Ninguna' }}</span>
              <strong>{{ fmtCOP(selectedAddition?.price ?? 0) }}</strong>
            </div>

            <div class="row">
              <span class="label">Bebida</span>
              <span class="name">{{ selectedDrink?.name ?? 'Ninguna' }}</span>
              <strong>{{ fmtCOP(selectedDrink?.price ?? 0) }}</strong>
            </div>

            <div class="total-line">
              <span>Total</span>
              <strong class="total-amount">{{ fmtCOP(total) }}</strong>
            </div>
          </div>
        </div>
      </ion-content>

      <!-- Botones -->
      <div class="detail-actions">
        <ion-button expand="block" fill="outline" color="medium" @click="openAddSheet">
          Añadir adición
        </ion-button>
        <ion-button expand="block" fill="outline" color="medium" @click="openDrinkSheet">
          Añadir bebida
        </ion-button>
        <ion-button expand="block" color="primary" @click="anadirAlCarrito">
          Añadir al carrito
        </ion-button>
      </div>
    </ion-modal>

    <!-- Action Sheets -->
    <ion-action-sheet
      :is-open="showAddSheet"
      header="Selecciona una adición"
      :buttons="additionActions"
      @didDismiss="showAddSheet = false"
    />
    <ion-action-sheet
      :is-open="showDrinkSheet"
      header="Selecciona una bebida"
      :buttons="drinkActions"
      @didDismiss="showDrinkSheet = false"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
  IonSearchbar, IonContent, IonModal, IonActionSheet, IonBadge
} from '@ionic/vue'
import { cartOutline } from 'ionicons/icons'
import { useRouter } from 'vue-router'

import { useCatalog } from '@/controllers/useCatalog'
import { useProductDetail } from '@/controllers/useProductDetail'
import { useCart } from '@/controllers/useCart'
import { fmtCOP } from '@/utils/money'

const router = useRouter()
function goCart() { router.push('/cart') }

// ==== Catálogo (grupos con items) ====
const { load, grupos, error } = useCatalog()
onMounted(load)

// ==== Carrito ====
const { addOrIncrease, totalQty } = useCart()

// ==== Búsqueda ====
const searchQuery = ref('')

/** Normaliza (lowercase + sin tildes) para buscar mejor */
function norm(s?: string | null) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

function onSearch(e: any) {
  // con v-model ya se actualiza, esto es por compatibilidad con ionInput
  searchQuery.value = e?.target?.value ?? searchQuery.value
}

/* Productos destacados hero */
const FEATURED_PRODUCT_NAMES = [
  'Carnivoria Personal',
  'Salchiranchera',
  'Nachos con carne',
  'Salchibowl',
  'Callejera'
]
const FEATURED_PRODUCT_KEYS = FEATURED_PRODUCT_NAMES.map(name => norm(name))

const featuredProducts = computed(() => {
  const all = (grupos.value ?? [])
    .flatMap((g: any) => g.items ?? [])
    .filter(Boolean)

  if (!all.length) return []

  const byNormalized = new Map<string, any>()
  for (const product of all) {
    const key = norm(product.name)
    if (key && !byNormalized.has(key)) byNormalized.set(key, product)
  }

  const selected = FEATURED_PRODUCT_KEYS
    .map(key => byNormalized.get(key))
    .filter(Boolean)

  if (!selected.length) return all.slice(0, 5)

  const selectedIds = new Set(selected.map((prod: any) => prod.id))
  const others = all.filter(prod => !selectedIds.has(prod.id))

  return [...selected, ...others].slice(0, 5)
})

const currentFeaturedIndex = ref(0)
const currentFeatured = computed(() => featuredProducts.value[currentFeaturedIndex.value] ?? null)
const currentFeaturedKey = computed(() => currentFeatured.value?.id ?? `featured-${currentFeaturedIndex.value}`)

const ROTATION_MS = 6000 // 6 s por tarjeta destacada
let featuredInterval: number | null = null

function stopFeaturedRotation() {
  if (featuredInterval !== null) {
    window.clearInterval(featuredInterval)
    featuredInterval = null
  }
}

function startFeaturedRotation() {
  stopFeaturedRotation()
  if (featuredProducts.value.length <= 1) return
  featuredInterval = window.setInterval(() => {
    const total = featuredProducts.value.length
    if (!total) return
    currentFeaturedIndex.value = (currentFeaturedIndex.value + 1) % total
  }, ROTATION_MS)
}

watch(featuredProducts, (list) => {
  if (!list.length) {
    stopFeaturedRotation()
    currentFeaturedIndex.value = 0
    return
  }
  if (currentFeaturedIndex.value >= list.length) currentFeaturedIndex.value = 0
  startFeaturedRotation()
}, { immediate: true })

onBeforeUnmount(stopFeaturedRotation)

/**
 * Construye una copia de `grupos` aplicando filtro por nombre/descripcion.
 * Oculta grupos vacíos cuando hay texto de búsqueda.
 */
const gruposFiltrados = computed(() => {
  const q = norm(searchQuery.value)
  if (!q) return grupos.value

  // clona por si acaso (grupos.value podría ser readonly)
  return (grupos.value || [])
    .map(g => ({
      nombre: g.nombre,
      items: (g.items || []).filter((it: any) => {
        const inName = norm(it.name).includes(q)
        const inDesc = norm(it.description).includes(q)
        return inName || inDesc
      })
    }))
    .filter(g => g.items.length > 0)
})

// ==== Detalle y extras ====
const detalleAbierto = ref(false)
const seleccionado = ref<any>(null)

function abrirDetalle(p: any) { seleccionado.value = p; detalleAbierto.value = true }
function cerrarDetalle() { detalleAbierto.value = false; seleccionado.value = null; clearSelections() }

const basePrice = computed(() => seleccionado.value?.price ?? 0)

const {
  additions, drinks,
  selectedAdditionId, selectedDrinkId,
  selectedAddition, selectedDrink, total,
  loadAdditionsOnce, loadDrinksOnce, clearSelections
} = useProductDetail(basePrice as unknown as { value: number })

const showAddSheet = ref(false)
const showDrinkSheet = ref(false)
async function openAddSheet() { await loadAdditionsOnce(); showAddSheet.value = true }
async function openDrinkSheet() { await loadDrinksOnce(); showDrinkSheet.value = true }

const additionActions = computed(() => {
  const opts = (additions.value ?? []).map(a => ({
    text: `${a.name} — ${fmtCOP(a.price)}`,
    handler: () => { selectedAdditionId.value = a.id }
  }))
  return [{ text: 'Ninguna', handler: () => { selectedAdditionId.value = null } }, ...opts, { text: 'Cancelar', role: 'cancel' as const }]
})
const drinkActions = computed(() => {
  const opts = (drinks.value ?? []).map(d => ({
    text: `${d.name} — ${fmtCOP(d.price)}`,
    handler: () => { selectedDrinkId.value = d.id }
  }))
  return [{ text: 'Ninguna', handler: () => { selectedDrinkId.value = null } }, ...opts, { text: 'Cancelar', role: 'cancel' as const }]
})

function anadirAlCarrito() {
  if (!seleccionado.value) return
  addOrIncrease({
    productId: seleccionado.value.id,
    name: seleccionado.value.name,
    image_url: seleccionado.value.image_url || null,
    basePrice: seleccionado.value.price,
    addition: selectedAddition.value
      ? { id: selectedAddition.value.id, name: selectedAddition.value.name, price: selectedAddition.value.price }
      : null,
    drink: selectedDrink.value
      ? { id: selectedDrink.value.id, name: selectedDrink.value.name, price: selectedDrink.value.price }
      : null,
    qty: 1
  })
  cerrarDetalle()
}
</script>

<style scoped>
.with-custom-tabs {
  --padding-bottom: calc(64px + var(--ion-safe-area-bottom));
}

.featured-container {
  margin: 0 auto 16px;
  width: min(480px, 100%);
}

.featured-card {
  width: 100%;
  min-height: 200px;
  border-radius: 14px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.93);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  cursor: pointer;
}

.featured-slide {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

@media (min-width: 768px) {
  .featured-slide {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 0.75fr);
    align-items: center;
    gap: 14px;
  }
}

.featured-media {
  width: 100%;
  height: clamp(180px, 50vw, 260px);
  border-radius: 12px;
  overflow: hidden;
  background: #fff3e0;
  display: flex;
  flex-shrink: 0;
}

.featured-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.featured-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.featured-label {
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-size: 10px;
  color: #a855f7;
  margin: 0 0 4px;
}

.featured-name {
  font-size: clamp(16px, 3vw, 22px);
  margin: 0;
  font-weight: 800;
}

.featured-price {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #ea580c;
}

.featured-desc {
  margin: 0 0 6px;
  color: #475569;
  font-size: 12px;
}

.featured-progress {
  margin-top: auto;
  font-size: 13px;
  color: #94a3b8;
}

.featured-fade-enter-active,
.featured-fade-leave-active {
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.featured-fade-enter-from,
.featured-fade-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

.cart-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  transform: translate(35%, -35%);
  font-size: 10px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Secciones */
.menu-sections {
  display: grid;
  gap: 18px;
}

.section {
  display: grid;
  gap: 10px;
}

.section-title {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
}

/* Cards */
.carousel {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.card {
  background: var(--ion-item-background, #fff);
  border-radius: 12px;
  padding: 8px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, .08);
  min-width: 150px;
  max-width: 180px;
  border: 1px solid #f1f5f9;
}

.card img {
  width: 100%;
  height: 110px;
  object-fit: cover;
  border-radius: 10px;
}

.card-title {
  font-size: 14px;
  margin: 6px 0 2px;
  font-weight: 600;
  /* Adapt text color to theme */
  color: var(--ion-text-color);
}

.precio {
  color: rgb(30, 51, 183);
  font-weight: 700;
  font-size: 13px;
  margin: 0;
}

/* ======= Detalle ======= */
.detail-content {
  --background: #fffffe;
}

.detail-wrap {
  max-width: 520px;
  margin: 0 auto;
  display: grid;
  gap: 12px;
}

.detail-img {
  width: 100%;
  height: 220px;
  object-fit: cover;
  border-radius: 12px;
}

.detail-title {
  margin: 0;
  font-weight: 800;
  font-size: 22px;
}

.detail-desc {
  margin: 0;
  color: var(--ion-color-medium);
}

.price-block {
  display: grid;
  gap: 6px;
  margin: 8px 0;
}

.base {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--ion-color-medium);
  font-size: 15px;
}

.base strong {
  color: #000;
}

.row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 6px;
  align-items: center;
  font-size: 14px;
  color: var(--ion-color-medium);
  margin-left: 4px;
}

.label { white-space: nowrap; }
.name { text-align: left; color: #000; }

.row strong {
  font-weight: 600;
  color: var(--ion-color-medium);
}

.total-line {
  display: flex;
  justify-content: space-between;
  border-top: 1px solid #eee;
  padding-top: 6px;
  margin-top: 4px;
}

.total-amount {
  color: #1c5dcd;
  font-size: 20px;
  font-weight: 800;
}

.detail-actions {
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 12px 16px 16px;
  box-shadow: 0 -6px 10px rgba(0, 0, 0, .06);
  display: grid;
  gap: 8px;
}

.err { color: var(--ion-color-danger); margin-bottom: 8px; }

@media (prefers-color-scheme: dark) {
  .card { border-color: #000; }
}
body.dark .card { border-color: #000; }
</style>
