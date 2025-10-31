import { supabase } from '@/services/SupabaseClient'
import type { Router } from 'vue-router'

export class AuthController {
  private router: Router
  constructor(router: Router) {
    this.router = router
  }

  async continueWithGoogle() {
    // Deep link redirect for native Android (must be allowed in Supabase Auth settings)
    const redirectTo = 'io.ionic.starter://auth/callback'

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
