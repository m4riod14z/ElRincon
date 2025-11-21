﻿// src/main.ts
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { IonicVue } from '@ionic/vue'
import { supabase } from '@/services/SupabaseClient'
import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { ensureProfileRow, clearCachedUserRole } from '@/controllers/ProfileController'

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

const go = (path: string) => {
  if (router.currentRoute.value.path !== path) router.replace(path)
}

supabase.auth.onAuthStateChange(async (event, session) => {
  const otpPending = localStorage.getItem('otp_pending') === '1'

  if (event === 'SIGNED_IN' && session) {
    if (otpPending) return
    clearCachedUserRole()
    clearCachedUserRole()
    return go('/tabs/tab1')
  }

  if (event === 'SIGNED_OUT') {
    clearCachedUserRole()
    if (router.currentRoute.value.path.startsWith('/tabs')) {
      return go('/home')
    }
  }
})

// Ensure we remove focus from any active element before navigating
router.beforeEach((to, from, next) => {
  try { (document.activeElement as HTMLElement | null)?.blur(); } catch {}
  next()
})

router.isReady().then(() => app.mount('#app'))

// Deep link handler for Supabase OAuth on native platforms
if (Capacitor.isNativePlatform()) {
  CapacitorApp.addListener('appUrlOpen', async (event) => {
    const url = event?.url || ''
    if (url.startsWith('io.ionic.starter://auth/callback')) {
      try {
        // Prefer PKCE auth code from query string
        let exchanged = false
        try {
          const parsed = new URL(url)
          const code = parsed.searchParams.get('code')
          if (code) {
            await supabase.auth.exchangeCodeForSession(code)
            exchanged = true
          }
        } catch {
          // Ignore malformed callback URLs
        }
        // Fallback: some SDK versions accept the full callback URL string
        if (!exchanged) {
          await supabase.auth.exchangeCodeForSession(url)
        }
        // Crea perfil por defecto si no existe (rol 'client')
        await ensureProfileRow()
        clearCachedUserRole()
        clearCachedUserRole()
        try { localStorage.removeItem('otp_pending') } catch {
          // Ignore storage failures
        }
        go('/tabs/tab1')
      } catch (err) {
        console.error('OAuth deep link error:', err)
      }
    }
  })
}


