<template>
  <ion-page>
    <ion-header translucent>
      <ion-toolbar class="toolbar">
        <ion-buttons slot="start"><ion-back-button defaultHref="/home" /></ion-buttons>
        <ion-title class="brand">El Rincón</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content fullscreen class="home-content ion-padding">
      <div class="wrap">
        <div class="card">
          <img src="/Logo.png" alt="Logo" class="logo" />
          <h1 class="title">Bienvenido a El Rincón</h1>
          <p class="subtitle">Tus comidas rápidas en un solo lugar</p>

          <ion-button expand="block" size="large" color="primary" @click="router.push({ name: 'login' })">
            Ingresar
          </ion-button>
          <ion-button expand="block" size="large" fill="outline" @click="router.push({ name: 'register' })">
            Registrarse
          </ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent, IonButton
} from '@ionic/vue'
const router = useRouter()
</script>

<style scoped>
/* mismos estilos que Home */
.home-content { --padding-start: 0; --padding-end: 0; background: linear-gradient(165deg, #fff 0%, #fff7f7 40%, #fff0f0 100%); display: grid; place-items: center; }
.wrap { width: min(520px, 92vw); margin: 24px auto; }
.card { background: white; border-radius: 20px; padding: 24px; box-shadow: 0 10px 15px rgba(0,0,0,0.06), 0 4px 6px rgba(0,0,0,0.05); display: grid; gap: 14px; text-align: center; }
.logo { width: 88px; height: 88px; object-fit: contain; margin: 0 auto 6px; }
.title { margin: 4px 0 0; font-weight: 800; letter-spacing: .2px; }
.subtitle { margin: 0; color: var(--ion-color-medium); }
ion-button { --border-radius: 14px; --box-shadow: none; }
.toolbar { --background: transparent; --border-width: 0; }
.brand { font-weight: 800; letter-spacing: .2px; }
</style>
