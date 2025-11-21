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
          <!-- ====== MINI MAPA (GOOGLE MAPS) ====== -->
          <div class="mapbox">
            <div id="payment-map" class="gmap"></div>
          </div>

          <ion-button size="small" fill="outline" @click="useMyLocation">
            Usar mi ubicación
          </ion-button>
          <ion-text v-if="geoError" color="danger" class="err">{{ geoError }}</ion-text>

          <!-- Dirección calculada -->
          <ion-text v-if="address" class="addr">
            Dirección seleccionada: {{ address }}
          </ion-text>

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
            <ion-input v-model="phone" type="tel" inputmode="numeric" :maxlength="10" label="Teléfono (10 dígitos)"
              label-placement="floating" />
          </ion-item>

          <!-- ====== MÉTODO: TARJETAS CON ICONO ====== -->
          <div class="mt">
            <div class="methods-title">¿Prefieres otro método de pago?</div>
            <div class="methods-grid">
              <button v-for="m in methods" :key="m.value" class="method-card" :class="{ selected: method === m.value }"
                type="button" @click="method = m.value" :aria-pressed="method === m.value">
                <img :src="m.icon" :alt="m.label" />
                <span>{{ m.label }}</span>
              </button>
            </div>
          </div>

          <!-- ====== CAMPOS DE TARJETA (SOLO SI TARJETA) ====== -->
          <template v-if="method === 'card'">
            <ion-item class="mt">
              <ion-input v-model="cardNumber" inputmode="numeric" :maxlength="16" label="Número de tarjeta (16)"
                label-placement="floating" />
            </ion-item>
            <ion-item>
              <ion-input v-model="cardExp" placeholder="MM/YY" :maxlength="5" label="Expiración"
                label-placement="floating" />
            </ion-item>
            <ion-item>
              <ion-input v-model="cardCvv" inputmode="numeric" :maxlength="3" label="CVV (3)"
                label-placement="floating" />
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

      <ion-toast :is-open="toastOpen" message="Pago aceptado" duration="1800" color="success"
        @didDismiss="toastOpen = false" />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonItem,
  IonInput,
  IonButton,
  IonText,
  IonSpinner,
  IonToast
} from '@ionic/vue'
import { ref, computed, onMounted } from 'vue'
import { Capacitor } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'
import { useRouter } from 'vue-router'
import { useCart } from '@/controllers/useCart'
import { validateAvailability } from '@/services/AvailabilityService'
import { createOrder } from '@/services/OrderService'
import { supabase } from '@/services/SupabaseClient'

const fmtCOP = (n: number) =>
  (n ?? 0).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  })

const router = useRouter()
const { items, total, clear } = useCart()

async function prefillCustomerDetails() {
  try {
    const { data: ures, error: uerr } = await supabase.auth.getUser()
    if (uerr || !ures?.user) return
    const user = ures.user
    const fallbackEmail = user.email ?? ''

    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, email, phone')
      .eq('id', user.id)
      .maybeSingle()

    const first = profile?.first_name?.trim()
    const last = profile?.last_name?.trim()
    const emailCandidate = (profile?.email || fallbackEmail || '').trim()
    const phoneCandidate = profile?.phone?.trim()

    if (first && !firstName.value) firstName.value = first
    if (last && !secondName.value) secondName.value = last
    if (emailCandidate && !email.value) email.value = emailCandidate
    if (phoneCandidate && !phone.value) phone.value = phoneCandidate
  } catch (e) {
    // ignorar silenciosamente
  }
}

// ===== formulario =====
const firstName = ref('')
const secondName = ref('')
const email = ref('')
const phone = ref('')
const method = ref<'nequi' | 'bancolombia' | 'card'>('nequi')

// imágenes
const iconNequi = new URL('@/assets/images/nequi.png', import.meta.url).href
const iconBancolombia = new URL('@/assets/images/bancolombia.png', import.meta.url).href
const iconCard = new URL('@/assets/images/tarjeta.png', import.meta.url).href

const methods = [
  { value: 'nequi', label: 'Nequi', icon: iconNequi },
  { value: 'bancolombia', label: 'Bancolombia', icon: iconBancolombia },
  { value: 'card', label: 'Tarjeta', icon: iconCard }
] as const

const methodLabel = computed(
  () => methods.find((m) => m.value === method.value)?.label ?? ''
)

// tarjeta
const cardNumber = ref('')
const cardExp = ref('')
const cardCvv = ref('')

const paying = ref(false)
const err = ref('')
const toastOpen = ref(false)

// ===== validaciones =====
const emailOk = computed(() => /\S+@\S+\.\S+/.test(email.value.trim()))
const phoneOk = computed(() => /^\d{10}$/.test(phone.value))
const cardOk = computed(() => {
  if (method.value !== 'card') return true
  const numOk = /^\d{16}$/.test(cardNumber.value)
  const expOk = /^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExp.value)
  const cvvOk = /^\d{3}$/.test(cardCvv.value)
  return numOk && expOk && cvvOk
})

// ===== GOOGLE MAPS + GEOCODING =====
const GOOGLE_MAPS_KEY = 'AIzaSyBWRwXzKtTw1eu9TCzNR-ycy3yL-mZw9As'

let gmap: any = null
let gmarker: any = null

// coords por defecto (Medellín)
const lat = ref<number>(6.25184)
const lng = ref<number>(-75.56359)
const geoError = ref('')

// dirección legible obtenida por Geocoding
const address = ref('')

async function updateAddressFromCoords() {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat.value},${lng.value}&key=${GOOGLE_MAPS_KEY}&language=es`
    const res = await fetch(url)
    const data = await res.json()

    if (data.status === 'OK' && data.results.length > 0) {
      address.value = data.results[0].formatted_address
    } else {
      address.value = ''
    }
  } catch (e) {
    address.value = ''
  }
}

function initMap() {
  const win = window as any
  if (!win.google || !win.google.maps) return

  const el = document.getElementById('payment-map') as HTMLElement | null
  if (!el) return

  gmap = new win.google.maps.Map(el, {
    center: { lat: lat.value, lng: lng.value },
    zoom: 14,
    disableDefaultUI: true,
    // 👇 IMPORTANTE: captura todos los gestos dentro del mapa
    gestureHandling: 'greedy'
  })

  gmarker = new win.google.maps.Marker({
    position: { lat: lat.value, lng: lng.value },
    map: gmap,
    draggable: true
  })

  // click en el mapa mueve el marcador
  gmap.addListener('click', (e: any) => {
    if (!e?.latLng) return
    lat.value = e.latLng.lat()
    lng.value = e.latLng.lng()
    gmarker?.setPosition(e.latLng)
    updateAddressFromCoords()
  })

  // arrastrar el pin para afinar dirección
  gmarker.addListener('dragend', (e: any) => {
    if (!e?.latLng) return
    lat.value = e.latLng.lat()
    lng.value = e.latLng.lng()
    updateAddressFromCoords()
  })

  // dirección inicial
  updateAddressFromCoords()
}

async function useMyLocation() {
  try {
    geoError.value = ''

    // On native platforms use Capacitor Geolocation (requests permission properly)
    if (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform && Capacitor.isNativePlatform()) {
      const perm = await Geolocation.requestPermissions()
      const granted = (perm as any)?.location === 'granted' || (perm as any)?.location === 'always' || (perm as any)?.location === 'while_in_use'
      if (!granted) throw new Error('permission_denied')

      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 15000 })
      lat.value = pos.coords.latitude
      lng.value = pos.coords.longitude
    } else {
      // Web fallback
      if (!('geolocation' in navigator)) throw new Error('La geolocalización no está disponible en este dispositivo.')
      try {
        // @ts-ignore
        const status = await (navigator as any).permissions?.query?.({ name: 'geolocation' })
        if (status && status.state === 'denied') throw new Error('permission_denied')
      } catch (_) {
        // ignore
      }

      await new Promise<void>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            lat.value = pos.coords.latitude
            lng.value = pos.coords.longitude
            resolve()
          },
          (e) => reject(e),
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        )
      })
    }

    // Update map marker / center
    if (gmap) {
      const position = { lat: lat.value, lng: lng.value }
      gmap.setCenter(position)
      gmap.setZoom(16)
      if (gmarker) {
        gmarker.setPosition(position)
      } else {
        const win = window as any
        gmarker = new win.google.maps.Marker({ position, map: gmap, draggable: true })
        gmarker.addListener('dragend', (e: any) => {
          if (!e?.latLng) return
          lat.value = e.latLng.lat()
          lng.value = e.latLng.lng()
          updateAddressFromCoords()
        })
      }
    }

    await updateAddressFromCoords()
  } catch (e: any) {
    if (e === 'permission_denied' || e?.code === 1 || (e?.message && String(e.message).toLowerCase().includes('denied'))) {
      geoError.value = 'Permiso de geolocalización denegado. Activa la ubicación en los ajustes del dispositivo o permite el permiso para la aplicación.'
    } else {
      geoError.value = e?.message ?? 'No fue posible obtener tu ubicación.'
    }
  }
}

// ===== lifecycle =====
onMounted(prefillCustomerDetails)
onMounted(() => {
  initMap()
})

// ===== pagar =====
async function pay() {
  try {
    paying.value = true
    err.value = ''
    if (!firstName.value.trim()) throw new Error('Ingresa tu nombre.')
    if (!secondName.value.trim()) throw new Error('Ingresa tu segundo nombre o apellido.')
    if (!emailOk.value) throw new Error('Email inválido.')
    if (!phoneOk.value) throw new Error('El teléfono debe tener 10 dígitos.')
    if (!items.value.length) throw new Error('Tu carrito está vacío.')
    if (!cardOk.value) throw new Error('Datos de tarjeta inválidos.')

    // si por alguna razón no hay dirección aún, intentamos generarla
    if (!address.value) {
      await updateAddressFromCoords()
    }

    // revalidar disponibilidad
    const issues = await validateAvailability(items.value)
    if (issues.length) {
      const msg = issues
        .map((i) => {
          const kind = i.kind === 'product' ? 'Producto' : i.kind === 'addition' ? 'Adición' : 'Bebida'
          return `• ${kind}: ${i.name ?? i.id} no está disponible`
        })
        .join('\n')
      throw new Error(`No pudimos confirmar:\n${msg}`)
    }

    // simular pago / procesar
    await new Promise((r) => setTimeout(r, 800))

    const payloadItems = items.value.map((it: any) => ({
      productId: it.productId,
      basePrice: it.basePrice,
      qty: it.qty,
      addition: it.addition ? { id: it.addition.id, name: it.addition.name, price: it.addition.price } : null,
      drink: it.drink ? { id: it.drink.id, name: it.drink.name, price: it.drink.price } : null
    }))

    await createOrder({
      firstName: firstName.value,
      lastName: secondName.value,
      address: address.value,
      lat: lat.value ?? null,
      lng: lng.value ?? null,
      items: payloadItems,
      total: total.value
    })

    toastOpen.value = true
    clear()
    router.replace('/tabs/tab2')
  } catch (e: any) {
    err.value = e?.message ?? 'No fue posible procesar el pago.'
  } finally {
    paying.value = false
  }
}
</script>

<style scoped>
.mapbox {
  width: 100%;
  height: 180px;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 8px;
  border: 1px solid var(--ion-color-step-250, #333);
  background: var(--ion-color-step-100, #f0f0f0);
}

.gmap {
  width: 100%;
  height: 100%;
}

.addr {
  display: block;
  margin-top: 6px;
  font-size: 0.9rem;
}

/* ====== resto igual ====== */
.mt {
  margin-top: 10px;
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total {
  font-weight: 800;
}

.err {
  display: block;
  margin-top: 8px;
  white-space: pre-line;
}

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
  transition:
    border-color 0.15s,
    box-shadow 0.15s,
    transform 0.05s;
}

.method-card img {
  width: 44px;
  height: 44px;
  object-fit: contain;
}

.method-card span {
  font-weight: 600;
  font-size: 0.9rem;
}

.method-card:active {
  transform: scale(0.98);
}

.method-card.selected {
  border-color: var(--ion-color-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ion-color-primary) 20%, transparent);
}

@media (max-width: 390px) {
  .methods-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>