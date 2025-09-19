import './assets/main.css'               // Tus estilos globales actuales
import '@/assets/css/ionic.css'          // Estilos base de Ionic

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// 🔹 Importar IonicVue
import { IonicVue } from '@ionic/vue'

const app = createApp(App)

// Activar Ionic
app.use(IonicVue)

// Mantener tus librerías existentes
app.use(createPinia())
app.use(router)

app.mount('#app')
