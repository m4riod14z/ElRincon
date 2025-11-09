<template>
    <ion-page>
        <ion-content class="ion-padding" fullscreen>
            <h2 class="title">Perfil del restaurante</h2>
            <ion-list>
                <ion-item lines="full">
                    <ion-label>Pronto: datos del local, horarios, info de contacto…</ion-label>
                </ion-item>
            </ion-list>
        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonContent, IonList, IonItem, IonLabel } from '@ionic/vue'
</script>

<style scoped>
.title {
    font-weight: 800;
    margin-bottom: 10px;
}
</style>