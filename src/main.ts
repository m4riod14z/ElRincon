// src/main.ts
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { IonicVue } from '@ionic/vue'
import { supabase } from '@/services/SupabaseClient'

import '@ionic/vue/css/core.css'
import '@ionic/vue/css/normalize.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'
import '@ionic/vue/css/padding.css'
import '@ionic/vue/css/float-elements.css'
import '@ionic/vue/css/text-alignment.css'
import '@ionic/vue/css/text-transformation.css'
import '@ionic/vue/css/flex-utils.css'
import '@ionic/vue/css/display.css'
import '@ionic/vue/css/palettes/dark.system.css'
import './theme/variables.css'

const app = createApp(App).use(IonicVue).use(router)

// Helper para no duplicar navegación
const go = (path: string) => {
  if (router.currentRoute.value.path !== path) router.replace(path)
}

// 🔑 Listener con “otp_pending” para ignorar el SIGNED_IN del signUp
supabase.auth.onAuthStateChange(async (event, session) => {
  const otpPending = localStorage.getItem('otp_pending') === '1'

  if (event === 'SIGNED_IN' && session) {
    // Si estamos en flujo de registro con OTP pendiente, NO redirigir aún
    if (otpPending) return
    // Si no hay OTP pendiente, lleva al menú
    return go('/tabs/tab1')
  }

  if (event === 'SIGNED_OUT') {
    // Si no hay sesión y alguien intenta ir a tabs, devuélvelo
    if (router.currentRoute.value.path.startsWith('/tabs')) {
      return go('/home')
    }
  }
})

router.isReady().then(() => app.mount('#app'))
