<template>
  <div class="surface-card h-full flex align-items-center">
    <div class="flex flex-wrap gap-3 align-items-center justify-content-center w-full px-2">
      <!-- Date Range Picker -->
      <Calendar 
        v-model="filters.dateRange" 
        selectionMode="range" 
        :showIcon="true"
        placeholder="Filtrer par date"
        class="min-w-max"
        :disabled="!currentNetwork"
      />

      <!-- Quick Date Filters -->
      <div class="flex gap-2 flex-wrap">
        <Button 
          v-for="filter in quickDateFilters" 
          :key="filter.value"
          :label="filter.label"
          :outlined="filters.quickDate !== filter.value"
          :severity="filters.quickDate === filter.value ? 'primary' : 'secondary'"
          size="small"
          @click="selectQuickDate(filter.value)"
          :disabled="!currentNetwork"
        />
      </div>

      <!-- Filters -->
      <MultiSelect
        v-model="filters.selectedFilters"
        :options="filterOptions"
        optionLabel="label"
        placeholder="Filtres"
        class="min-w-min"
        :maxSelectedLabels="3"
        :disabled="!currentNetwork"
      />

      <!-- Sort Options -->
      <Dropdown
        v-model="filters.sort"
        :options="sortOptions"
        optionLabel="label"
        placeholder="Trier par"
        class="min-w-min"
        :disabled="!currentNetwork"
      />

      <!-- Reset Button -->
      <Button 
        icon="pi pi-filter-slash" 
        text 
        severity="secondary"
        @click="resetFilters"
        v-tooltip="'Réinitialiser les filtres'"
        :disabled="!currentNetwork"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface FilterOption {
  label: string
  value: string
}

interface Filters {
  dateRange: [Date | null, Date | null]
  quickDate: string | null
  selectedFilters: string[]
  sort: string | null
}

const props = defineProps<{
  currentNetwork: MenuItem | null
}>()

const filters = ref<Filters>({
  dateRange: [null, null],
  quickDate: null,
  selectedFilters: [],
  sort: null
})

const quickDateFilters: FilterOption[] = [
  { label: "Aujourd'hui", value: 'today' },
  { label: '7 jours', value: 'week' },
  { label: '30 jours', value: 'month' },
  { label: 'Cette année', value: 'year' }
]

const filterOptions: FilterOption[] = [
  { label: 'Publications', value: 'posts' },
  { label: 'Commentaires', value: 'comments' },
  { label: 'Mentions', value: 'mentions' },
  { label: 'Messages privés', value: 'dm' }
]

const sortOptions: FilterOption[] = [
  { label: 'Plus récent', value: 'newest' },
  { label: 'Plus ancien', value: 'oldest' },
  { label: 'Plus populaire', value: 'popular' },
  { label: 'Plus commentés', value: 'comments' }
]

const selectQuickDate = (value: string) => {
  filters.value.quickDate = value
  // Réinitialiser le calendrier si une période rapide est sélectionnée
  filters.value.dateRange = [null, null]
}

const resetFilters = () => {
  filters.value = {
    dateRange: [null, null],
    quickDate: null,
    selectedFilters: [],
    sort: null
  }
}

const emit = defineEmits<{
  'filter-change': [filters: Filters]
}>()

watch(filters, (newFilters) => {
  emit('filter-change', newFilters)
}, { deep: true })
</script>

<style scoped>
.filters-container {
  background: var(--surface-card);
  border-bottom: 1px solid var(--surface-border);
  padding: 1rem;
  margin-bottom: 1rem;
}

.filters-content {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.date-picker {
  min-width: 200px;
}

.quick-filters {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.toggle-filters {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  align-items: center;
}

.sort-dropdown {
  min-width: 150px;
  margin-left: auto;
}

@media (max-width: 768px) {
  .filters-content {
    flex-direction: column;
    align-items: stretch;
  }

  .sort-dropdown {
    margin-left: 0;
  }
}
</style> 