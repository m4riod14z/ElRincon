﻿// src/main.ts
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { IonicVue } from '@ionic/vue'
import { supabase } from '@/services/SupabaseClient'
import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { StatusBar } from '@capacitor/status-bar'
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
  if (router.currentRoute.value.path !== path) {
    router.replace(path)
  }
}

supabase.auth.onAuthStateChange(async (event, session) => {
  const otpPending = localStorage.getItem('otp_pending') === '1'

  if (event === 'SIGNED_IN' && session) {
    if (otpPending) return

    clearCachedUserRole()
    clearCachedUserRole()

    // Solo redirige automáticamente si el usuario está en páginas de entrada/auth
    try {
      const curr = router.currentRoute.value.path
      const isEntryRoute =
        curr === '/' ||
        curr === '/home' ||
        curr === '/login' ||
        curr === '/register' ||
        curr.startsWith('/auth')

      if (isEntryRoute) {
        return go('/tabs/tab1')
      }
      // si está en otra parte de la app, NO lo movemos
      return
    } catch {
      // fallback seguro
      return go('/tabs/tab1')
    }
  }

  if (event === 'SIGNED_OUT') {
    clearCachedUserRole()
    if (router.currentRoute.value.path.startsWith('/tabs')) {
      return go('/home')
    }
  }
})

// Quitar foco de cualquier input antes de cambiar de ruta
router.beforeEach((to, from, next) => {
  try {
    (document.activeElement as HTMLElement | null)?.blur()
  } catch {
    // ignore
  }
  next()
})

router.isReady().then(() => app.mount('#app'))

// Manejar posible OAuth redirect en web (PKCE / auth code flow)
// Si el proveedor redirige con ?code=... intercambiamos el código por sesión.
if (!Capacitor.isNativePlatform()) {
  try {
    const url = window.location.href
    const parsed = new URL(url)
    const code = parsed.searchParams.get('code')
    if (code) {
      ;(async () => {
        try {
          await supabase.auth.exchangeCodeForSession(code)
          // Asegurar fila de profile y limpiar cache/otp
          await ensureProfileRow()
          clearCachedUserRole()
          clearCachedUserRole()
          try { localStorage.removeItem('otp_pending') } catch {}
          // Redirigir al main
          if (router.currentRoute.value.path === '/' || router.currentRoute.value.path === '/home' || router.currentRoute.value.path === '/login' || router.currentRoute.value.path === '/register') {
            router.replace('/tabs/tab1')
          }
        } catch (err) {
          console.error('OAuth web exchange error:', err)
        }
      })()
    }
  } catch (e) {
    // ignore malformed URL
  }
}

// ========= Nativo (Android / iOS) =========
if (Capacitor.isNativePlatform()) {
  // Evita que la status bar se superponga al contenido
  StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {
    // si falla, simplemente seguimos
  })

  // Deep link handler para Supabase OAuth
  CapacitorApp.addListener('appUrlOpen', async (event) => {
    const url = event?.url || ''
    if (url.startsWith('io.ionic.starter://auth/callback')) {
      try {
        // Preferir PKCE auth code de la query string
        let exchanged = false
        try {
          const parsed = new URL(url)
          const code = parsed.searchParams.get('code')
          if (code) {
            await supabase.auth.exchangeCodeForSession(code)
            exchanged = true
          }
        } catch {
          // URL mal formada -> ignoramos
        }

        // Fallback: pasar la URL completa
        if (!exchanged) {
          await supabase.auth.exchangeCodeForSession(url)
        }

        // Crear perfil por defecto si no existe (rol 'client')
        await ensureProfileRow()
        clearCachedUserRole()
        clearCachedUserRole()

        try {
          localStorage.removeItem('otp_pending')
        } catch {
          // ignore storage errors
        }

        go('/tabs/tab1')
      } catch (err) {
        console.error('OAuth deep link error:', err)
      }
    }
  })
}