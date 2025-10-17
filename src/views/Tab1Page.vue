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

    <ion-content class="ion-padding with-custom-tabs">
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
        <ion-button expand="block" fill="outline" color="tertiary" @click="openDrinkSheet">
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
import { ref, computed, onMounted } from 'vue'
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
  background: #fff;
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
  color: black;
}

.precio {
  color: red;
  font-weight: 700;
  font-size: 13px;
  margin: 0;
}

/* ======= Detalle ======= */
.detail-content {
  --background: #fff;
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
  color: #d32f2f;
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
</style>
