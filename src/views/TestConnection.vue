<template>
  <section style="padding:20px;max-width:640px">
    <h2>Prueba Supabase: instruments</h2>
    <p>{{ status }}</p>

    <div v-if="error" style="color:#c0392b;white-space:pre-wrap">❌ {{ error }}</div>

    <table v-if="rows.length" border="1" cellpadding="8" cellspacing="0" style="margin-top:10px;width:100%">
      <thead>
        <tr>
          <th style="text-align:left">ID</th>
          <th style="text-align:left">Name</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in rows" :key="r.id">
          <td>{{ r.id }}</td>
          <td>{{ r.name }}</td>
        </tr>
      </tbody>
    </table>

    <p v-else style="margin-top:10px">⚠️ No hay registros en instruments.</p>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/services/supabaseClient'

const status = ref('⏳ Cargando...')
const error = ref<string | null>(null)
const rows = ref<Array<{ id: number; name: string }>>([])

onMounted(async () => {
  const { data, error: err } = await supabase
    .from('instruments')
    .select('id,name')
    .order('id', { ascending: true })

  if (err) {
    error.value = err.message
    status.value = '❌ Error'
    console.error('[Supabase] Error:', err)
  } else {
    rows.value = data ?? []
    status.value = `✅ Conexión OK: ${rows.value.length} registros`
    console.log('[Supabase] Datos:', rows.value)
  }
})
</script>
