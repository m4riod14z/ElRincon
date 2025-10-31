<template>
  <ion-page>
    <ion-header translucent>
      <ion-toolbar>
        <ion-title>Panel del Restaurante</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding" fullscreen>
      <section class="section">
        <div class="section-header">
          <h2>Productos</h2>
          <ion-button size="small" @click="openProductForm()">Nuevo</ion-button>
        </div>
        <div class="carousel">
          <div class="slide" v-for="p in products" :key="p.id">
            <div class="card">
              <img :src="p.image_url || '/Logo.png'" alt="Producto" class="thumb" />
              <div class="info">
                <div class="title">{{ p.name }}</div>
                <div class="price">{{ fmtCOP(p.price) }}</div>
              </div>
              <div class="actions">
                <ion-toggle :checked="p.available" @ionChange="toggleProduct(p)">
                  {{ p.available ? 'Disponible' : 'No disponible' }}
                </ion-toggle>
                <div class="row">
                  <ion-button size="small" fill="clear" @click="openProductForm(p)">Editar</ion-button>
                  <ion-button size="small" color="danger" fill="clear" @click="removeProduct(p)">Eliminar</ion-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-header">
          <h2>Adiciones</h2>
          <ion-button size="small" @click="openOptionForm('addition')">Nueva</ion-button>
        </div>
        <div class="carousel">
          <div class="slide" v-for="a in additions" :key="a.id">
            <div class="card">
              <img src="/Logo.png" alt="Adición" class="thumb" />
              <div class="info">
                <div class="title">{{ a.name }}</div>
                <div class="price">{{ fmtCOP(a.price) }}</div>
              </div>
              <div class="actions">
                <ion-toggle :checked="!!a.available" @ionChange="toggleAddition(a)">
                  {{ a.available ? 'Disponible' : 'No disponible' }}
                </ion-toggle>
                <div class="row">
                  <ion-button size="small" fill="clear" @click="openOptionForm('addition', a)">Editar</ion-button>
                  <ion-button size="small" color="danger" fill="clear" @click="removeAddition(a)">Eliminar</ion-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-header">
          <h2>Bebidas</h2>
          <ion-button size="small" @click="openOptionForm('drink')">Nueva</ion-button>
        </div>
        <div class="carousel">
          <div class="slide" v-for="d in drinks" :key="d.id">
            <div class="card">
              <img src="/Logo.png" alt="Bebida" class="thumb" />
              <div class="info">
                <div class="title">{{ d.name }}</div>
                <div class="price">{{ fmtCOP(d.price) }}</div>
              </div>
              <div class="actions">
                <ion-toggle :checked="!!d.available" @ionChange="toggleDrink(d)">
                  {{ d.available ? 'Disponible' : 'No disponible' }}
                </ion-toggle>
                <div class="row">
                  <ion-button size="small" fill="clear" @click="openOptionForm('drink', d)">Editar</ion-button>
                  <ion-button size="small" color="danger" fill="clear" @click="removeDrink(d)">Eliminar</ion-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Modal productos -->
      <ion-modal :is-open="showProductModal" @didDismiss="closeProductForm">
        <ion-header>
          <ion-toolbar>
            <ion-title>{{ productForm.id ? 'Editar' : 'Crear' }} producto</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeProductForm">Cerrar</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-item>
            <ion-label position="stacked">Nombre</ion-label>
            <ion-input v-model="productForm.name" />
          </ion-item>
          <ion-text color="danger" v-if="errors.name">{{ errors.name }}</ion-text>

          <ion-item>
            <ion-label position="stacked">Precio</ion-label>
            <ion-input type="number" v-model.number="productForm.price" />
          </ion-item>
          <ion-text color="danger" v-if="errors.price">{{ errors.price }}</ion-text>

          <ion-item>
            <ion-label position="stacked">Imagen (URL)</ion-label>
            <ion-input v-model="productForm.image_url" />
          </ion-item>
          <ion-text color="danger" v-if="errors.image_url">{{ errors.image_url }}</ion-text>

          <ion-item>
            <ion-label position="stacked">Categoría</ion-label>
            <ion-input v-model="productForm.category" />
          </ion-item>

          <ion-button expand="block" class="ion-margin-top" @click="saveProduct" :disabled="saving">
            {{ saving ? 'Guardando…' : 'Guardar' }}
          </ion-button>
        </ion-content>
      </ion-modal>

      <!-- Modal opciones (adición/bebida) -->
      <ion-modal :is-open="showOptionModal" @didDismiss="closeOptionForm">
        <ion-header>
          <ion-toolbar>
            <ion-title>{{ optionKindLabel }} {{ optionForm.id ? 'editar' : 'nueva' }}</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeOptionForm">Cerrar</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-item>
            <ion-label position="stacked">Nombre</ion-label>
            <ion-input v-model="optionForm.name" />
          </ion-item>
          <ion-text color="danger" v-if="errors.name">{{ errors.name }}</ion-text>

          <ion-item>
            <ion-label position="stacked">Precio</ion-label>
            <ion-input type="number" v-model.number="optionForm.price" />
          </ion-item>
          <ion-text color="danger" v-if="errors.price">{{ errors.price }}</ion-text>

          <ion-button expand="block" class="ion-margin-top" @click="saveOption" :disabled="saving">
            {{ saving ? 'Guardando…' : 'Guardar' }}
          </ion-button>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
  
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, computed } from 'vue'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonToggle, IonModal,
  IonItem, IonLabel, IonInput, IonText, IonButtons
} from '@ionic/vue'
import { fmtCOP } from '@/utils/money'
import type { Product, OptionRow } from '@/models/types'
import { fetchAllProducts, upsertProduct, deleteProductById, setProductAvailability } from '@/models/products'
import { fetchAllAdditions, upsertAddition, deleteAdditionById, setAdditionAvailability } from '@/models/additions'
import { fetchAllDrinks, upsertDrink, deleteDrinkById, setDrinkAvailability } from '@/models/drinks'

// Sin IonSlides (Ionic v8). Carrusel simple por CSS.

const products = ref<Product[]>([])
const additions = ref<OptionRow[]>([])
const drinks = ref<OptionRow[]>([])
const loading = ref(false)
const saving = ref(false)

async function loadAll() {
  loading.value = true
  try {
    const [p, a, d] = await Promise.all([
      fetchAllProducts(),
      fetchAllAdditions(),
      fetchAllDrinks(),
    ])
    products.value = p
    additions.value = a
    drinks.value = d
  } finally {
    loading.value = false
  }
}

onMounted(loadAll)

// Producto modal state
const showProductModal = ref(false)
const productForm = reactive<Partial<Product>>({ id: undefined, name: '', price: 0, image_url: '', category: '', available: true })

function openProductForm(p?: Product) {
  if (p) Object.assign(productForm, p)
  else Object.assign(productForm, { id: undefined, name: '', price: 0, image_url: '', category: '', available: true })
  showProductModal.value = true
}
function closeProductForm() { showProductModal.value = false }

// Option modal state
type OptionKind = 'addition' | 'drink'
const optionKind = ref<OptionKind>('addition')
const optionKindLabel = computed(() => optionKind.value === 'addition' ? 'Adición' : 'Bebida')
const showOptionModal = ref(false)
const optionForm = reactive<Partial<OptionRow>>({ id: undefined, name: '', price: 0, available: true })

function openOptionForm(kind: OptionKind, row?: OptionRow) {
  optionKind.value = kind
  if (row) Object.assign(optionForm, row)
  else Object.assign(optionForm, { id: undefined, name: '', price: 0, available: true })
  showOptionModal.value = true
}
function closeOptionForm() { showOptionModal.value = false }

// Validation
const errors = reactive<{ name?: string; price?: string; image_url?: string }>({})

function validateCommon(name: string, price: number) {
  errors.name = ''
  errors.price = ''
  if (!name || name.trim().length < 2 || name.trim().length > 80) {
    errors.name = 'El nombre debe tener entre 2 y 80 caracteres'
  }
  if (typeof price !== 'number' || isNaN(price) || price <= 0) {
    errors.price = 'El precio debe ser mayor que 0'
  }
  return !errors.name && !errors.price
}

function validateImageUrl(url?: string | null) {
  errors.image_url = ''
  if (!url) return true
  try {
    // acepta http/https
    const u = new URL(url)
    if (!/^https?:$/.test(u.protocol)) throw new Error('Protocolo no válido')
    return true
  } catch {
    errors.image_url = 'La imagen debe ser una URL válida (http/https)'
    return false
  }
}

// Save handlers
async function saveProduct() {
  const ok = validateCommon(productForm.name || '', Number(productForm.price)) && validateImageUrl(productForm.image_url as string | undefined)
  if (!ok) return
  saving.value = true
  try {
    const saved = await upsertProduct({
      id: productForm.id as number | undefined,
      name: (productForm.name || '').trim(),
      price: Number(productForm.price),
      image_url: (productForm.image_url || '') as string,
      category: (productForm.category || '') as string,
      available: productForm.available ?? true,
    })
    const idx = products.value.findIndex(p => p.id === saved.id)
    if (idx >= 0) products.value.splice(idx, 1, saved)
    else products.value.unshift(saved)
    closeProductForm()
  } finally { saving.value = false }
}

async function saveOption() {
  const ok = validateCommon(optionForm.name || '', Number(optionForm.price))
  if (!ok) return
  saving.value = true
  try {
    if (optionKind.value === 'addition') {
      const saved = await upsertAddition({ id: optionForm.id as number | undefined, name: (optionForm.name || '').trim(), price: Number(optionForm.price), available: optionForm.available ?? true })
      const idx = additions.value.findIndex(a => a.id === saved.id)
      if (idx >= 0) additions.value.splice(idx, 1, saved)
      else additions.value.unshift(saved)
    } else {
      const saved = await upsertDrink({ id: optionForm.id as number | undefined, name: (optionForm.name || '').trim(), price: Number(optionForm.price), available: optionForm.available ?? true })
      const idx = drinks.value.findIndex(d => d.id === saved.id)
      if (idx >= 0) drinks.value.splice(idx, 1, saved)
      else drinks.value.unshift(saved)
    }
    closeOptionForm()
  } finally { saving.value = false }
}

// Toggle handlers
async function toggleProduct(p: Product) {
  const next = !p.available
  await setProductAvailability(p.id, next)
  p.available = next
}
async function toggleAddition(a: OptionRow) {
  const next = !a.available
  await setAdditionAvailability(a.id, !!next)
  a.available = !!next
}
async function toggleDrink(d: OptionRow) {
  const next = !d.available
  await setDrinkAvailability(d.id, !!next)
  d.available = !!next
}

// Delete handlers
async function removeProduct(p: Product) {
  await deleteProductById(p.id)
  products.value = products.value.filter(x => x.id !== p.id)
}
async function removeAddition(a: OptionRow) {
  await deleteAdditionById(a.id)
  additions.value = additions.value.filter(x => x.id !== a.id)
}
async function removeDrink(d: OptionRow) {
  await deleteDrinkById(d.id)
  drinks.value = drinks.value.filter(x => x.id !== d.id)
}
</script>

<style scoped>
.section { margin-bottom: 24px; }
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.carousel { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 6px; scroll-snap-type: x mandatory; }
.slide { flex: 0 0 auto; scroll-snap-align: start; }
.card { width: 240px; background: var(--ion-background-color-step-50,#1e1e1e); border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.15); display: grid; gap: 8px; }
.thumb { width: 100%; height: 120px; object-fit: cover; background: #eee; }
.info { padding: 8px 12px; display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
.title { font-weight: 700; font-size: 14px; }
.price { font-weight: 600; color: var(--ion-color-primary); }
.actions { padding: 4px 8px 8px; display: grid; gap: 6px; }
.row { display: flex; gap: 8px; }
</style>
