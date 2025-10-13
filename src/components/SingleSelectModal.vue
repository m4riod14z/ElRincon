<template>
    <ion-modal :is-open="open" @didDismiss="$emit('update:open', false)">
        <ion-header>
            <ion-toolbar>
                <ion-title>{{ title }}</ion-title>
                <ion-buttons slot="end">
                    <ion-button fill="clear" @click="$emit('update:open', false)">Cerrar</ion-button>
                </ion-buttons>
            </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding">
            <ion-radio-group v-model="model">
                <ion-list>
                    <ion-item>
                        <ion-label>Ninguna</ion-label>
                        <ion-radio :value="null" justify="end"></ion-radio>
                    </ion-item>

                    <ion-item v-for="opt in options" :key="opt.id">
                        <ion-label>{{ opt.name }} — {{ fmt(opt.price) }}</ion-label>
                        <ion-radio :value="opt.id" justify="end"></ion-radio>
                    </ion-item>
                </ion-list>
            </ion-radio-group>

            <ion-button expand="block" class="mt" @click="$emit('update:open', false)">Aceptar</ion-button>
        </ion-content>
    </ion-modal>
</template>

<script setup lang="ts">
import {
    IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
    IonContent, IonList, IonItem, IonLabel, IonRadioGroup, IonRadio
} from "@ionic/vue";
import { computed } from "vue";
import { fmtCOP } from "@/utils/money";

const props = defineProps<{
    open: boolean;
    title: string;
    options: { id: number; name: string; price: number }[];
    modelValue: number | null;
}>();
const emit = defineEmits(["update:modelValue", "update:open"]);
const model = computed({
    get: () => props.modelValue,
    set: (v) => emit("update:modelValue", v),
});
const fmt = (n: number) => fmtCOP(n);
</script>

<style scoped>
.mt {
    margin-top: 10px;
}
</style>