import { supabase } from '@/services/SupabaseClient'
import type { Router } from 'vue-router'

export class AuthController {
  private router: Router
  constructor(router: Router) {
    this.router = router
  }

  async continueWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
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
