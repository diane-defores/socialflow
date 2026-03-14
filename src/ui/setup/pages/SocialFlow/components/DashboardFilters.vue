<template>
  <div class="filters-wrapper">
    <div class="filters-group">
      <!-- Date Range Picker -->
      <Calendar 
        v-model="filters.dateRange" 
        selectionMode="range" 
        :showIcon="true"
        placeholder="Filtrer par date"
        :disabled="!currentNetwork"
      />

      <!-- Quick Date Filters -->
      <div class="quick-filters">
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
        :maxSelectedLabels="3"
        :disabled="!currentNetwork"
      />

      <!-- Sort Options -->
      <Dropdown
        v-model="filters.sort"
        :options="sortOptions"
        optionLabel="label"
        placeholder="Trier par"
        :disabled="!currentNetwork"
      />

      <!-- Reset Button -->
      <Button 
        icon="pi pi-filter-slash" 
        text 
        severity="secondary"
        @click="resetFilters"
        v-tooltip="$t('filters.reset_tooltip')"
        :disabled="!currentNetwork"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { MenuItem } from '../types'

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
.filters-wrapper {
  display: flex;
  align-items: center;
  width: 100%;
}

.filters-group {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.quick-filters {
  display: flex;
  gap: 0.5rem;
  flex-wrap: nowrap;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.quick-filters::-webkit-scrollbar {
  display: none;
}

:deep(.p-calendar),
:deep(.p-multiselect),
:deep(.p-dropdown) {
  min-width: unset;
  flex-shrink: 1;
}

:deep(.p-calendar) {
  width: 200px;
}

:deep(.p-multiselect) {
  width: 150px;
}

:deep(.p-dropdown) {
  width: 120px;
}

@media (max-width: 1200px) {
  .filters-wrapper {
    flex-direction: column;
    align-items: stretch;
  }

  .search-container {
    min-width: unset;
  }

  .filters-group {
    flex-wrap: wrap;
  }
}
</style> 
