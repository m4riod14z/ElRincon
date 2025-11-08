import { supabase } from '@/services/SupabaseClient'
import type { Router } from 'vue-router'
import { Capacitor } from '@capacitor/core'

export class AuthController {
  private router: Router
  constructor(router: Router) {
    this.router = router
  }

  async continueWithGoogle() {
    // Use deep link on native, site origin on web
    const redirectTo = Capacitor.isNativePlatform()
      ? 'io.ionic.starter://auth/callback'
      : window.location.origin

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        // PKCE is recommended for mobile OAuth flows
        queryParams: { prompt: 'consent' }
      }
    })
    if (error) {
      console.error('Error al iniciar con Google:', error.message)
      // TODO: Mostrar toast/alert en UI
    }
  }

  goToLogin() {
    this.router.push({ name: 'login' })
  }

  goToRegister() {
    this.router.push({ name: 'register' })
  }
}
