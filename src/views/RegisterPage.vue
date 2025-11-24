<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/home" />
        </ion-buttons>
        <ion-title>Crear Cuenta</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-list class="form">
        <ion-item class="field">
          <ion-input ref="emailInput" type="email" v-model="email" label="Correo electrónico" label-placement="stacked"
            inputmode="email" autocomplete="email" required />
        </ion-item>

        <ion-item class="field">
          <ion-input v-model="firstName" label="Nombre" label-placement="stacked" required />
        </ion-item>

        <ion-item class="field">
          <ion-input v-model="lastName" label="Apellido" label-placement="stacked" required />
        </ion-item>

        <ion-item class="field">
          <ion-input v-model="phone" type="tel" inputmode="numeric" pattern="[0-9]*" :maxlength="10" label="Teléfono"
            label-placement="stacked" autocomplete="tel" required />
        </ion-item>

        <ion-item class="field">
          <ion-input :type="show1 ? 'text' : 'password'" v-model="password" label="Contraseña" label-placement="stacked"
            autocomplete="new-password" required />
          <ion-button slot="end" fill="clear" size="small" @click="show1 = !show1">
            {{ show1 ? 'Ocultar' : 'Ver' }}
          </ion-button>
        </ion-item>

        <div class="hints" aria-label="Requisitos de contrasena">
          <div>
            <span class="bullet-dot" :class="{ ok: passLenOk }"></span>
            <ion-text :color="passLenOk ? 'success' : 'medium'">8+ caracteres</ion-text>
          </div>
          <div>
            <span class="bullet-dot" :class="{ ok: passUpOk }"></span>
            <ion-text :color="passUpOk ? 'success' : 'medium'">Mayuscula</ion-text>
          </div>
          <div>
            <span class="bullet-dot" :class="{ ok: passLoOk }"></span>
            <ion-text :color="passLoOk ? 'success' : 'medium'">Minuscula</ion-text>
          </div>
          <div>
            <span class="bullet-dot" :class="{ ok: passSpOk }"></span>
            <ion-text :color="passSpOk ? 'success' : 'medium'">Caracter especial</ion-text>
          </div>
        </div>

        <ion-item class="field">
          <ion-input :type="show2 ? 'text' : 'password'" v-model="password2" label="Confirmar Contraseña"
            label-placement="stacked" autocomplete="new-password" required />
          <ion-button slot="end" fill="clear" size="small" @click="show2 = !show2">
            {{ show2 ? 'Ocultar' : 'Ver' }}
          </ion-button>
        </ion-item>

        <ion-item lines="none" class="terms-item">
          <ion-checkbox id="termsCb" slot="start" v-model="acceptTerms" />
          <ion-label for="termsCb" class="terms-label">
            Acepto los
            <a href="#" @click.prevent.stop="openTerms">Términos y Condiciones</a>
          </ion-label>
        </ion-item>
      </ion-list>

      <ion-button expand="block" size="large" color="primary" class="btn-primary"
        :disabled="loading || !canContinue || otpOpen" @click="onContinue">
        <ion-spinner v-if="loading" name="dots" />
        <span v-else>Continuar</span>
      </ion-button>

      <ion-text v-if="err" color="danger" class="err">{{ err }}</ion-text>
    </ion-content>

    <ion-modal :is-open="otpOpen" @did-dismiss="closeOtp">
      <ion-content class="ion-padding otp-modal">
        <div class="grabber"></div>
        <h2 class="otp-title">Código de Verificación</h2>
        <p class="otp-subtitle">Introduce el código enviado a tu email.</p>

        <div class="otp-inputs">
          <input v-for="(_, i) in codeBoxes" :key="i" :ref="el => (otpRefs[i] = el as HTMLInputElement)"
            inputmode="numeric" pattern="[0-9]*" maxlength="1" class="otp-box" v-model="codeBoxes[i]"
            @input="onOtpInput(i)" @keydown.backspace.prevent="onOtpBackspace(i)" />
        </div>

        <div class="otp-actions">
          <ion-button expand="block" :disabled="verifying" @click="verifyOtpClick">
            <ion-spinner v-if="verifying" name="dots" />
            <span v-else>Verificar</span>
          </ion-button>

          <div class="resend">
            <span>¿No recibiste el código?</span>
            <button class="resend-link" :disabled="resendLeft > 0 || resending" @click="resendOtpClick">
              {{ resendLeft > 0 ? `Reenviar (${resendLeft}s)` : (resending ? 'Enviando...' : 'Reenviar') }}
            </button>
          </div>

          <ion-text v-if="otpErr" color="danger" class="err">{{ otpErr }}</ion-text>
        </div>
      </ion-content>
    </ion-modal>

    <ion-modal :is-open="termsOpen" @did-dismiss="closeTerms">
      <ion-header>
        <ion-toolbar>
          <ion-title>Términos y Condiciones</ion-title>
          <ion-buttons slot="end">
            <ion-button fill="clear" @click="closeTerms">Cerrar</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <h3>El Rincón - Comidas rápidas</h3>
        <p>Al registrarte aceptas:</p>
        <ul class="terms-list">
          <li>Usaremos tu correo para confirmar y actualizar tus pedidos.</li>
          <li>Revisa tu pedido al recibirlo y repórtalo en 15 minutos si hay problemas.</li>
          <li>Los tiempos de entrega pueden variar por clima, tráfico o alta demanda.</li>
          <li>Guardamos tus datos solo para operar la app y mejorar el servicio.</li>
          <li>No compartimos tu información con terceros ajenos a entrega y pago.</li>
        </ul>
        <ion-button expand="block" class="mt12" @click="closeTerms">Entendido</ion-button>
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/services/SupabaseClient'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonInput,
  IonButton,
  IonText,
  IonCheckbox,
  IonLabel,
  IonModal,
  IonSpinner,
} from '@ionic/vue'

import {
  isValidEmail,
  getPasswordChecks,
  isValidName,
  isValidPhone,
} from '@/utils/validatorsRegister'

import { createOrUpdateProfile } from '@/controllers/ProfileController'

const router = useRouter()

const email = ref('')
const firstName = ref('')
const lastName = ref('')
const phone = ref('')

const password = ref('')
const password2 = ref('')
const acceptTerms = ref(false)
const show1 = ref(false)
const show2 = ref(false)
const loading = ref(false)
const err = ref('')
const emailInput = ref<any>(null)

watch(phone, newVal => {
  const cleaned = (newVal || '').replace(/\D/g, '').slice(0, 10)
  if (cleaned !== newVal) phone.value = cleaned
})

const emailOk = computed(() => isValidEmail(email.value))

const passwordChecks = computed(() => getPasswordChecks(password.value))
const passLenOk = computed(() => passwordChecks.value.lenOk)
const passUpOk = computed(() => passwordChecks.value.upOk)
const passLoOk = computed(() => passwordChecks.value.loOk)
const passSpOk = computed(() => passwordChecks.value.spOk)
const passValid = computed(() => passwordChecks.value.valid)

const nameOk = computed(() => isValidName(firstName.value))
const lastNameOk = computed(() => isValidName(lastName.value))
const phoneOk = computed(() => isValidPhone(phone.value))

const canContinue = computed(
  () =>
    emailOk.value &&
    nameOk.value &&
    lastNameOk.value &&
    phoneOk.value &&
    passValid.value &&
    password.value === password2.value &&
    !!acceptTerms.value,
)

const OTP_LEN = 6
const otpOpen = ref(false)
const otpErr = ref('')
const verifying = ref(false)
const resending = ref(false)
const resendLeft = ref(0)
const RESEND_WAIT = 60

const codeBoxes = ref<string[]>(Array(OTP_LEN).fill(''))
const otpRefs = ref<HTMLInputElement[]>([])
const termsOpen = ref(false)

function focusBox(i: number) {
  nextTick(() => otpRefs.value?.[i]?.focus())
}

function focusEmail() {
  nextTick(() => {
    const ion = emailInput.value
    const inputEl: HTMLInputElement | null = ion?.$el?.querySelector('input') ?? null
    inputEl?.focus()
  })
}

function onOtpInput(i: number) {
  const v = codeBoxes.value[i]
  if (!/^\d$/.test(v)) {
    codeBoxes.value[i] = ''
    return
  }
  if (i < OTP_LEN - 1) focusBox(i + 1)
}
function onOtpBackspace(i: number) {
  if (codeBoxes.value[i]) {
    codeBoxes.value[i] = ''
    return
  }
  if (i > 0) focusBox(i - 1)
}
function openOtp() {
  otpOpen.value = true
  otpErr.value = ''
  codeBoxes.value = Array(OTP_LEN).fill('')
  startResendTimer()
  focusBox(0)
}
function closeOtp() {
  otpOpen.value = false
  clearTimer()
  focusEmail()
}

async function onContinue() {
  if (!canContinue.value || loading.value || otpOpen.value) return
  err.value = ''

  try {
    loading.value = true

    localStorage.setItem('otp_pending', '1')

    const { data, error: signErr } = await supabase.auth.signUp({
      email: email.value.trim(),
      password: password.value,
    })

    if (signErr) {
      console.error('signUp error detail:', signErr)

      if ((signErr as any).status === 422) {
        throw new Error('Este correo ya está registrado. Usa otro correo o inicia sesión.')
      }

      if (
        (signErr as any).status === 500 ||
        ((signErr as any).message &&
          (signErr as any).message.includes('Database error saving new user'))
      ) {
        try {
          const { error: otpSendErr } = await supabase.auth.signInWithOtp({
            email: email.value.trim(),
            options: { shouldCreateUser: true },
          })
          if (otpSendErr) throw otpSendErr
          openOtp()
          return
        } catch (e) {
          throw signErr
        }
      }

      throw signErr
    }

    if (data?.session) {
      await supabase.auth.signOut()
    }

    const { error: otpSendErr } = await supabase.auth.signInWithOtp({
      email: email.value.trim(),
      options: { shouldCreateUser: false },
    })
    if (otpSendErr) throw otpSendErr

    openOtp()
  } catch (e: any) {
    localStorage.removeItem('otp_pending')
    err.value = e?.message ?? 'No fue posible registrar. Inténtalo de nuevo.'
  } finally {
    loading.value = false
  }
}

async function verifyOtpClick() {
  otpErr.value = ''
  const token = codeBoxes.value.join('')
  if (token.length !== OTP_LEN) {
    otpErr.value = `Ingresa los ${OTP_LEN} dígitos.`
    return
  }
  try {
    verifying.value = true
    const { error } = await supabase.auth.verifyOtp({
      email: email.value.trim(),
      token,
      type: 'email',
    })
    if (error) throw error

    const { data: ures, error: uerr } = await supabase.auth.getUser()
    if (!uerr && ures.user) {
      await createOrUpdateProfile({
        id: ures.user.id,
        first_name: firstName.value.trim(),
        last_name: lastName.value.trim(),
        email: email.value.trim(),
        phone: phone.value.trim(),
      })
    }

    localStorage.removeItem('otp_pending')
    closeOtp()
    router.replace('/tabs/tab1')
  } catch (e: any) {
    otpErr.value = e?.message ?? 'Código inválido o expirado.'
  } finally {
    verifying.value = false
  }
}

async function resendOtpClick() {
  if (resendLeft.value > 0) return
  try {
    resending.value = true
    const { error } = await supabase.auth.signInWithOtp({
      email: email.value.trim(),
      options: { shouldCreateUser: false },
    })
    if (error) throw error
    startResendTimer()
  } catch (e: any) {
    otpErr.value = e?.message ?? 'No se pudo reenviar el código.'
  } finally {
    resending.value = false
  }
}

let timer: number | undefined
function startResendTimer() {
  clearTimer()
  resendLeft.value = RESEND_WAIT
  timer = window.setInterval(() => {
    resendLeft.value--
    if (resendLeft.value <= 0) clearTimer()
  }, 1000)
}
function clearTimer() {
  if (timer) {
    clearInterval(timer)
    timer = undefined
  }
}

function openTerms() {
  termsOpen.value = true
}
function closeTerms() {
  termsOpen.value = false
}
</script>

<style scoped>
.form {
  display: grid;
  gap: 10px;
}

.field {
  --border-radius: 12px;
  --inner-padding-end: 8px;
  margin-bottom: 6px;
  border-radius: 12px;
}

.field ion-input::part(label) {
  display: block;
  margin-bottom: 6px;
}

.hints {
  display: grid;
  gap: 6px;
  padding: 6px 12px 0 16px;
  margin: -2px 0 8px;
  font-size: 13px;
}

.hints>div {
  display: flex;
  align-items: center;
  gap: 10px;
}

.hints ion-text {
  font-weight: 600;
}

.bullet-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: var(--ion-color-medium);
  flex-shrink: 0;
}

.bullet-dot.ok {
  background: var(--ion-color-success);
}

.terms-item {
  --inner-padding-end: 0;
}

.terms-item ion-checkbox {
  --size: 20px;
}

.terms-label a {
  color: var(--ion-color-primary);
  text-decoration: none;
  font-weight: 600;
}

.btn-primary {
  margin-top: 12px;
  --border-radius: 16px;
}

.err {
  display: block;
  margin-top: 10px;
}

.otp-modal {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  gap: 16px;
  text-align: center;
}

.grabber {
  width: 48px;
  height: 5px;
  border-radius: 3px;
  background: #e5e7eb;
  margin: 6px auto 8px;
}

.otp-title {
  margin: 0;
  font-weight: 800;
}

.otp-subtitle {
  margin: 0;
  font-size: 14px;
  color: var(--ion-color-medium);
}

.otp-inputs {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin: 16px 0;
}

.otp-box {
  width: 40px;
  height: 48px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  text-align: center;
  font-size: 20px;
  background: white;
  color: black;
}

.otp-actions {
  display: grid;
  gap: 12px;
}

.resend {
  text-align: center;
  font-size: 14px;
}

.resend-link {
  background: none;
  border: none;
  padding: 0 0 0 6px;
  color: var(--ion-color-primary);
  cursor: pointer;
}
</style>