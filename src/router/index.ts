import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/test-conn',
      name: 'TestConnection',
      component: () => import('@/views/TestConnection.vue'),
    },
  ],
})

// 👈 ESTA LÍNEA ES IMPORTANTE
export default router
