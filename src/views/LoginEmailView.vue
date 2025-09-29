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

        <IonContent class="ion-padding" fullscreen>
            <h1 class="title">Ingresa a tu cuenta</h1>

            <!-- Aviso temporal (amarillo, no toast) -->
            <div v-if="authAlertVisible" class="inline-alert">
                {{ authAlert }}
            </div>

            <!-- Email -->
            <IonItem lines="none" class="field">
                <IonLabel position="stacked">Correo electrónico</IonLabel>
                <IonInput type="email" placeholder="tunombre@ejemplo.com" v-model="email" inputmode="email"
                    autocomplete="email" @ionBlur="touchedEmail = true" :class="{ invalid: !!emailError }" />
            </IonItem>
            <IonText v-if="emailError" color="danger" class="hint">{{ emailError }}</IonText>

            <!-- Contraseña -->
            <IonItem lines="none" class="field">
                <IonLabel position="stacked">Contraseña</IonLabel>
                <div class="password-wrapper">
                    <IonInput :type="showPassword ? 'text' : 'password'" placeholder="Ingresa tu contraseña"
                        v-model="password" autocomplete="current-password" @ionBlur="touchedPassword = true"
                        :class="{ invalid: !!passwordError }" />
                    <IonButton fill="clear" size="small" class="eye-btn" @click="togglePassword"
                        aria-label="Ver contraseña">
                        <IonIcon :icon="showPassword ? eyeOffOutline : eyeOutline" />
                    </IonButton>
                </div>
            </IonItem>
            <IonText v-if="passwordError" color="danger" class="hint">{{ passwordError }}</IonText>

            <!-- Continuar (rojo) -->
            <IonButton expand="block" color="danger" :disabled="!formOk || loading" @click="onSubmit"
                class="submit-btn">
                {{ loading ? 'Ingresando…' : 'Continuar' }}
            </IonButton>
        </IonContent>
    </IonPage>
</template>

<script setup lang="ts">
import {
    IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle,
    IonContent, IonItem, IonLabel, IonInput, IonButton, IonIcon, IonText
} from '@ionic/vue';
import { eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { ref, computed, watch } from 'vue';
// import { useRouter } from 'vue-router';
import { isEmail, isNotEmpty } from '@/utils/validatorsLogin';
import { loginWithEmail } from '@/controllers/AuthEmailController';

// const router = useRouter();

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);

const touchedEmail = ref(false);
const touchedPassword = ref(false);

const authAlert = ref('');
const authAlertVisible = ref(false);
let authAlertTimer: ReturnType<typeof setTimeout> | null = null;

function showAuthAlert(msg: string, ms = 2500) {
    authAlert.value = msg;
    authAlertVisible.value = true;
    if (authAlertTimer) clearTimeout(authAlertTimer);
    authAlertTimer = setTimeout(() => {
        authAlertVisible.value = false;
        authAlert.value = '';
        authAlertTimer = null;
    }, ms);
}

const emailError = computed(() => {
    if (!touchedEmail.value) return '';
    if (!isNotEmpty(email.value)) return 'El correo es obligatorio';
    if (!isEmail(email.value)) return 'Ingrese un correo válido';
    return '';
});

const passwordError = computed(() => {
    if (!touchedPassword.value) return '';
    if (!isNotEmpty(password.value)) return 'La contraseña es obligatoria';
    return '';
});

const formOk = computed(() =>
    isNotEmpty(email.value) && isEmail(email.value) && isNotEmpty(password.value)
);

// Si el usuario vuelve a tipear, escondemos el aviso temporal
watch([email, password], () => {
    authAlertVisible.value = false;
    authAlert.value = '';
    if (authAlertTimer) { clearTimeout(authAlertTimer); authAlertTimer = null; }
});

function togglePassword() {
    showPassword.value = !showPassword.value;
}

async function onSubmit() {
    if (!formOk.value || loading.value) return;

    loading.value = true;
    try {
        await loginWithEmail(email.value, password.value);
        // router.replace('/tabs/tab1'); --> ACTUALIZAR CUANDO SE CREE LA PRIMERA PANTALLA
    } catch {
        showAuthAlert('Correo o contraseña incorrectos');
        touchedPassword.value = true;
    } finally {
        loading.value = false;
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
    margin-bottom: 6px;
}

.password-wrapper {
    position: relative;
    width: 100%;
}

.eye-btn {
    position: absolute;
    right: 4px;
    top: 16px;
    --padding-start: 6px;
    --padding-end: 6px;
}

.invalid {
    --highlight-color-focused: var(--ion-color-danger);
    border: 1px solid var(--ion-color-danger);
    border-radius: 10px;
}

.hint {
    margin: 4px 4px 12px;
    font-size: 12px;
}

/* Aviso amarillo temporal */
.inline-alert {
    background: #fff3cd;
    /* amarillo suave */
    color: #8a6d3b;
    /* marrón */
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