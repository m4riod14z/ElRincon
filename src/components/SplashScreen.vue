<template>
  <div class="splash-screen" :class="{ 'splash-screen--fade': isFading }">
    <div class="logo-wrapper" :class="{ 'logo-wrapper--show': showLogo }">
      <img src="/Logo.png" alt="Logo El Rincón" />
    </div>
    <p class="splash-message" :class="{ 'splash-message--show': showMessage }">
      La mejor comida en un solo lugar
    </p>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const emit = defineEmits<{ (event: 'finish'): void }>()

const showLogo = ref(false)
const showMessage = ref(false)
const isFading = ref(false)
const timers: number[] = []

onMounted(() => {
  timers.push(window.setTimeout(() => (showLogo.value = true), 100))
  timers.push(window.setTimeout(() => (showMessage.value = true), 1600))
  timers.push(window.setTimeout(() => (isFading.value = true), 3200))
  timers.push(window.setTimeout(() => emit('finish'), 4000))
})

onBeforeUnmount(() => {
  timers.forEach((id) => clearTimeout(id))
})
</script>

<style scoped>
.splash-screen {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: #f2b705 url('/fondorincon.jpg') center / cover no-repeat;
  z-index: 9999;
  text-align: center;
  padding: 1.5rem;
  overflow: hidden;
  opacity: 1;
  transition: opacity 0.8s ease;
}

.splash-screen::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(255, 211, 78, 0.55);
  pointer-events: none;
}

.splash-screen--fade {
  opacity: 0;
}

.logo-wrapper {
  width: min(260px, 70vw);
  opacity: 0;
  transform: translateY(40px) scale(0.9);
  transition: opacity 0.9s ease, transform 0.9s ease;
  filter: drop-shadow(0 18px 35px rgba(0, 0, 0, 0.22));
  z-index: 1;
}

.logo-wrapper--show {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.logo-wrapper img {
  width: 100%;
  height: auto;
  display: block;
}

.splash-message {
  margin-top: 2rem;
  font-size: 1.4rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #0b0b0b;
  opacity: 0;
  transform: translateY(15px);
  transition: opacity 1s ease, transform 1s ease;
  z-index: 1;
}

.splash-message--show {
  opacity: 1;
  transform: translateY(0);
}
</style>
