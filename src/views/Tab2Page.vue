<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Mis pedidos</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div v-if="loading">Cargando pedidos...</div>
      <div v-else-if="error">{{ error }}</div>
      <div v-else>
        <section>
          <h2>Solicitados</h2>
          <OrderList :orders="solicitados" />
        </section>

        <section>
          <h2>En progreso</h2>
          <OrderList :orders="enProgreso" />
        </section>

        <section>
          <h2>Enviados</h2>
          <OrderList
            :orders="enviados"
            :allowDeliver="true"
            @mark-delivered="marcarEntregado"
          />
        </section>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/vue'
import { useOrders } from '@/controllers/useOrders'
import OrderList from '@/components/OrderList.vue'
const { loading, error, solicitados, enProgreso, enviados, marcarEntregado } = useOrders()

</script>

<style scoped>
h2 { font-size: 18px; font-weight: 800; margin-top: 14px; }
section { margin-bottom: 24px; }
</style>