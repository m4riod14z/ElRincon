<script setup lang="ts">
import { onMounted } from 'vue'
import { supabase } from '../services/supabaseClient'   // 👈 ruta relativa

onMounted(async () => {
  const { data, error } = await supabase.from('tu_tabla').select('*').limit(1)

  if (error) {
    console.error('❌ Error de conexión:', error.message)
  } else {
    console.log('✅ Conexión exitosa, datos recibidos:', data)
  }
})
</script>
