<template>
    <ion-page>
        <ion-content class="ion-padding view-fade-up" fullscreen>
            <!-- HEADER PERFIL -->
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

            <!-- DETALLES DEL PERFIL -->
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
                    <ion-label position="stacked">Teléfono</ion-label>
                    <ion-input v-model="phone" type="tel" inputmode="tel" placeholder="Ej: 3001234567" />
                </ion-item>

                <ion-button expand="block" class="ion-margin-top" :disabled="savingPhone" @click="savePhone">
                    <ion-spinner v-if="savingPhone" name="dots" />
                    <span v-else>Guardar teléfono</span>
                </ion-button>

                <ion-button expand="block" color="danger" fill="outline" class="ion-margin-top" :disabled="savingPhone"
                    @click="logout">
                    Cerrar sesión
                </ion-button>

                <ion-text v-if="err" color="danger" class="feedback">{{ err }}</ion-text>
                <ion-text v-if="ok" color="success" class="feedback">{{ ok }}</ion-text>
            </ion-list>

            <!-- HISTORIAL ENTREGADOS -->
            <section class="section">
                <h3>Historial de pedidos entregados</h3>

                <!-- ACCORDION -->
                <ion-accordion-group expand="inset">
                    <ion-accordion value="history">
                        <ion-item slot="header" color="light">
                            <ion-label>
                                {{
                                    delivered.length
                                        ? `Pedidos entregados (${delivered.length})`
                                        : 'Sin pedidos entregados'
                                }}
                            </ion-label>
                        </ion-item>

                        <ion-list slot="content" v-if="delivered.length">
                            <ion-item v-for="o in delivered" :key="o.id" lines="full">
                                <ion-label>
                                    <h3>Pedido #{{ o.id }}</h3>

                                    <!-- producto principal -->
                                    <p v-if="itemsSummary[o.id]">
                                        {{ itemsSummary[o.id]!.qty }} x
                                        {{
                                            itemsSummary[o.id]!.product_name ||
                                            ('Producto ' + itemsSummary[o.id]!.product_id)
                                        }}
                                    </p>
                                    <p v-else class="muted">
                                        Detalle del pedido no disponible.
                                    </p>

                                    <!-- adición -->
                                    <p v-if="itemsSummary[o.id]?.addition_name">
                                        Adición: {{ itemsSummary[o.id]!.addition_name }}
                                    </p>

                                    <!-- bebida -->
                                    <p v-if="itemsSummary[o.id]?.drink_name">
                                        Bebida: {{ itemsSummary[o.id]!.drink_name }}
                                    </p>

                                    <!-- cliente y dirección -->
                                    <p>
                                        Cliente:
                                        <strong>{{ clientName(o) }}</strong>
                                    </p>
                                    <p>
                                        Dirección: {{ addressText(o) }}
                                    </p>

                                    <!-- total -->
                                    <p>
                                        Total:
                                        <strong>{{ fmtCOP(o.total) }}</strong>
                                    </p>
                                </ion-label>
                            </ion-item>
                        </ion-list>
                    </ion-accordion>
                </ion-accordion-group>

                <!-- TOTAL INGRESOS -->
                <div class="income-summary">
                    <p class="income-title">Ingresos totales</p>
                    <p class="income-value">{{ fmtCOP(totalIncome) }}</p>
                    <p class="income-subtext">
                        Basado en {{ delivered.length }} pedido{{ delivered.length === 1 ? '' : 's' }}
                        entregado{{ delivered.length === 1 ? '' : 's' }}.
                    </p>
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
    IonAccordion,
    IonAccordionGroup,
} from '@ionic/vue'
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/services/SupabaseClient'
import { useRestaurantOrders } from '@/controllers/useRestaurantOrders'
import { fmtCOP } from '@/utils/money'
import type { Order, OrderItemDetail } from '@/models/orders'
import { fetchOrderItems } from '@/models/orders'
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

const displayName = computed(
    () => [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Tu restaurante'
)

const initials = computed(() => {
    const a = (profile.first_name ?? '').charAt(0)
    const b = (profile.last_name ?? '').charAt(0)
    const fallback = (profile.email ?? authEmail.value ?? 'R').charAt(0)
    return ((a + b).trim() || fallback).toUpperCase()
})

async function loadProfile() {
    const { data, error } = await supabase.auth.getUser()
    if (error || !data?.user) {
        router.replace('/home')
        return
    }

    userId.value = data.user.id
    authEmail.value = data.user.email ?? null

    const { data: prof } = await supabase
        .from('profiles')
        .select('first_name, last_name, email, phone, role')
        .eq('id', userId.value)
        .maybeSingle()

    Object.assign(profile, prof ?? {})
    if (!profile.email) profile.email = authEmail.value ?? ''

    role.value = (prof as any)?.role ?? 'restaurant'
    phone.value = profile.phone ?? ''
}

async function savePhone() {
    err.value = ''
    ok.value = ''
    const trimmed = phone.value.trim()

    if (trimmed && !/^[0-9]{7,10}$/.test(trimmed)) {
        err.value = 'Teléfono inválido.'
        return
    }

    savingPhone.value = true
    try {
        await supabase.from('profiles').update({ phone: trimmed }).eq('id', userId.value)
        profile.phone = trimmed
        ok.value = 'Teléfono actualizado'
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

// ---- Pedidos e ingresos ----
const { orders } = useRestaurantOrders()

const delivered = computed(() =>
    (orders.value || []).filter((o: Order) => o.status === 'DELIVERED')
)

const totalIncome = computed(() =>
    delivered.value.reduce((sum, o) => sum + Number(o.total || 0), 0)
)

// ====== nombre de cliente con fallback "No disponible" ======
const nameCache = ref<Record<string, string>>({})
const pendingNames = new Set<string>()

watch(
    orders,
    list => {
        if (!Array.isArray(list)) return
        const updates: Record<string, string> = {}
        const missing: string[] = []

            ; (list as Order[]).forEach(o => {
                const cid = o.client_id
                if (!cid) return
                const label = [o.first_name, o.last_name].filter(Boolean).join(' ').trim()
                if (label) {
                    if (nameCache.value[cid] !== label) updates[cid] = label
                } else if (!nameCache.value[cid] && !pendingNames.has(cid)) {
                    missing.push(cid)
                    pendingNames.add(cid)
                }
            })

        if (Object.keys(updates).length) {
            nameCache.value = { ...nameCache.value, ...updates }
        }
        if (missing.length) fetchClientNames(missing)
    },
    { immediate: true }
)

async function fetchClientNames(ids: string[]) {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .in('id', ids)
        if (error) throw error
        const updates: Record<string, string> = {}
        for (const row of data ?? []) {
            const label = [row.first_name, row.last_name].filter(Boolean).join(' ').trim() || row.id
            updates[row.id] = label
        }
        if (Object.keys(updates).length) {
            nameCache.value = { ...nameCache.value, ...updates }
        }
    } catch (e) {
        console.error('Error fetching client names (profile page)', e)
    } finally {
        ids.forEach(id => pendingNames.delete(id))
    }
}

function clientName(o: Order) {
    const fn = (o.first_name || '').trim()
    const ln = (o.last_name || '').trim()
    const label = [fn, ln].filter(Boolean).join(' ').trim()
    if (label) return label
    if (o.client_id) return nameCache.value[o.client_id] || 'No disponible'
    return 'No disponible'
}

function addressText(o: Order) {
    const addr = (o.address || '').trim()
    return addr || 'No disponible'
}

// ---- Resumen de ítems por pedido (primer producto) ----
type ItemSummary = {
    product_id: number
    qty: number
    product_name: string | null
    addition_name: string | null
    drink_name: string | null
}

const itemsSummary = ref<Record<number, ItemSummary | null>>({})

watch(
    delivered,
    async list => {
        const newSummaries: Record<number, ItemSummary | null> = {
            ...itemsSummary.value,
        }

        for (const o of list) {
            if (newSummaries[o.id] !== undefined) continue
            try {
                const items: OrderItemDetail[] = await fetchOrderItems(o.id)
                const first = items[0]
                if (first) {
                    newSummaries[o.id] = {
                        product_id: first.product_id,
                        qty: first.qty,
                        product_name: first.product_name ?? null,
                        addition_name: first.addition_name ?? null,
                        drink_name: first.drink_name ?? null,
                    }
                } else {
                    newSummaries[o.id] = null
                }
            } catch (e) {
                console.error('Error cargando ítems del pedido', o.id, e)
                newSummaries[o.id] = null
            }
        }

        itemsSummary.value = newSummaries
    },
    { immediate: true }
)
</script>

<style scoped>
/* HEADER */
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
    display: flex;
    align-items: center;
    gap: 6px;
}

.info .email {
    margin: 0;
    color: var(--ion-color-medium);
}

.chev {
    font-size: 18px;
    opacity: 0.7;
}

/* SECCIONES */
.section {
    margin-top: 28px;
}

h3 {
    font-weight: 800;
    margin-bottom: 10px;
}

.muted {
    font-size: 13px;
    color: var(--ion-color-medium);
}

/* TARJETA INGRESOS (nuevo estilo claro) */
.income-summary {
    margin-top: 16px;
    padding: 16px;
    border-radius: 14px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    box-shadow: 0 6px 20px rgba(15, 23, 42, 0.08);
}

.income-title {
    margin: 0;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    font-weight: 700;
    color: #0f172a;
}

.income-value {
    margin: 4px 0;
    font-size: 24px;
    font-weight: 800;
    color: #0f172a;
}

.income-subtext {
    margin: 0;
    font-size: 12px;
    color: #64748b;
}

/* FEEDBACK */
.feedback {
    display: block;
    margin: 8px 4px 0;
}

/* DARK MODE */
@media (prefers-color-scheme: dark) {
    .profile-header {
        background: transparent;
    }

    .income-summary {
        background: #1e293b;
        border-color: #334155;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
    }

    .income-title,
    .income-value,
    .income-subtext {
        color: #f1f5f9;
    }

    .income-subtext {
        opacity: 0.85;
    }
}
</style>