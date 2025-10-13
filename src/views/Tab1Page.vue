<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>El Rincón</ion-title>
        <ion-buttons slot="end">
          <ion-icon :icon="cartOutline" size="large" />
        </ion-buttons>
      </ion-toolbar>
      <ion-searchbar placeholder="Buscar en El Rincón" />
    </ion-header>

    <ion-content class="ion-padding">
      <div v-if="error" class="err">{{ error }}</div>

      <div class="menu-sections" v-else>
        <section v-for="cat in grupos" :key="cat.nombre" class="section">
          <h2 class="section-title">{{ cat.nombre }}</h2>
          <div class="carousel">
            <button v-for="p in cat.items" :key="p.id" class="card" type="button" @click="abrirDetalle(p)">
              <img :src="p.image_url || '/Logo.png'" :alt="p.name" />
              <h3 class="card-title">{{ p.name }}</h3>
              <p class="precio">{{ fmtCOP(p.price) }}</p>
            </button>
          </div>
        </section>
      </div>
    </ion-content>

    <!-- Detalle -->
    <ion-modal :is-open="detalleAbierto" @didDismiss="cerrarDetalle">
      <ion-content class="ion-padding detail-content">
        <div class="detail-wrap" v-if="seleccionado">
          <img class="detail-img" :src="seleccionado.image_url || '/Logo.png'" :alt="seleccionado.name" />
          <h2 class="detail-title">{{ seleccionado.name }}</h2>
          <p class="detail-desc">{{ seleccionado.description }}</p>
          <div class="detail-price">{{ fmtCOP(seleccionado.price) }}</div>

          <div class="current">
            <div>Adición: <strong>{{ additionLabel }}</strong></div>
            <div>Bebida: <strong>{{ drinkLabel }}</strong></div>
            <div class="row total">
              <span>Total</span>
              <span>{{ fmtCOP(total) }}</span>
            </div>
          </div>

          <div class="detail-actions">
            <ion-button expand="block" fill="outline" color="medium" @click="openAdditions">
              Añadir adición
            </ion-button>
            <ion-button expand="block" fill="outline" color="tertiary" @click="openDrinks">
              Añadir bebida
            </ion-button>
            <ion-button expand="block" color="primary" @click="anadirAlCarrito">
              Añadir al carrito
            </ion-button>
            <ion-button expand="block" fill="clear" color="dark" @click="cerrarDetalle">Cerrar</ion-button>
          </div>
        </div>
      </ion-content>
    </ion-modal>

    <!-- Modales reusables -->
    <SingleSelectModal :open="openAdd" title="Selecciona una adición" :options="additions" v-model="selectedAdditionId"
      @update:open="openAdd = $event" />
    <SingleSelectModal :open="openDrink" title="Selecciona una bebida" :options="drinks" v-model="selectedDrinkId"
      @update:open="openDrink = $event" />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonIcon, IonSearchbar,
  IonContent, IonButton, IonModal
} from "@ionic/vue";
import { cartOutline } from "ionicons/icons";

import { useCatalog } from "@/controllers/useCatalog";
import { useProductDetail } from "@/controllers/useProductDetail";
import SingleSelectModal from "@/components/SingleSelectModal.vue";
import { fmtCOP } from "@/utils/money";

// 1) Catálogo
const { load, grupos, error } = useCatalog();
onMounted(load);

// 2) Detalle
const detalleAbierto = ref(false);
const seleccionado = ref < { id: number; name: string; description?: string | null; price: number; image_url?: string | null } | null > (null);
function abrirDetalle(p: any) { seleccionado.value = p; detalleAbierto.value = true; }
function cerrarDetalle() { detalleAbierto.value = false; seleccionado.value = null; clearSelections(); }

// 3) Selección de adición/bebida
const basePrice = computed(() => seleccionado.value?.price ?? 0);
const {
  additions, drinks,
  selectedAdditionId, selectedDrinkId,
  selectedAddition, selectedDrink, total,
  loadAdditionsOnce, loadDrinksOnce, clearSelections
} = useProductDetail(basePrice as unknown as { value: number });

const additionLabel = computed(() =>
  selectedAddition.value ? `${selectedAddition.value.name} (${fmtCOP(selectedAddition.value.price)})` : "Ninguna"
);
const drinkLabel = computed(() =>
  selectedDrink.value ? `${selectedDrink.value.name} (${fmtCOP(selectedDrink.value.price)})` : "Ninguna"
);

// Modales
const openAdd = ref(false);
const openDrink = ref(false);
async function openAdditions() { await loadAdditionsOnce(); openAdd.value = true; }
async function openDrinks() { await loadDrinksOnce(); openDrink.value = true; }

// Placeholder: aquí integrarás con la store del carrito
function anadirAlCarrito() {
  // cart.addItem({ productId: seleccionado.value!.id, additionId: selectedAdditionId.value, drinkId: selectedDrinkId.value, qty: 1 })
  cerrarDetalle();
}
</script>

<style scoped>
.menu-sections {
  display: grid;
  gap: 18px;
}

.section {
  display: grid;
  gap: 10px;
}

.section-title {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
}

.carousel {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 4px;
  -webkit-overflow-scrolling: touch;
}

.card {
  background: #fff;
  border-radius: 12px;
  text-align: left;
  padding: 8px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, .08);
  min-width: 150px;
  max-width: 180px;
  border: 1px solid #f1f5f9;
}

.card img {
  width: 100%;
  height: 110px;
  object-fit: cover;
  border-radius: 10px;
}

.card-title {
  font-size: 14px;
  margin: 6px 0 2px;
  font-weight: 600;
  color: #000;
}

.precio {
  color: #d32f2f;
  font-weight: 700;
  font-size: 13px;
  margin: 0;
}

.detail-content {
  --background: #fff;
}

.detail-wrap {
  max-width: 520px;
  margin: 0 auto;
  display: grid;
  gap: 12px;
}

.detail-img {
  width: 100%;
  height: 220px;
  object-fit: cover;
  border-radius: 12px;
}

.detail-title {
  margin: 0;
  font-weight: 800;
  font-size: 22px;
}

.detail-desc {
  margin: 0;
  color: var(--ion-color-medium);
}

.detail-price {
  font-size: 20px;
  font-weight: 800;
  color: #d32f2f;
}

.current {
  display: grid;
  gap: 6px;
}

.row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
}

.total {
  font-weight: 800;
  border-top: 1px solid #eee;
  margin-top: 6px;
}

.detail-actions {
  display: grid;
  gap: 8px;
  margin-top: 8px;
}

.err {
  color: var(--ion-color-danger);
  margin: 8px 0;
}
</style>