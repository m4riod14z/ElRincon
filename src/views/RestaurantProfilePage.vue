<template>
    <ion-page>
        <ion-content class="ion-padding view-fade-up" fullscreen>
            <div class="profile-header" @click="toggleDetails">
                <div class="avatar">{{ initials }}</div>
                <div class="info">
                    <h2 class="name">
                        {{ displayName }}
                        <ion-icon class="chev" :icon="showDetails ? chevronUpOutline : chevronDownOutline" />
                    </h2>
                    <p class="email">{{ profile.email || authEmail || 'Sin correo' }}</p>
                </div>
            </div>

            <ion-list v-if="showDetails">
                <ion-item lines="full">
                    <ion-label position="stacked">Nombre</ion-label>
                    <ion-input :value="displayName" readonly />
                </ion-item>
                <ion-item lines="full">
                    <ion-label position="stacked">Correo</ion-label>
                    <ion-input :value="profile.email || authEmail || ''" readonly />
                </ion-item>
                <ion-item lines="full">
                    <ion-label position="stacked">Telefono</ion-label>
                    <ion-input v-model="phone" type="tel" inputmode="tel" placeholder="Ej: 3001234567" />
                </ion-item>

                <ion-button expand="block" class="ion-margin-top" :disabled="savingPhone" @click="savePhone">
                    <ion-spinner v-if="savingPhone" name="dots" />
                    <span v-else>Guardar telefono</span>
                </ion-button>
                <ion-button
                    expand="block"
                    color="danger"
                    fill="outline"
                    class="ion-margin-top"
                    :disabled="savingPhone"
                    @click="logout"
                >
                    Cerrar sesion
                </ion-button>

                <ion-text v-if="err" color="danger" class="feedback">{{ err }}</ion-text>
                <ion-text v-if="ok" color="success" class="feedback">{{ ok }}</ion-text>
            </ion-list>

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
                        Aun no hay pedidos entregados.
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
    IonText,
    IonSpinner,
    IonIcon,
} from '@ionic/vue'
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/services/SupabaseClient'
import { useRestaurantOrders } from '@/controllers/useRestaurantOrders'
import { fmtCOP } from '@/utils/money'
import type { Order } from '@/models/orders'
import { chevronDownOutline, chevronUpOutline } from 'ionicons/icons'

const router = useRouter()

const authEmail = ref<string | null>(null)
const userId = ref<string | null>(null)
const role = ref<string | null>(null)
const profile = reactive<{ first_name?: string; last_name?: string; email?: string; phone?: string }>({})

const showDetails = ref(false)
function toggleDetails() {
    showDetails.value = !showDetails.value
}

const phone = ref('')
const savingPhone = ref(false)
const err = ref('')
const ok = ref('')

const displayName = computed(() =>
    [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Tu restaurante'
)
const initials = computed(() => {
    const a = (profile.first_name ?? '').charAt(0)
    const b = (profile.last_name ?? '').charAt(0)
    const fallback = (profile.email ?? authEmail.value ?? 'R').charAt(0)
    const letters = (a + b).trim() || fallback
    return letters ? letters.toUpperCase() : 'R'
})

async function loadProfile() {
    err.value = ''
    const { data, error } = await supabase.auth.getUser()
    if (error || !data?.user) {
        router.replace('/home')
        return
    }
    userId.value = data.user.id
    authEmail.value = data.user.email ?? null

    const { data: prof, error: profErr } = await supabase
        .from('profiles')
        .select('first_name, last_name, email, phone, role')
        .eq('id', userId.value)
        .maybeSingle()

    if (profErr) {
        Object.assign(profile, { first_name: '', last_name: '', email: authEmail.value ?? '', phone: '' })
        role.value = 'restaurant'
    } else {
        Object.assign(profile, prof ?? {})
        if (!profile.email) profile.email = authEmail.value ?? ''
        role.value = (prof as any)?.role ?? 'restaurant'
    }
    phone.value = profile.phone ?? ''
}

async function savePhone() {
    err.value = ''
    ok.value = ''
    const trimmed = phone.value.trim()

    if (!userId.value) {
        err.value = 'No hay usuario activo.'
        return
    }
    if (trimmed && !/^[0-9]{7,10}$/.test(trimmed)) {
        err.value = 'Telefono invalido.'
        return
    }

    savingPhone.value = true
    try {
        const { data, error } = await supabase
            .from('profiles')
            .update({ phone: trimmed })
            .eq('id', userId.value)
            .select('id')

        if (error) throw error

        if (!data?.length) {
            const { error: insertErr } = await supabase
                .from('profiles')
                .insert({
                    id: userId.value,
                    first_name: profile.first_name ?? '',
                    last_name: profile.last_name ?? '',
                    email: profile.email ?? authEmail.value ?? '',
                    phone: trimmed,
                    role: role.value ?? 'restaurant',
                })
            if (insertErr) throw insertErr
        }

        profile.phone = trimmed
        ok.value = 'Telefono actualizado'
    } catch (e: any) {
        err.value = e?.message ?? 'No fue posible guardar.'
    } finally {
        savingPhone.value = false
    }
}

async function logout() {
    await supabase.auth.signOut()
    router.replace('/home')
}

onMounted(loadProfile)

const { orders } = useRestaurantOrders()
const delivered = computed(() =>
    (orders.value || []).filter((o: Order) => o.status === 'DELIVERED')
)
const totalIncome = computed(() =>
    delivered.value.reduce((acc, o) => acc + Number(o.total || 0), 0)
)
</script>

<style scoped>
.profile-header {
    display: grid;
    grid-template-columns: 56px 1fr;
    gap: 12px;
    align-items: center;
    margin: 8px 0 18px;
    cursor: pointer;
}

.avatar {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: var(--ion-color-primary);
    color: #fff;
    font-weight: 800;
    font-size: 18px;
}

.info .name {
    margin: 0;
    font-weight: 800;
}

.info .email {
    margin: 0;
    color: var(--ion-color-medium);
}

.chev {
    font-size: 18px;
    opacity: 0.7;
}

:deep(ion-toolbar) {
    --background: transparent;
    --border-width: 0;
    --padding-start: 0;
    --padding-end: 0;
}

:deep(.toolbar-container) {
    display: contents;
    padding: 0;
}

:deep(ion-title) {
    width: 100%;
    text-align: center;
}

.feedback {
    display: block;
    margin: 8px 4px 0;
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
