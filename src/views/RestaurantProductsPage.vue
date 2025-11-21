<template>
  <ion-page>
    <ion-content class="ion-padding" fullscreen>
      <!-- ========== PRODUCTOS ========== -->
      <section class="section">
        <div class="section-header">
          <h2>Productos</h2>
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

      <!-- ========== ADICIONES ========== -->
      <section class="section">
        <div class="section-header">
          <h2>Adiciones</h2>
        </div>
        <div class="carousel">
          <div class="slide" v-for="a in additions" :key="a.id">
            <div class="card">
              <img :src="a.image_url || '/Logo.png'" alt="Adición" class="thumb" />
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

      <!-- ========== BEBIDAS ========== -->
      <section class="section">
        <div class="section-header">
          <h2>Bebidas</h2>
        </div>
        <div class="carousel">
          <div class="slide" v-for="d in drinks" :key="d.id">
            <div class="card">
              <img :src="d.image_url || '/Logo.png'" alt="Bebida" class="thumb" />
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

      <!-- ========== MODAL PRODUCTO ========== -->
      <ion-modal :is-open="showProductModal" @didDismiss="closeProductForm">
        <ion-header>
          <ion-toolbar>
            <ion-title>Editar producto</ion-title>
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
            <ion-label position="stacked">Categoría</ion-label>
            <ion-select v-model="productForm.category" interface="popover" placeholder="Selecciona una categoría">
              <ion-select-option value="Personales">Personales</ion-select-option>
              <ion-select-option value="Dobles">Dobles</ion-select-option>
              <ion-select-option value="Para 3">Para 3</ion-select-option>
              <ion-select-option value="Para 4">Para 4</ion-select-option>
              <ion-select-option value="Para 7-8">Para 7-8</ion-select-option>
              <ion-select-option value="Desgranados">Desgranados</ion-select-option>
              <ion-select-option value="Nachos">Nachos</ion-select-option>
            </ion-select>
          </ion-item>

          <ion-button expand="block" class="ion-margin-top" @click="saveProduct" :disabled="saving">
            {{ saving ? 'Guardando…' : 'Guardar' }}
          </ion-button>
        </ion-content>
      </ion-modal>

      <!-- ========== MODAL OPCIONES (ADICIÓN / BEBIDA) ========== -->
      <ion-modal :is-open="showOptionModal" @didDismiss="closeOptionForm">
        <ion-header>
          <ion-toolbar>
            <ion-title>Editar {{ optionKindLabel }}</ion-title>
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
  IonPage,
  IonContent,
  IonButton,
  IonToggle,
  IonModal,
  IonItem,
  IonLabel,
  IonInput,
  IonText,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonSelect,
  IonSelectOption,
} from '@ionic/vue'
import { fmtCOP } from '@/utils/money'
import type { Product, OptionRow } from '@/models/types'
import {
  fetchAllProducts,
  deleteProductById,
  setProductAvailability,
  upsertProduct,
} from '@/models/products'
import {
  fetchAllAdditions,
  deleteAdditionById,
  setAdditionAvailability,
  upsertAddition,
} from '@/models/additions'
import {
  fetchAllDrinks,
  deleteDrinkById,
  setDrinkAvailability,
  upsertDrink,
} from '@/models/drinks'

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

/* ========== PRODUCTO ========== */
const showProductModal = ref(false)
const productForm = reactive<Partial<Product>>({
  id: undefined,
  name: '',
  price: 0,
  image_url: '',
  category: '',
  available: true,
})

function openProductForm(p?: Product) {
  if (p) {
    Object.assign(productForm, p)
  }
  showProductModal.value = true
}
function closeProductForm() {
  showProductModal.value = false
}

type OptionKind = 'addition' | 'drink'
const optionKind = ref<OptionKind>('addition')
const optionKindLabel = computed(() =>
  optionKind.value === 'addition' ? 'Adición' : 'Bebida'
)

const showOptionModal = ref(false)
const optionForm = reactive<Partial<OptionRow>>({
  id: undefined,
  name: '',
  price: 0,
  available: true,
  image_url: '',
})

function openOptionForm(kind: OptionKind, row?: OptionRow) {
  optionKind.value = kind
  if (row) {
    Object.assign(optionForm, row)
  }
  showOptionModal.value = true
}
function closeOptionForm() {
  showOptionModal.value = false
}

const errors = reactive<{ name?: string; price?: string }>({})

function validateCommon(name: string | undefined, price: number | undefined) {
  errors.name = ''
  errors.price = ''

  const trimmed = (name || '').trim()
  if (!trimmed || trimmed.length < 2 || trimmed.length > 80) {
    errors.name = 'El nombre debe tener entre 2 y 80 caracteres'
  }

  const nPrice = Number(price)
  if (!Number.isFinite(nPrice) || nPrice <= 0) {
    errors.price = 'El precio debe ser mayor que 0'
  }

  return !errors.name && !errors.price
}

async function saveProduct() {
  const ok = validateCommon(productForm.name, productForm.price as number)
  if (!ok) return

  saving.value = true
  try {
    const saved = await upsertProduct({
      id: productForm.id as number | undefined,
      name: (productForm.name || '').trim(),
      price: Number(productForm.price),
      image_url: (productForm.image_url || '') as string | null,
      category: (productForm.category || '') as string,
      available: productForm.available ?? true,
    })

    const idx = products.value.findIndex(p => p.id === saved.id)
    if (idx >= 0) products.value.splice(idx, 1, saved)
    else products.value.unshift(saved)

    closeProductForm()
  } finally {
    saving.value = false
  }
}

async function saveOption() {
  const ok = validateCommon(optionForm.name, optionForm.price as number)
  if (!ok) return

  saving.value = true
  try {
    if (optionKind.value === 'addition') {
      const saved = await upsertAddition({
        id: optionForm.id as number | undefined,
        name: (optionForm.name || '').trim(),
        price: Number(optionForm.price),
        available: optionForm.available ?? true,
        image_url: (optionForm.image_url || '') as string | null,
      })
      const idx = additions.value.findIndex(a => a.id === saved.id)
      if (idx >= 0) additions.value.splice(idx, 1, saved)
      else additions.value.unshift(saved)
    } else {
      const saved = await upsertDrink({
        id: optionForm.id as number | undefined,
        name: (optionForm.name || '').trim(),
        price: Number(optionForm.price),
        available: optionForm.available ?? true,
        image_url: (optionForm.image_url || '') as string | null,
      })
      const idx = drinks.value.findIndex(d => d.id === saved.id)
      if (idx >= 0) drinks.value.splice(idx, 1, saved)
      else drinks.value.unshift(saved)
    }
    closeOptionForm()
  } finally {
    saving.value = false
  }
}

/* ========== TOGGLES & DELETE ========== */
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
.section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.carousel {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 6px;
}

.slide {
  flex: 0 0 auto;
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.08);
  min-width: 200px;
  max-width: 240px;
  border: 1px solid #f1f5f9;
}

.thumb,
.card img {
  width: 100%;
  height: 140px;
  object-fit: cover;
  border-radius: 10px;
  background: #eee;
}

.info {
  padding: 0;
  display: grid;
}

.title {
  font-weight: 600;
  font-size: 14px;
  margin: 6px 0 2px;
  color: black;
}

.price {
  color: rgb(30, 51, 183);
  font-weight: 700;
  font-size: 13px;
  margin: 0;
}

.actions {
  padding: 6px 2px 0;
  display: grid;
  gap: 8px;
}

.actions ion-toggle {
  font-size: 12px;
  white-space: normal;
}

.row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: space-between;
}

@media (min-width: 360px) {
  .card {
    min-width: 210px;
    max-width: 250px;
  }

  .thumb {
    height: 150px;
  }
}

@media (min-width: 480px) {
  .card {
    min-width: 230px;
    max-width: 270px;
  }

  .thumb {
    height: 160px;
  }
}

@media (min-width: 640px) {
  .card {
    min-width: 250px;
    max-width: 300px;
  }

  .thumb {
    height: 180px;
  }
}

@media (prefers-color-scheme: dark) {
  .card {
    background: #1b1c1e;
    border-color: #222428;
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.55);
  }

  .title {
    color: #e5e7eb;
  }

  .price {
    color: #bfdbfe;
  }
}
</style>