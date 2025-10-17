<!-- src/views/TabsPage.vue -->
<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet />

      <!-- ✅ Tab bar oficial, siempre abajo -->
      <ion-tab-bar slot="bottom" class="segmented">
        <ion-tab-button tab="tab1" href="/tabs/tab1">
          <ion-icon :icon="restaurantOutline" />
          <ion-label>MENÚ</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="tab2" href="/tabs/tab2">
          <ion-icon :icon="receiptOutline" />
          <ion-label>PEDIDOS</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="tab3" href="/tabs/tab3">
          <ion-icon :icon="personOutline" />
          <ion-label>PERFIL</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonTabs, IonRouterOutlet, IonTabBar, IonTabButton, IonIcon, IonLabel
} from '@ionic/vue'
import { restaurantOutline, receiptOutline, personOutline } from 'ionicons/icons'
</script>

<style scoped>
/* Estilo “segment” para la tab bar */
.segmented {
  --background: var(--ion-color-step-50, #1f1f1f);
  --color: var(--ion-color-medium);
  --color-selected: var(--ion-color-primary);
  border-top: 1px solid rgba(255,255,255,0.06);
}
.segmented ion-tab-button {
  --padding-start: 10px;
  --padding-end: 10px;
  --color: var(--ion-color-medium);
}
.segmented ion-tab-button.tab-selected {
  --color-selected: var(--ion-color-primary);
  border-top: 2px solid var(--ion-color-primary);
}
</style>
