<template>
  <ion-page>
    <ion-header translucent>
      <ion-toolbar class="toolbar">
        <ion-title class="brand">El Rincón</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content fullscreen class="home-content ion-padding">
      <div class="wrap">
        <div class="card">
          <img src="/Logo.png" alt="Logo" class="logo" />

          <h1 class="title">¡Bienvenido!</h1>
          <p class="subtitle">Tu comida rápida favorita, más cerca de ti.</p>

          <ion-button
            expand="block"
            size="large"
            class="btn-google"
            @click="onGoogle"
          >
            <span class="g-icon" aria-hidden="true" v-html="googleSvg"></span>
            <span>Continuar con Google</span>
          </ion-button>

          <!-- ✅ vuelve a togglear en la misma pantalla -->
          <ion-button
            expand="block"
            size="large"
            fill="outline"
            class="btn-email"
            @click="toggleEmail"
          >
            Continuar con correo
          </ion-button>

          <!-- ✅ bloque desplegable con Ingresar/Registrarse -->
          <ion-card v-if="showEmailOptions" class="email-card">
            <ion-card-content>
              <div class="email-actions">
                <ion-button
                  expand="block"
                  color="medium"
                  fill="solid"
                  @click="onLogin"
                >
                  Ingresar
                </ion-button>
                <ion-button
                  expand="block"
                  color="tertiary"
                  fill="solid"
                  @click="onRegister"
                >
                  Registrarse
                </ion-button>
              </div>
            </ion-card-content>
          </ion-card>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { AuthController } from '@/controllers/AuthGoogleController'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonCard, IonCardContent
} from '@ionic/vue'

const router = useRouter()
const controller = new AuthController(router)

const showEmailOptions = ref(false)
function toggleEmail() { showEmailOptions.value = !showEmailOptions.value }
function onGoogle() { controller.continueWithGoogle() }
function onLogin() { controller.goToLogin() }
function onRegister() { controller.goToRegister() }

/* Ícono Google SVG inline */
const googleSvg = computed(() => `
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48" role="img">
  <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.6 32.5 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.9 6.1 29.7 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-9 20-20 0-1.3-.1-2.5-.4-3.5z"/>
  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16.6 18.9 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.9 6.1 29.7 4 24 4 15.6 4 8.5 8.9 6.3 14.7z"/>
  <path fill="#4CAF50" d="M24 44c5.1 0 9.9-1.9 13.5-5.1l-6.2-5.1C29.3 35.1 26.8 36 24 36c-5.1 0-9.4-3.3-11-7.9l-6.6 5.1C8.5 39.1 15.6 44 24 44z"/>
  <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.6 5.7-6.8 6.8l6.2 5.1C37.3 37.1 40 31.9 40 26c0-1.3-.1-2.5-.4-3.5z"/>
</svg>
`)
</script>

<style scoped>
.home-content {
  --padding-start: 0;
  --padding-end: 0;
  background: linear-gradient(165deg, #fff 0%, #fff7f7 40%, #fff0f0 100%);
  display: grid;
  place-items: center;
}
.wrap { width: min(520px, 92vw); margin: 24px auto; }
.card {
  background: white; border-radius: 20px; padding: 24px;
  box-shadow: 0 10px 15px rgba(0,0,0,0.06), 0 4px 6px rgba(0,0,0,0.05);
  display: grid; gap: 14px; text-align: center;
}
.logo { width: 88px; height: 88px; object-fit: contain; margin: 0 auto 6px; }
.title { margin: 4px 0 0; font-weight: 800; letter-spacing: .2px; }
.subtitle { margin: 0; color: var(--ion-color-medium); }
ion-button { --border-radius: 14px; --box-shadow: none; }
.btn-google {
  --background: #ffffff; --border-color: #e5e7eb; --border-style: solid; --border-width: 1px; color: #111827;
}
.btn-google:hover { filter: brightness(0.98); }
.btn-email { --border-radius: 14px; }
.g-icon { display: inline-grid; place-items: center; margin-right: 10px; }
.email-card { border-radius: 16px; border: 1px solid #f1f5f9; }
.email-actions { display: grid; gap: 10px; }
.toolbar { --background: transparent; --border-width: 0; }
.brand { font-weight: 800; letter-spacing: .2px; }
</style>
