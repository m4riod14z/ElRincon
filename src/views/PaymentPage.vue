<!-- src/views/PaymentView.vue -->
<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/cart" />
        </ion-buttons>
        <ion-title>Pasarela de pago</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Datos de pago</ion-card-title>
          <ion-card-subtitle>Total: {{ fmtCOP(total) }}</ion-card-subtitle>
        </ion-card-header>

        <ion-card-content>
          <!-- ====== MINI MAPA ====== -->
          <div class="mapbox">
            <div ref="mapEl" class="leaflet-map"></div>
          </div>
          <ion-button size="small" fill="outline" @click="useMyLocation">Usar mi ubicación</ion-button>
          <ion-text v-if="geoError" color="danger" class="err">{{ geoError }}</ion-text>

          <!-- ====== NOMBRES ====== -->
          <ion-item class="mt">
            <ion-input v-model="firstName" label="Nombre" label-placement="floating" />
          </ion-item>
          <ion-item>
            <ion-input v-model="secondName" label="Segundo nombre / Apellido" label-placement="floating" />
          </ion-item>

          <!-- ====== CONTACTO ====== -->
          <ion-item>
            <ion-input v-model="email" type="email" inputmode="email" label="Email" label-placement="floating" />
          </ion-item>
          <ion-item>
            <ion-input v-model="phone" type="tel" inputmode="numeric" :maxlength="10"
                       label="Teléfono (10 dígitos)" label-placement="floating" />
          </ion-item>

          <!-- ====== MÉTODO: TARJETAS CON ICONO ====== -->
          <div class="mt">
            <div class="methods-title">¿Prefieres otro método de pago?</div>
            <div class="methods-grid">
              <button
                v-for="m in methods"
                :key="m.value"
                class="method-card"
                :class="{ selected: method === m.value }"
                type="button"
                @click="method = m.value"
                :aria-pressed="method === m.value"
              >
                <img :src="m.icon" :alt="m.label" />
                <span>{{ m.label }}</span>
              </button>
            </div>
          </div>

          <!-- ====== CAMPOS DE TARJETA (SOLO SI TARJETA) ====== -->
          <template v-if="method === 'card'">
            <ion-item class="mt">
              <ion-input v-model="cardNumber" inputmode="numeric" :maxlength="16"
                         label="Número de tarjeta (16)" label-placement="floating" />
            </ion-item>
            <ion-item>
              <ion-input v-model="cardExp" placeholder="MM/YY" :maxlength="5"
                         label="Expiración" label-placement="floating" />
            </ion-item>
            <ion-item>
              <ion-input v-model="cardCvv" inputmode="numeric" :maxlength="3"
                         label="CVV (3)" label-placement="floating" />
            </ion-item>
          </template>

          <div class="row total mt">
            <span>Total a pagar</span>
            <strong>{{ fmtCOP(total) }}</strong>
          </div>

          <ion-text v-if="err" color="danger" class="err">{{ err }}</ion-text>

          <ion-button expand="block" class="mt" :disabled="paying" @click="pay">
            <ion-spinner v-if="paying" name="dots" />
            <span v-else>
              Pagar {{ fmtCOP(total) }} <template v-if="methodLabel">— {{ methodLabel }}</template>
            </span>
          </ion-button>
        </ion-card-content>
      </ion-card>

      <ion-toast
        :is-open="toastOpen"
        message="Pago aceptado"
        duration="1800"
        color="success"
        @didDismiss="toastOpen = false"
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonItem, IonInput, IonButton, IonText, IonSpinner, IonToast
} from '@ionic/vue'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCart } from '@/controllers/useCart'
import { validateAvailability } from '@/services/AvailabilityService'
import { createOrder } from '@/services/OrderService'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const fmtCOP = (n: number) =>
  (n ?? 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

const router = useRouter()
const { items, total, clear } = useCart()

// ===== formulario =====
const firstName   = ref('')
const secondName  = ref('')
const email       = ref('')
const phone       = ref('')
const method      = ref<'nequi'|'bancolombia'|'card'>('nequi')

// imágenes (soportan svg o png)
const iconNequi        = new URL('@/assets/images/nequi.png', import.meta.url).href
const iconBancolombia  = new URL('@/assets/images/bancolombia.png', import.meta.url).href
const iconCard         = new URL('@/assets/images/tarjeta.png', import.meta.url).href

const methods = [
  { value: 'nequi',       label: 'Nequi',       icon: iconNequi },
  { value: 'bancolombia', label: 'Bancolombia', icon: iconBancolombia },
  { value: 'card',        label: 'Tarjeta',     icon: iconCard },
] as const

const methodLabel = computed(() => methods.find(m => m.value === method.value)?.label ?? '')

// tarjeta
const cardNumber = ref('')
const cardExp    = ref('')
const cardCvv    = ref('')

const paying    = ref(false)
const err       = ref('')
const toastOpen = ref(false)

// ===== validaciones =====
const emailOk = computed(() => /\S+@\S+\.\S+/.test(email.value.trim()))
const phoneOk = computed(() => /^\d{10}$/.test(phone.value))
const cardOk  = computed(() => {
  if (method.value !== 'card') return true
  const numOk = /^\d{16}$/.test(cardNumber.value)
  const expOk = /^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExp.value)
  const cvvOk = /^\d{3}$/.test(cardCvv.value)
  return numOk && expOk
    && cvvOk
})

// ===== Leaflet map =====
const mapEl = ref<HTMLDivElement | null>(null)
let map: L.Map | null = null
let marker: L.Marker | null = null

// coords por defecto (Medellín)
const lat = ref<number>(6.25184)
const lng = ref<number>(-75.56359)
const geoError = ref('')

onMounted(() => {
  if (!mapEl.value) return
  map = L.map(mapEl.value, { zoomControl: false }).setView([lat.value, lng.value], 14)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map)
  marker = L.marker([lat.value, lng.value]).addTo(map)
  map.on('click', (e: L.LeafletMouseEvent) => {
    lat.value = e.latlng.lat
    lng.value = e.latlng.lng
    marker?.setLatLng(e.latlng)
  })
})

async function useMyLocation() {
  try {
    geoError.value = ''
    if (!('geolocation' in navigator)) throw new Error('La geolocalización no está disponible en este dispositivo.')
    await new Promise<void>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          lat.value = pos.coords.latitude
          lng.value = pos.coords.longitude
          if (map && marker) {
            map.setView([lat.value, lng.value], 15)
            marker.setLatLng([lat.value, lng.value])
          }
          resolve()
        },
        (e) => reject(e),
        { enableHighAccuracy: true, timeout: 10000 }
      )
    })
  } catch (e:any) {
    geoError.value = e?.message ?? 'No fue posible obtener tu ubicación.'
  }
}

// ===== pagar =====
async function pay() {
  try {
    err.value = ''
    if (!firstName.value.trim())   throw new Error('Ingresa tu nombre.')
    if (!secondName.value.trim())  throw new Error('Ingresa tu segundo nombre o apellido.')
    if (!emailOk.value)            throw new Error('Email inválido.')
    if (!phoneOk.value)            throw new Error('El teléfono debe tener 10 dígitos.')
    if (!items.value.length)       throw new Error('Tu carrito está vacío.')
    if (!cardOk.value)             throw new Error('Datos de tarjeta inválidos.')

    // revalidar disponibilidad
    const issues = await validateAvailability(items.value)
    if (issues.length) {
      const msg = issues.map(i => {
        const t = i.kind === 'product' ? 'Producto' : i.kind === 'addition' ? 'Adición' : 'Bebida'
        return `• ${t}: ${i.name ?? i.id} no está disponible`
      }).join('\n')
      throw new Error(msg)
    }

    paying.value = true
    // simulación de cobro/redirect a pasarela
    await new Promise(r => setTimeout(r, 1200))

    await createOrder({
      firstName:  firstName.value.trim(),
      lastName:   secondName.value.trim(),
      address:    `${lat.value.toFixed(5)}, ${lng.value.toFixed(5)}`,
      lat:        lat.value,
      lng:        lng.value,
      items:      items.value,
      total:      total.value,
      // paymentMethod: method.value,
    })

    toastOpen.value = true
    clear()
    router.replace('/tabs/tab2')
  } catch (e:any) {
    err.value = e?.message ?? 'No fue posible procesar el pago.'
  } finally {
    paying.value = false
  }
}
</script>

<style scoped>
.mapbox { width:100%; height:180px; border-radius:12px; overflow:hidden; margin-bottom:8px; }
.leaflet-map { width:100%; height:100%; }
.mt { margin-top: 10px; }
.row { display:flex; justify-content:space-between; align-items:center; }
.total { font-weight: 800; }
.err { display:block; margin-top:8px; white-space:pre-line; }

/* ====== Métodos de pago ====== */
.methods-title {
  font-weight: 700;
  margin-bottom: 8px;
}
.methods-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.method-card {
  border: 1.5px solid var(--ion-color-medium, #c8c8c8);
  background: var(--ion-color-light, #fff);
  border-radius: 14px;
  padding: 14px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  transition: border-color .15s, box-shadow .15s, transform .05s;
}
.method-card img {
  width: 44px; height: 44px; object-fit: contain;
}
.method-card span {
  font-weight: 600; font-size: 0.9rem;
}
.method-card:active { transform: scale(0.98); }
.method-card.selected {
  border-color: var(--ion-color-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ion-color-primary) 20%, transparent);
}
@media (max-width: 390px) {
  .methods-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
