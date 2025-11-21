<template>
    <IonPage>
        <IonHeader translucent>
            <IonToolbar>
                <IonButtons slot="start">
                    <IonBackButton default-href="/tabs/tab1" />
                </IonButtons>
                <IonTitle>El Rincón</IonTitle>
            </IonToolbar>
            </IonHeader>

            <IonContent class="ion-padding login-content" fullscreen>
                <h1 class="title">Ingresa a tu cuenta</h1>

                <!-- Aviso temporal -->
                <div v-if="authAlertVisible" class="inline-alert">
                    {{ authAlert }}
                </div>

                <!-- Email -->
                <IonItem class="field">
                    <IonInput type="email" v-model="email" label="Correo electrónico" label-placement="floating"
                        inputmode="email" autocomplete="email" required @ionBlur="touchedEmail = true" placeholder="tunombre@ejemplo.com" />
                </IonItem>
                <IonText v-if="emailError" color="danger" class="hint">{{ emailError }}</IonText>

                <!-- Contraseña -->
                <IonItem class="field">
                    <IonInput :type="showPassword ? 'text' : 'password'" v-model="password" label="Contraseña" label-placement="floating"
                        autocomplete="current-password" required @ionBlur="touchedPassword = true" />
                    <IonButton slot="end" fill="clear" size="small" @click="togglePassword">
                        <IonIcon :icon="showPassword ? eyeOffOutline : eyeOutline" />
                    </IonButton>
                </IonItem>
                <IonText v-if="passwordError" color="danger" class="hint">{{ passwordError }}</IonText>

                <!-- Continuar -->
                <IonButton expand="block" color="primary" :disabled="!formOk || loading" @click="onSubmit"
                    class="submit-btn btn-primary">
                    {{ loading ? 'Ingresando' : 'Continuar' }}
                </IonButton>
            </IonContent>
        </IonPage>
    </template>

<script setup lang="ts">
import {
    IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle,
    IonContent, IonItem, IonLabel, IonInput, IonButton, IonIcon, IonText
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
    if (!isEmail(email.value)) return 'Ingrese un correo válido'
    return ''
})

const passwordError = computed(() => {
    if (!touchedPassword.value) return ''
    if (!isNotEmpty(password.value)) return 'La contraseña es obligatoria'
    return ''
})

const formOk = computed(() =>
    isNotEmpty(email.value) && isEmail(email.value) && isNotEmpty(password.value)
)

// Si el usuario vuelve a tipear, escondemos el aviso temporal
watch([email, password], () => {
    authAlertVisible.value = false
    authAlert.value = ''
    if (authAlertTimer) { clearTimeout(authAlertTimer); authAlertTimer = null }
})

function togglePassword() {
    showPassword.value = !showPassword.value
}

async function onSubmit() {
    if (!formOk.value || loading.value) return

    loading.value = true
    try {
        await loginWithEmail(email.value, password.value)
        router.replace('/tabs/tab1')
    } catch {
        showAuthAlert('Correo o contraseña incorrectos')
        touchedPassword.value = true
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

.field {
    margin-bottom: 24px; /* aún más separación entre campos */
    --background: transparent;
    --inner-padding-start: 0;
    --inner-padding-end: 0;
    --inner-padding-top: 0;
    --inner-padding-bottom: 0;
    --padding-start: 0;
    --padding-end: 0;
}

/* Ajustes para aumentar el espacio entre label flotante y el contenido del input */
.field ion-input {
    --padding-top: 24px; /* dejar más espacio arriba dentro del input */
    --padding-bottom: 20px; /* y abajo para mejorar el área táctil */
}

.field ion-label {
    margin-bottom: 12px;
    font-weight: 700;
}

/* Aumentar el área táctil del botón "ver contraseña" */
.field ion-button[slot="end"] {
    min-width: 48px;
    height: 48px;
    --padding-start: 10px;
    --padding-end: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
}

/* Si el icono queda muy a la derecha en pantallas pequeñas, reducir margen */
.field ion-button[slot="end"] ion-icon {
    font-size: 1.2rem;
}

/* Aumentar espacio entre el título de la página y el primer campo */
.login-content .title {
    margin-bottom: 22px;
}

/* floating labels are used (matching RegisterPage) */

/* Push the whole form down a bit so it's not too close to the top */
.login-content {
    padding-top: 100px; /* increased to move form further down */
}

.input-frame {
    box-sizing: border-box;
    width: 100%;
    min-height: 44px;
    border: 1px solid var(--ion-color-medium);
    border-radius: 10px;
    background: var(--ion-item-background, #ffffff);
    padding: 6px 12px;
    display: flex;
    align-items: center;
    position: relative;
}

.input-frame.with-eye {
    padding-right: 40px;
}

.input-frame.invalid {
    border-color: var(--ion-color-danger);
}

.input-frame ion-input {
    width: 100%;
    --padding-start: 0;
    --padding-end: 0;
}

.eye-plain {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 26px;
    width: 26px;
    line-height: 0;
    z-index: 2;
}

.eye-plain ion-icon {
    font-size: 1.4rem;
    color: var(--ion-color-medium);
}

.eye-plain:hover ion-icon {
    color: var(--ion-color-light);
}

.hint {
    margin: 4px 4px 12px;
    font-size: 12px;
}

.inline-alert {
    background: #fff3cd;
    color: #8a6d3b;
    border: 1px solid #ffe6a7;
    border-radius: 8px;
    padding: 10px 12px;
    margin: 6px 0 12px;
    font-size: 13px;
}

.submit-btn {
    margin-top: 18px;
}
</style>