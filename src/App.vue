<template>
  <ion-app>
    <SplashScreen v-if="showSplash" @finish="handleSplashFinish" />
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import SplashScreen from './components/SplashScreen.vue'

const route = useRoute()
const isHomeRoute = computed(() => {
  if (!route) return false
  return route.name === 'home' || route.path === '/home' || route.path === '/'
})
const splashFinished = ref(!isHomeRoute.value)
const showSplash = computed(() => isHomeRoute.value && !splashFinished.value)

watch(isHomeRoute, (isHome) => {
  if (!isHome) splashFinished.value = true
})

const handleSplashFinish = () => {
  splashFinished.value = true
}
</script>
