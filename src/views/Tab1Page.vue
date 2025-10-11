<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>El Rincón</ion-title>
        <ion-buttons slot="end">
          <ion-icon :icon="cartOutline" size="large" />
        </ion-buttons>
      </ion-toolbar>
      <ion-searchbar placeholder="Buscar en El Rincón" />
    </ion-header>

    <ion-content class="ion-padding">
      <div v-if="errorCarga" class="err">{{ errorCarga }}</div>
      <div class="menu-sections" v-else>
        <section v-for="cat in categorias" :key="cat.nombre" class="section">
          <h2 class="section-title">{{ cat.nombre }}</h2>
          <div class="carousel">
            <button
              v-for="item in cat.items"
              :key="item.id"
              class="card"
              type="button"
              @click="abrirDetalle(item)"
            >
              <img :src="item.img" :alt="item.nombre" />
              <h3 class="card-title">{{ item.nombre }}</h3>
              <p class="precio">${{ item.precio.toLocaleString() }}</p>
            </button>
          </div>
        </section>
      </div>
    </ion-content>

    <!-- Detalle de producto -->
    <ion-modal :is-open="detalleAbierto" @did-dismiss="cerrarDetalle">
      <ion-content class="ion-padding detail-content">
        <div class="detail-wrap" v-if="seleccionado">
          <img class="detail-img" :src="seleccionado.img" :alt="seleccionado.nombre" />
          <h2 class="detail-title">{{ seleccionado.nombre }}</h2>
          <p class="detail-desc">{{ seleccionado.descripcion }}</p>
          <div class="detail-price">${{ seleccionado.precio.toLocaleString() }}</div>

          <div class="detail-actions">
            <ion-button expand="block" fill="outline" color="medium" @click="anadirAdicion">
              Añadir adición
            </ion-button>
            <ion-button expand="block" fill="outline" color="tertiary" @click="anadirBebida">
              Añadir bebida
            </ion-button>
            <ion-button expand="block" color="primary" @click="anadirAlCarrito">
              Añadir al carrito
            </ion-button>
            <ion-button expand="block" fill="clear" color="dark" @click="cerrarDetalle">Cerrar</ion-button>
          </div>
        </div>
      </ion-content>
    </ion-modal>

    <ion-footer>
      <ion-toolbar>
        <ion-segment value="menu">
          <ion-segment-button value="menu">
            <ion-icon :icon="restaurantOutline" />
            <ion-label>Menú</ion-label>
          </ion-segment-button>
          <ion-segment-button value="pedidos">
            <ion-icon :icon="receiptOutline" />
            <ion-label>Pedidos</ion-label>
          </ion-segment-button>
          <ion-segment-button value="perfil">
            <ion-icon :icon="personOutline" />
            <ion-label>Perfil</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-footer>
  </ion-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonIcon, IonSearchbar,
  IonContent, IonFooter, IonSegment, IonSegmentButton, IonLabel, IonButton, IonModal
} from '@ionic/vue'
import { cartOutline, restaurantOutline, receiptOutline, personOutline } from 'ionicons/icons'
import { supabase } from '@/services/SupabaseClient'

// Orden deseado de categorías
const ordenCategorias = ['Personales','Dobles','Para 3','Para 4','Para 7–8','Desgranados','Nachos']

// Productos desde la base de datos
const productos = ref([])
const cargando = ref(false)
const errorCarga = ref('')

function normalizarCategoria(raw) {
  if (!raw) return ''
  let s = String(raw).trim()
  // Unificar guiones 7-8 → 7–8
  s = s.replace('7-8', '7–8').replace('7 – 8', '7–8')
  // Quitar espacios dobles
  s = s.replace(/\s+/g, ' ')
  // Capitalización simple
  s = s
    .toLowerCase()
    .replace(/(^|\s)\S/g, (t) => t.toUpperCase())
  return s
}

async function cargarCatalogo() {
  cargando.value = true
  errorCarga.value = ''
  // 1) Leer productos de la tabla correcta (no hay category_id en products)
  const { data: prods, error: errProd } = await supabase
    .from('products')
    .select('id,name,description,price,image_url,available')
    .eq('available', true)
    .order('id', { ascending: true })

  if (errProd) {
    errorCarga.value = errProd.message
    productos.value = []
    cargando.value = false
    return
  }

  // 2) Resolver categoría: via tabla pivote menu_items (product_id -> category_id) y tabla categories (id -> name)
  let productToCategoryName = new Map()
  {
    const [{ data: links }, { data: cats }] = await Promise.all([
      supabase.from('menu_items').select('product_id,category_id'),
      supabase.from('categories').select('id,name')
    ])
    const catMap = new Map((cats ?? []).map(c => [c.id, c.name]))
    for (const l of links ?? []) {
      const cname = catMap.get(l.category_id)
      if (cname) productToCategoryName.set(l.product_id, cname)
    }
  }

  function inferFromName(name) {
    const n = (name || '').toLowerCase()
    if (n.includes('personal')) return 'Personales'
    if (n.includes('doble')) return 'Dobles'
    if (n.includes('para 3')) return 'Para 3'
    if (n.includes('para 4')) return 'Para 4'
    if (n.includes('7–8') || n.includes('7-8') || n.includes('7 – 8')) return 'Para 7–8'
    if (n.includes('desgran')) return 'Desgranados'
    if (n.includes('nacho')) return 'Nachos'
    return ''
  }

  productos.value = (prods ?? []).map(r => {
    const catByLink = productToCategoryName.get(r.id) || ''
    const catByName = inferFromName(r.name)
    const categoria = normalizarCategoria(catByLink || catByName)
    return {
      id: r.id,
      nombre: r.name,
      precio: r.price,
      descripcion: r.description ?? '',
      img: r.image_url || '/Logo.png',
      categoria
    }
  })
  cargando.value = false
}

onMounted(() => { cargarCatalogo() })

// Agrupar por categoría siguiendo el orden deseado
const categorias = computed(() => {
  const grupos = new Map()
  for (const p of productos.value) {
    const cat = normalizarCategoria(p.categoria)
    if (!grupos.has(cat)) grupos.set(cat, [])
    grupos.get(cat).push(p)
  }
  // Construye en orden y descarta vacíos
  const lista = []
  for (const nombre of ordenCategorias) {
    const items = grupos.get(nombre) || []
    if (items.length) lista.push({ nombre, items })
  }
  // También agregar categorías no contempladas
  for (const [nombre, items] of grupos) {
    if (!ordenCategorias.includes(nombre) && items.length) {
      lista.push({ nombre, items })
    }
  }
  return lista
})

const detalleAbierto = ref(false)
const seleccionado = ref(null)

function abrirDetalle(item) {
  seleccionado.value = item
  detalleAbierto.value = true
}
function cerrarDetalle() {
  detalleAbierto.value = false
  seleccionado.value = null
}

function anadirAdicion() {
  // TODO: Abrir flujo de adiciones
}
function anadirBebida() {
  // TODO: Abrir flujo de bebidas
}
function anadirAlCarrito() {
  // TODO: Integrar con estado del carrito
  cerrarDetalle()
}
</script>

<style scoped>
.menu-sections { display: grid; gap: 18px; }
.section { display: grid; gap: 10px; }
.section-title { margin: 0; font-size: 18px; font-weight: 800; }

.carousel {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 4px;
  -webkit-overflow-scrolling: touch;
}

.card {
  background: #fff;
  border-radius: 12px;
  text-align: left;
  padding: 8px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.08);
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
.card-title { font-size: 14px; margin: 6px 0 2px; font-weight: 600; color:black }
.precio { color: red; font-weight: 700; font-size: 13px; margin: 0; }

/* Detalle */
.detail-content { --background: #fff; }
.detail-wrap { max-width: 520px; margin: 0 auto; display: grid; gap: 12px; }
.detail-img { width: 100%; height: 220px; object-fit: cover; border-radius: 12px; }
.detail-title { margin: 0; font-weight: 800; font-size: 22px; }
.detail-desc { margin: 0; color: var(--ion-color-medium); }
.detail-price { font-size: 20px; font-weight: 800; color: #d32f2f; }
.detail-actions { display: grid; gap: 8px; margin-top: 8px; }

.err { color: var(--ion-color-danger); margin-bottom: 8px; }
</style>
