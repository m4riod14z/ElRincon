<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Perfil</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding view-fade-up">
      <!-- Encabezado: nombre + tap para desplegar editor -->
      <div class="header" @click="toggleEditor">
        <div class="avatar">{{ initials }}</div>
        <div class="info">
          <h2 class="name">
            {{ displayName }}
            <ion-icon class="chev" :icon="showEditor ? chevronUpOutline : chevronDownOutline" />
          </h2>
          <p class="email">{{ profile.email || authEmail || '—' }}</p>
        </div>
      </div>

      <!-- Editor desplegable -->
      <ion-card v-if="showEditor" class="editor-card">
        <ion-card-header>
          <ion-card-title>Datos personales</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-item>
            <ion-input v-model="form.first_name" label="Nombre" label-placement="floating" />
          </ion-item>
          <ion-item>
            <ion-input v-model="form.last_name" label="Apellido" label-placement="floating" />
          </ion-item>
          <ion-item>
            <ion-input v-model="form.email" type="email" inputmode="email" label="Correo" label-placement="floating" />
          </ion-item>
          <ion-item>
            <ion-input v-model="form.phone" type="tel" inputmode="numeric" :maxlength="10" label="Teléfono" label-placement="floating" />
          </ion-item>

          <div class="row mt">
            <ion-button :disabled="saving" @click="saveProfile">
              <ion-spinner v-if="saving" name="dots" />
              <span v-else>Guardar cambios</span>
            </ion-button>
            <ion-button color="danger" fill="outline" :disabled="saving" @click="logout">
              Cerrar sesión
            </ion-button>
          </div>

          <ion-text v-if="err" color="danger" class="err">{{ err }}</ion-text>
          <ion-text v-if="ok" color="success" class="ok">{{ ok }}</ion-text>
        </ion-card-content>
      </ion-card>

      <!-- Historial de pedidos (solo entregados) -->
      <h3 class="section-title">Historial de pedidos</h3>
      <OrderList :orders="entregados" :showStatus="true" />
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
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonItem, IonInput, IonButton, IonText, IonSpinner, IonToast, IonIcon
} from '@ionic/vue'
import { chevronDownOutline, chevronUpOutline } from 'ionicons/icons'
import { reactive, ref, computed, onMounted } from 'vue'
import { supabase } from '@/services/SupabaseClient'
import { useRouter } from 'vue-router'
import OrderList from '@/components/OrderList.vue'
import { useOrders } from '@/controllers/useOrders'
import { createOrUpdateProfile } from '@/controllers/ProfileController'

const router = useRouter()
const { entregados } = useOrders()

const showEditor = ref(false)
function toggleEditor() { showEditor.value = !showEditor.value }

const authEmail = ref<string | null>(null)
const userId = ref<string | null>(null)

const profile = reactive<{ first_name?: string; last_name?: string; email?: string; phone?: string }>({})
const form = reactive<{ first_name: string; last_name: string; email: string; phone: string }>({
  first_name: '', last_name: '', email: '', phone: ''
})

const displayName = computed(() =>
  [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Tu nombre'
)
const initials = computed(() => {
  const a = (profile.first_name ?? '').charAt(0)
  const b = (profile.last_name ?? '').charAt(0)
  return (a + b || 'ER').toUpperCase()
})

const saving = ref(false)
const err = ref('')
const ok = ref('')
const toastOpen = ref(false)

async function loadProfile() {
  err.value = ''
  const { data: ures, error: uerr } = await supabase.auth.getUser()
  if (uerr || !ures.user) {
    router.replace('/home')
    return
  }
  userId.value = ures.user.id
  authEmail.value = ures.user.email ?? null

  const { data, error } = await supabase
    .from('profiles')
    .select('first_name, last_name, email, phone')
    .eq('id', userId.value)
    .maybeSingle()

  if (error) {
    // Si no existe fila en profiles, mostramos email de auth
    Object.assign(profile, { first_name: '', last_name: '', email: authEmail.value ?? '', phone: '' })
  } else {
    Object.assign(profile, data ?? {})
    if (!profile.email) profile.email = authEmail.value ?? ''
  }
  // seed del form
  form.first_name = profile.first_name ?? ''
  form.last_name  = profile.last_name ?? ''
  form.email      = profile.email ?? (authEmail.value ?? '')
  form.phone      = profile.phone ?? ''
}

async function saveProfile() {
    try {
      err.value = ''
      ok.value = ''
      if (!userId.value) return
      if (!/\S+@\S+\.\S+/.test(form.email.trim())) throw new Error('Correo inválido.')
      if (form.phone && !/^\d{7,10}$/.test(form.phone)) throw new Error('Teléfono inválido.')

      saving.value = true
      
      await createOrUpdateProfile({
        id: userId.value,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim()
      });

      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim()
      };
      
      Object.assign(profile, payload)
      ok.value = 'Cambios guardados'
      toastOpen.value = true
    } catch (e:any) {
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
  width: 56px; height: 56px; border-radius: 50%;
  display: grid; place-items: center;
  background: var(--ion-color-primary);
  color: white; font-weight: 800; font-size: 18px;
}
.info .name { display:flex; align-items:center; gap:6px; margin:0; }
.info .email { margin:0; color: var(--ion-color-medium); }
.chev { font-size: 18px; opacity: .8; }

.editor-card { margin-top: 8px; }

.section-title { margin: 18px 0 8px; font-weight: 800; }

.row { display:flex; gap: 10px; align-items:center; }
.mt { margin-top: 12px; }
.err, .ok { display:block; margin-top:10px; }
</style>
