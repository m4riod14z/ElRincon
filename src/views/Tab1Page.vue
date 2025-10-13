<template>
  <ion-page>
    <!-- ======= HEADER ======= -->
    <ion-header>
      <ion-toolbar>
        <ion-title>El Rincón</ion-title>
        <ion-buttons slot="end">
          <ion-icon :icon="cartOutline" size="large" />
        </ion-buttons>
      </ion-toolbar>
      <ion-searchbar placeholder="Buscar en El Rincón" />
    </ion-header>

    <!-- ======= CONTENIDO PRINCIPAL ======= -->
    <ion-content class="ion-padding">
      <div v-if="error" class="err">{{ error }}</div>
      <div v-else class="menu-sections">
        <section v-for="cat in grupos" :key="cat.nombre" class="section">
          <h2 class="section-title">{{ cat.nombre }}</h2>
          <div class="carousel">
            <button v-for="item in cat.items" :key="item.id" class="card" type="button" @click="abrirDetalle(item)">
              <img :src="item.image_url || '/Logo.png'" :alt="item.name || 'Producto'" />
              <h3 class="card-title">{{ item.name }}</h3>
              <p class="precio">{{ fmtCOP(item.price) }}</p>
            </button>
          </div>
        </section>
      </div>
    </ion-content>

    <!-- ======= MODAL DE DETALLE ======= -->
    <ion-modal :is-open="detalleAbierto" @didDismiss="cerrarDetalle" :can-dismiss="true">
      <ion-header>
        <ion-toolbar>
          <ion-title>Detalle</ion-title>
          <ion-buttons slot="end">
            <ion-button fill="clear" @click="cerrarDetalle">Cerrar</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <ion-content class="ion-padding detail-content">
        <div class="detail-wrap" v-if="seleccionado">
          <img class="detail-img" :src="seleccionado.image_url" :alt="seleccionado.name" />
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
        </div>
      </ion-content>

      <!-- BOTONES PEGADOS AL FONDO -->
      <div class="detail-actions">
        <ion-button expand="block" fill="outline" color="medium" @click="openAddSheet">
          Añadir adición
        </ion-button>
        <ion-button expand="block" fill="outline" color="tertiary" @click="openDrinkSheet">
          Añadir bebida
        </ion-button>
        <ion-button expand="block" color="primary" @click="anadirAlCarrito">
          Añadir al carrito
        </ion-button>
      </div>
    </ion-modal>

    <!-- ======= ACTION SHEETS ======= -->
    <ion-action-sheet :is-open="showAddSheet" header="Selecciona una adición" :buttons="additionActions"
      @didDismiss="showAddSheet = false" />
    <ion-action-sheet :is-open="showDrinkSheet" header="Selecciona una bebida" :buttons="drinkActions"
      @didDismiss="showDrinkSheet = false" />

    <!-- ======= FOOTER ======= -->
    <ion-footer>
      <ion-toolbar>
        <ion-segment value="menu">
          <ion-segment-button value="menu">
            <ion-icon :icon="restaurantOutline" />
            <ion-label>Menú</ion-label>
          </ion-segment-button>
          <ion-segment-button value="pedidos">
            <ion-icon :icon="receiptOutline" />
            <ion-label>Pedidos</ion-label>
          </ion-segment-button>
          <ion-segment-button value="perfil">
            <ion-icon :icon="personOutline" />
            <ion-label>Perfil</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-footer>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonIcon, IonSearchbar,
  IonContent, IonButton, IonModal, IonActionSheet, IonFooter, IonSegment,
  IonSegmentButton, IonLabel
} from "@ionic/vue";
import { cartOutline, restaurantOutline, receiptOutline, personOutline } from "ionicons/icons";

import { useCatalog } from "@/controllers/useCatalog";
import { useProductDetail } from "@/controllers/useProductDetail";
import { fmtCOP } from "@/utils/money";

// ====== CATÁLOGO (productos disponibles) ======
const { load, grupos, error } = useCatalog();
onMounted(load);

// ====== DETALLE DE PRODUCTO ======
const detalleAbierto = ref(false);
const seleccionado = ref<any>(null);

function abrirDetalle(p: any) {
  seleccionado.value = p;
  detalleAbierto.value = true;
}
function cerrarDetalle() {
  detalleAbierto.value = false;
  seleccionado.value = null;
  clearSelections();
}

// ====== CONTROL DE ADICIONES Y BEBIDAS ======
const basePrice = computed(() => seleccionado.value?.price ?? 0);
const {
  additions, drinks,
  selectedAdditionId, selectedDrinkId,
  selectedAddition, selectedDrink, total,
  loadAdditionsOnce, loadDrinksOnce, clearSelections
} = useProductDetail(basePrice as unknown as { value: number });

const additionLabel = computed(() =>
  selectedAddition.value
    ? `${selectedAddition.value.name} (${fmtCOP(selectedAddition.value.price)})`
    : "Ninguna"
);
const drinkLabel = computed(() =>
  selectedDrink.value
    ? `${selectedDrink.value.name} (${fmtCOP(selectedDrink.value.price)})`
    : "Ninguna"
);

// ====== ACTION SHEETS ======
const showAddSheet = ref(false);
const showDrinkSheet = ref(false);

async function openAddSheet() {
  await loadAdditionsOnce();
  showAddSheet.value = true;
}
async function openDrinkSheet() {
  await loadDrinksOnce();
  showDrinkSheet.value = true;
}

const additionActions = computed(() => {
  const opts = (additions.value ?? []).map(a => ({
    text: `${a.name} — ${fmtCOP(a.price)}`,
    handler: () => { selectedAdditionId.value = a.id; }
  }));
  return [
    { text: "Ninguna", handler: () => { selectedAdditionId.value = null; } },
    ...opts,
    { text: "Cancelar", role: "cancel" as const }
  ];
});

const drinkActions = computed(() => {
  const opts = (drinks.value ?? []).map(d => ({
    text: `${d.name} — ${fmtCOP(d.price)}`,
    handler: () => { selectedDrinkId.value = d.id; }
  }));
  return [
    { text: "Ninguna", handler: () => { selectedDrinkId.value = null; } },
    ...opts,
    { text: "Cancelar", role: "cancel" as const }
  ];
});

function anadirAlCarrito() {
  //Falta implementar carrito
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
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.08);
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
  color: black;
}

.precio {
  color: red;
  font-weight: 700;
  font-size: 13px;
  margin: 0;
}

/* ====== DETALLE ====== */
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
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 12px 16px 16px;
  box-shadow: 0 -6px 10px rgba(0, 0, 0, 0.06);
  display: grid;
  gap: 8px;
}

.err {
  color: var(--ion-color-danger);
  margin-bottom: 8px;
}
</style>