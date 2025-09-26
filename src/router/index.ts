import { createRouter, createWebHistory } from '@ionic/vue-router'
import type { RouteRecordRaw } from 'vue-router'
import TabsPage from '@/views/TabsPage.vue'

// ⬇️ agrega estos imports
import HomePage from '@/views/HomePage.vue'
import LoginPage from '@/views/LoginPage.vue'
import RegisterPage from '@/views/RegisterPage.vue'

const routes: Array<RouteRecordRaw> = [
  // ⬇️ cambia la redirección raíz a /home
  { path: '/', redirect: '/home' },

  // ⬇️ agrega estas tres rutas
  { path: '/home', name: 'home', component: HomePage },
  { path: '/login', name: 'login', component: LoginPage },
  { path: '/register', name: 'register', component: RegisterPage },

  // (lo que ya tenías) Tabs siguen operativas
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

export default router
