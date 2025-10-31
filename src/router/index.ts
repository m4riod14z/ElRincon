import { createRouter, createWebHistory } from '@ionic/vue-router'
import type { RouteRecordRaw } from 'vue-router'
import TabsPage from '@/views/TabsPage.vue'

import HomePage from '@/views/HomePage.vue'
import RegisterPage from '@/views/RegisterPage.vue'
import LoginEmailView from '@/views/LoginEmailView.vue'
import CartPage from '@/views/CartPage.vue'
import { getCurrentUserRole } from '@/controllers/ProfileController'

const routes: Array<RouteRecordRaw> = [
  { path: '/', redirect: '/home' },

  { path: '/home', name: 'home', component: HomePage },
  { path: '/login', name: 'login', component: LoginEmailView },
  { path: '/register', name: 'register', component: RegisterPage },
  { path: '/cart', name: 'cart', component: CartPage },
  { path: '/payment', name: 'payment', component: () => import('@/views/PaymentPage.vue') },
  { path: '/restaurant', name: 'restaurant', component: () => import('@/views/RestaurantDashboard.vue') },


  {
    path: '/tabs/',
    component: TabsPage,
    children: [
      { path: '', redirect: '/tabs/tab1' },
      { path: 'tab1', component: () => import('@/views/Tab1Page.vue') },
      { path: 'tab2', component: () => import('@/views/Tab2Page.vue') },
      { path: 'tab3', component: () => import('@/views/Tab3Page.vue') },
    ]
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Redirecciones por rol básicas
router.beforeEach(async (to) => {
  try {
    const role = await getCurrentUserRole().catch(() => null)
    if (role === 'restaurant') {
      if (to.path === '/' || to.name === 'home' || to.path.startsWith('/tabs')) {
        return { name: 'restaurant' }
      }
    } else if (to.name === 'restaurant') {
      return { name: 'home' }
    }
  } catch {
    // sin sesión o sin perfil: continuar
  }
  return true
})

export default router
