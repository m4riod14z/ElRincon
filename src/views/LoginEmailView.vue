<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonButtons slot="start">
          <IonBackButton defaultHref="/home" />
        </IonButtons>
        <IonTitle>El Rincón</IonTitle>
      </IonToolbar>
    </IonHeader>

    <IonContent class="ion-padding login-content">
      <h1 class="title">Ingresa a tu cuenta</h1>

      <!-- Aviso temporal de error de auth -->
      <div v-if="authAlertVisible" class="inline-alert">
        {{ authAlert }}
      </div>

      <IonList class="form">
        <!-- Email -->
        <IonItem class="field">
          <IonInput
            type="email"
            v-model="email"
            label="Correo electrónico"
            label-placement="stacked"
            inputmode="email"
            autocomplete="email"
            required
            @ionBlur="touchedEmail = true"
          />
        </IonItem>
        <IonText v-if="emailError" color="danger" class="hint">
          {{ emailError }}
        </IonText>

        <!-- Contraseña -->
        <IonItem class="field">
          <IonInput
            :type="showPassword ? 'text' : 'password'"
            v-model="password"
            label="Contraseña"
            label-placement="stacked"
            autocomplete="current-password"
            required
            @ionBlur="touchedPassword = true"
          />
          <IonButton slot="end" fill="clear" size="small" @click="togglePassword">
            <IonIcon :icon="showPassword ? eyeOffOutline : eyeOutline" />
          </IonButton>
        </IonItem>
        <IonText v-if="passwordError" color="danger" class="hint">
          {{ passwordError }}
        </IonText>
      </IonList>

      <!-- Continuar -->
      <IonButton
        expand="block"
        size="large"
        color="primary"
        class="btn-primary submit-btn"
        :disabled="!formOk || loading"
        @click="onSubmit"
      >
        <IonSpinner v-if="loading" name="dots" />
        <span v-else>Continuar</span>
      </IonButton>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonItem,
  IonInput,
  IonButton,
  IonIcon,
  IonText,
  IonList,
} from '@ionic/vue'
import { eyeOutline, eyeOffOutline } from 'ionicons/icons'
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { isEmail, isNotEmpty } from '@/utils/validatorsLogin'
import { loginWithEmail } from '@/controllers/AuthEmailController'

const router = useRouter()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)

const touchedEmail = ref(false)
const touchedPassword = ref(false)

// Aviso de error de autenticación (correo/clave incorrectos)
const authAlert = ref('')
const authAlertVisible = ref(false)
let authAlertTimer: ReturnType<typeof setTimeout> | null = null

function showAuthAlert(msg: string, ms = 2500) {
  authAlert.value = msg
  authAlertVisible.value = true
  if (authAlertTimer) clearTimeout(authAlertTimer)
  authAlertTimer = setTimeout(() => {
    authAlertVisible.value = false
    authAlert.value = ''
    authAlertTimer = null
  }, ms)
}

const emailError = computed(() => {
  if (!touchedEmail.value) return ''
  if (!isNotEmpty(email.value)) return 'El correo es obligatorio'
  if (!isEmail(email.value)) return 'Ingresa un correo válido'
  return ''
})

const passwordError = computed(() => {
  if (!touchedPassword.value) return ''
  if (!isNotEmpty(password.value)) return 'La contraseña es obligatoria'
  return ''
})

const formOk = computed(
  () =>
    isNotEmpty(email.value) &&
    isEmail(email.value) &&
    isNotEmpty(password.value),
)

// Si el usuario vuelve a tipear, escondemos el aviso temporal
watch([email, password], () => {
  authAlertVisible.value = false
  authAlert.value = ''
  if (authAlertTimer) {
    clearTimeout(authAlertTimer)
    authAlertTimer = null
  }
})

function togglePassword() {
  showPassword.value = !showPassword.value
}

async function onSubmit() {
  touchedEmail.value = true
  touchedPassword.value = true
  if (!formOk.value || loading.value) return

  loading.value = true
  try {
    await loginWithEmail(email.value, password.value)
    router.replace('/tabs/tab1')
  } catch {
    showAuthAlert('Correo o contraseña incorrectos')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.title {
  font-size: 22px;
  font-weight: 800;
  margin: 8px 0 16px;
}

/* Mismo esquema de formulario que RegisterPage */
.form {
  display: grid;
  gap: 10px;
  margin-top: 4px;
}

.field {
  --border-radius: 12px;
  --inner-padding-end: 8px;
  margin-bottom: 6px;
  border-radius: 12px;
}

/* Label tipo “stacked” claramente separado del input */
.field ion-input::part(label) {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
}

/* Botón ojito más cómodo de tocar */
.field ion-button[slot='end'] {
  min-width: 44px;
  height: 44px;
}

/* Mensajes de error debajo del campo */
.hint {
  margin: 4px 4px 8px;
  font-size: 12px;
}

/* Aviso amarillo de error de login */
.inline-alert {
  background: #fff3cd;
  color: #8a6d3b;
  border: 1px solid #ffe6a7;
  border-radius: 8px;
  padding: 10px 12px;
  margin: 6px 0 14px;
  font-size: 13px;
}

/* Botón principal igual al de registro */
.btn-primary {
  margin-top: 16px;
  --border-radius: 16px;
}

/* Un poco de aire extra arriba en móviles */
.login-content {
  padding-top: 12px;
}
</style>