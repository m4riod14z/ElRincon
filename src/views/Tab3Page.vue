<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Perfil</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding view-fade-up">
      <!-- HEADER PERFIL -->
      <div class="header" @click="toggleEditor">
        <div class="avatar">{{ initials }}</div>
        <div class="info">
          <h2 class="name">
            {{ displayName }}
            <ion-icon
              class="chev"
              :icon="showEditor ? chevronUpOutline : chevronDownOutline"
            />
          </h2>
          <p class="email">{{ profile.email || authEmail || '—' }}</p>
        </div>
      </div>

      <!-- EDITOR PERFIL -->
      <ion-card v-if="showEditor" class="editor-card">
        <ion-card-header>
          <ion-card-title>Datos personales</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-item>
            <ion-input
              v-model="form.first_name"
              label="Nombre"
              label-placement="floating"
            />
          </ion-item>
          <ion-item>
            <ion-input
              v-model="form.last_name"
              label="Apellido"
              label-placement="floating"
            />
          </ion-item>

          <!-- Email solo lectura -->
          <ion-item>
            <ion-input
              :value="profile.email || authEmail || ''"
              label="Correo"
              label-placement="floating"
              readonly
            />
          </ion-item>

          <div class="row mt">
            <ion-button :disabled="saving" @click="saveProfile">
              <ion-spinner v-if="saving" name="dots" />
              <span v-else>Guardar cambios</span>
            </ion-button>
            <ion-button
              color="danger"
              fill="outline"
              :disabled="saving"
              @click="logout"
            >
              Cerrar sesión
            </ion-button>
          </div>

          <ion-text v-if="err" color="danger" class="err">{{ err }}</ion-text>
          <ion-text v-if="ok" color="success" class="ok">{{ ok }}</ion-text>
        </ion-card-content>
      </ion-card>

      <!-- HISTORIAL DE PEDIDOS ENTREGADOS (SOLO ESTE CLIENTE) -->
      <section class="section">
        <h3 class="section-title">Historial de pedidos entregados</h3>

        <ion-accordion-group expand="inset">
          <ion-accordion value="history">
            <!-- Header del acordeón -->
            <ion-item slot="header" color="light">
              <ion-label>
                {{
                  entregados.length
                    ? `Pedidos entregados (${entregados.length})`
                    : 'Sin pedidos entregados'
                }}
              </ion-label>
            </ion-item>

            <!-- Contenido -->
            <ion-list slot="content" v-if="entregados.length">
              <ion-item v-for="o in entregados" :key="o.id" lines="full">
                <ion-label>
                  <h3>Pedido #{{ o.id }}</h3>

                  <!-- Producto principal -->
                  <p v-if="itemsSummary[o.id]" class="line">
                    {{ itemsSummary[o.id]!.qty }} x
                    {{
                      itemsSummary[o.id]!.product_name ||
                      ('Producto ' + itemsSummary[o.id]!.product_id)
                    }}
                  </p>
                  <p v-else class="muted">
                    Detalle del pedido no disponible.
                  </p>

                  <!-- Adición -->
                  <p
                    v-if="itemsSummary[o.id]?.addition_name"
                    class="line"
                  >
                    Adición: {{ itemsSummary[o.id]!.addition_name }}
                  </p>

                  <!-- Bebida -->
                  <p v-if="itemsSummary[o.id]?.drink_name" class="line">
                    Bebida: {{ itemsSummary[o.id]!.drink_name }}
                  </p>

                  <!-- Dirección -->
                  <p class="line">
                    Dirección: {{ (o.address || '').trim() || 'No disponible' }}
                  </p>

                  <!-- Total -->
                  <p class="line">
                    Total:
                    <strong>{{ fmtCOP(o.total) }}</strong>
                  </p>
                </ion-label>
              </ion-item>
            </ion-list>
          </ion-accordion>
        </ion-accordion-group>
      </section>
    </ion-content>

    <ion-toast
      :is-open="toastOpen"
      message="Perfil actualizado"
      duration="1500"
      color="success"
      @didDismiss="toastOpen = false"
    />
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonInput,
  IonButton,
  IonText,
  IonSpinner,
  IonToast,
  IonIcon,
  IonAccordion,
  IonAccordionGroup,
  IonLabel,
  IonList,
} from '@ionic/vue'
import { chevronDownOutline, chevronUpOutline } from 'ionicons/icons'
import { reactive, ref, computed, onMounted, watch } from 'vue'
import { supabase } from '@/services/SupabaseClient'
import { useRouter } from 'vue-router'
import { useOrders } from '@/controllers/useOrders'
import { createOrUpdateProfile } from '@/controllers/ProfileController'
import { fmtCOP } from '@/utils/money'
import type { OrderItemDetail } from '@/models/orders'
import { fetchOrderItems } from '@/models/orders'

const router = useRouter()

// Pedidos del cliente actual
const { entregados } = useOrders()

// --- Perfil / encabezado ---
const showEditor = ref(false)
function toggleEditor() {
  showEditor.value = !showEditor.value
}

const authEmail = ref<string | null>(null)
const userId = ref<string | null>(null)

const profile = reactive<{
  first_name?: string
  last_name?: string
  email?: string
}>({})

const form = reactive<{
  first_name: string
  last_name: string
  email: string
}>({
  first_name: '',
  last_name: '',
  email: '',
})

const displayName = computed(
  () =>
    [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
    'Tu nombre',
)

const initials = computed(() => {
  const a = (profile.first_name ?? '').charAt(0)
  const b = (profile.last_name ?? '').charAt(0)
  const base = (a + b).trim() || (profile.email ?? authEmail.value ?? 'T')
  return base.slice(0, 2).toUpperCase()
})

const saving = ref(false)
const err = ref('')
const ok = ref('')
const toastOpen = ref(false)

/**
 * Carga el perfil del usuario y, si los nombres están vacíos,
 * los completa con el último pedido en la tabla orders.
 */
async function loadProfile() {
  err.value = ''
  const { data: ures, error: uerr } = await supabase.auth.getUser()
  if (uerr || !ures.user) {
    router.replace('/home')
    return
  }

  userId.value = ures.user.id
  authEmail.value = ures.user.email ?? null

  // 1) Perfil principal
  const { data, error } = await supabase
    .from('profiles')
    .select('first_name, last_name, email')
    .eq('id', userId.value)
    .maybeSingle()

  Object.assign(profile, {
    first_name: data?.first_name ?? '',
    last_name: data?.last_name ?? '',
    email: data?.email ?? authEmail.value ?? '',
  })

  // 2) Completar desde el último pedido si faltan nombres
  try {
    const { data: lastOrder } = await supabase
      .from('orders')
      .select('first_name, last_name')
      .eq('client_id', userId.value)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (lastOrder) {
      if (!profile.first_name && lastOrder.first_name) {
        profile.first_name = lastOrder.first_name
      }
      if (!profile.last_name && lastOrder.last_name) {
        profile.last_name = lastOrder.last_name
      }
    }
  } catch (e) {
    console.warn('No se pudo obtener nombres del último pedido', e)
  }

  // 3) Seed del formulario
  form.first_name = profile.first_name ?? ''
  form.last_name = profile.last_name ?? ''
  form.email = profile.email ?? authEmail.value ?? ''
}

async function saveProfile() {
  try {
    err.value = ''
    ok.value = ''
    if (!userId.value) return

    if (!/\S+@\S+\.\S+/.test(form.email.trim())) {
      throw new Error('Correo inválido.')
    }

    saving.value = true

    await createOrUpdateProfile({
      id: userId.value,
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim(),
    })

    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim(),
    }

    Object.assign(profile, payload)
    ok.value = 'Cambios guardados'
    toastOpen.value = true
  } catch (e: any) {
    err.value = e?.message ?? 'No fue posible guardar.'
  } finally {
    saving.value = false
  }
}

async function logout() {
  err.value = ''
  await supabase.auth.signOut()
  router.replace('/home')
}

// ---- Resumen de ítems por pedido (primer producto del pedido) ----
type ItemSummary = {
  product_id: number
  qty: number
  product_name: string | null
  addition_name: string | null
  drink_name: string | null
}

const itemsSummary = ref<Record<number, ItemSummary | null>>({})

watch(
  entregados,
  async list => {
    const newSummaries: Record<number, ItemSummary | null> = {
      ...itemsSummary.value,
    }

    for (const o of list) {
      if (newSummaries[o.id] !== undefined) continue
      try {
        const items: OrderItemDetail[] = await fetchOrderItems(o.id)
        const first = items[0]
        if (first) {
          newSummaries[o.id] = {
            product_id: first.product_id,
            qty: first.qty,
            product_name: first.product_name ?? null,
            addition_name: first.addition_name ?? null,
            drink_name: first.drink_name ?? null,
          }
        } else {
          newSummaries[o.id] = null
        }
      } catch (e) {
        console.error('Error cargando ítems del pedido', o.id, e)
        newSummaries[o.id] = null
      }
    }

    itemsSummary.value = newSummaries
  },
  { immediate: true },
)

onMounted(loadProfile)
</script>

<style scoped>
.header {
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: 12px;
  align-items: center;
  margin-bottom: 10px;
  cursor: pointer;
}

.avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--ion-color-primary);
  color: white;
  font-weight: 800;
  font-size: 18px;
}

.info .name {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
}

.info .email {
  margin: 0;
  color: var(--ion-color-medium);
}

.chev {
  font-size: 18px;
  opacity: 0.8;
}

.editor-card {
  margin-top: 8px;
}

.section {
  margin-top: 24px;
}

.section-title {
  margin: 0 0 8px;
  font-weight: 800;
}

.row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.mt {
  margin-top: 12px;
}

.err,
.ok {
  display: block;
  margin-top: 10px;
}

.muted {
  font-size: 13px;
  color: var(--ion-color-medium);
}

.line {
  margin: 0;
  font-size: 14px;
}

/* Dark mode pequeños ajustes */
@media (prefers-color-scheme: dark) {
  .header {
    background: transparent;
  }
}
</style>