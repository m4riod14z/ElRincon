<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from './services/supabaseClient.ts'

// ✅ Importa IonApp (y opcionalmente IonPage/IonContent si luego quieres)
import { IonApp } from '@ionic/vue'

const instruments = ref([])

async function getInstruments() {
  const { data } = await supabase.from('instruments').select()
  instruments.value = data ?? []
}

onMounted(() => {
  getInstruments()
})
</script>

<template>
  <ion-app>
    <!-- Tu contenido actual se mantiene igual -->
    <ul>
      <li v-for="instrument in instruments" :key="instrument.id">
        {{ instrument.name }}
      </li>
    </ul>
  </ion-app>
</template>
