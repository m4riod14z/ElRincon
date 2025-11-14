<template>
    <ion-page>
        <ion-content class="ion-padding" fullscreen>
            <h2 class="title">Perfil del restaurante</h2>

            <ion-list>
                <ion-item lines="full">
                    <ion-label position="stacked">Teléfono</ion-label>
                    <ion-input v-model="phone" type="tel" inputmode="tel" placeholder="Ej: 3001234567" />
                </ion-item>
                <ion-button expand="block" class="ion-margin-top" :disabled="savingPhone" @click="savePhone">
                    {{ savingPhone ? 'Guardando…' : 'Guardar teléfono' }}
                </ion-button>
            </ion-list>

            <!-- Historial de pedidos entregados -->
            <section class="section">
                <h3>Historial de pedidos entregados</h3>

                <ion-list>
                    <ion-item v-for="o in delivered" :key="o.id">
                        <ion-label>
                            <h3>Pedido #{{ o.id }}</h3>
                            <p>Total: <strong>{{ fmtCOP(o.total) }}</strong></p>
                        </ion-label>
                    </ion-item>
                    <p v-if="!delivered.length" class="empty">
                        Aún no hay pedidos entregados.
                    </p>
                </ion-list>

                <div class="income-total">
                    Ingresos totales:
                    <strong>{{ fmtCOP(totalIncome) }}</strong>
                </div>
            </section>
        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
import {
    IonPage,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
} from '@ionic/vue'
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/services/SupabaseClient'
import { useRestaurantOrders } from '@/controllers/useRestaurantOrders'
import { fmtCOP } from '@/utils/money'
import type { Order } from '@/models/orders'

// ========= TELÉFONO (único campo editable) =========
const phone = ref('')
const savingPhone = ref(false)

async function loadPhone() {
    const { data, error } = await supabase.auth.getUser()
    if (error || !data?.user) return

    const { data: profile } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', data.user.id)
        .maybeSingle()

    phone.value = (profile?.phone as string | null) || ''
}

async function savePhone() {
    savingPhone.value = true
    try {
        const { data, error } = await supabase.auth.getUser()
        if (error || !data?.user) return

        await supabase
            .from('profiles')
            .update({ phone: phone.value.trim() })
            .eq('id', data.user.id)
    } finally {
        savingPhone.value = false
    }
}

onMounted(loadPhone)

// ========= HISTORIAL DE PEDIDOS ENTREGADOS =========
const { orders } = useRestaurantOrders()

// Solo pedidos con estado DELIVERED
const delivered = computed(() =>
    (orders.value || []).filter((o: Order) => o.status === 'DELIVERED')
)

// Suma total de ingresos solo con DELIVERED
const totalIncome = computed(() =>
    delivered.value.reduce((acc, o) => acc + Number(o.total || 0), 0)
)
</script>

<style scoped>
.title {
    font-weight: 800;
    margin-bottom: 10px;
}

.section {
    margin-top: 24px;
}

h3 {
    font-weight: 700;
    margin-bottom: 8px;
}

p {
    margin: 0;
    font-size: 14px;
}

.empty {
    text-align: center;
    color: var(--ion-color-medium);
    margin: 8px 0;
}

.income-total {
    margin-top: 12px;
    font-size: 16px;
    font-weight: 700;
}
</style>