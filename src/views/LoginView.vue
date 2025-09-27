<script setup lang="ts">
import {
    IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle,
    IonContent, IonItem, IonLabel, IonInput, IonButton, IonIcon, IonText, IonToast
} from '@ionic/vue';
import { eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { isEmail, isStrongPassword } from '@/utils/valitations';
import { loginWithEmail } from '@/controllers/AuthController';

const router = useRouter();

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);

const toastOpen = ref(false);
const toastMsg = ref('');

// validaciones (para feedback visual en tiempo real)
const emailOk = computed(() => !email.value || isEmail(email.value));
const passwordOk = computed(() => !password.value || isStrongPassword(password.value));
const formOk = computed(() => isEmail(email.value) && isStrongPassword(password.value));

const togglePassword = () => (showPassword.value = !showPassword.value);

function toast(msg: string) {
    toastMsg.value = msg;
    toastOpen.value = true;
}

async function onSubmit() {
    try {
        loading.value = true;
        await loginWithEmail(email.value, password.value);
        // Redirige a tu pantalla de Menú/Tabs
        router.replace('/tabs/tab1');
    } catch (e: any) {
        toast(e.message || 'Error al iniciar sesión');
    } finally {
        loading.value = false;
    }
}
</script>

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

            <!-- Email -->
            <IonItem lines="none" class="field">
                <IonLabel position="stacked">Correo electrónico</IonLabel>
                <IonInput type="email" placeholder="tunombre@ejemplo.com" v-model="email" inputmode="email"
                    autocomplete="email" :class="{ invalid: email && !emailOk }" />
            </IonItem>
            <IonText v-if="email && !emailOk" color="danger" class="hint">
                Ingrese un correo válido
            </IonText>

            <!-- Contraseña -->
            <IonItem lines="none" class="field">
                <IonLabel position="stacked">Contraseña</IonLabel>
                <div class="password-wrapper">
                    <IonInput :type="showPassword ? 'text' : 'password'" placeholder="Ingresa tu contraseña"
                        v-model="password" autocomplete="current-password"
                        :class="{ invalid: password && !passwordOk }" />
                    <IonButton fill="clear" size="small" class="eye-btn" @click="togglePassword"
                        aria-label="Ver contraseña">
                        <IonIcon :icon="showPassword ? eyeOffOutline : eyeOutline" />
                    </IonButton>
                </div>
            </IonItem>
            <IonText v-if="password && !passwordOk" color="medium" class="hint">
                Mín. 8 caracteres, 1 mayúscula, 1 minúscula y 1 carácter especial.
            </IonText>

            <!-- Continuar (ROJO) -->
            <IonButton expand="block" color="danger" :disabled="!formOk || loading" @click="onSubmit"
                class="submit-btn">
                {{ loading ? 'Ingresando…' : 'Continuar' }}
            </IonButton>

            <IonToast :is-open="toastOpen" :message="toastMsg" duration="1800" @didDismiss="toastOpen = false"
                color="dark" position="bottom" />
        </IonContent>
    </IonPage>
</template>

<style scoped>
.title {
    font-size: 22px;
    font-weight: 800;
    margin: 8px 0 16px;
}

.field {
    margin-bottom: 8px;
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
    margin: 2px 4px 10px;
    font-size: 12px;
}

.submit-btn {
    margin-top: 18px;
}
</style>