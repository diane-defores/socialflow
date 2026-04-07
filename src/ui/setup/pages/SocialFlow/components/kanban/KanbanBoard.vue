<template>
  <div class="kanban-board">
    <div v-if="loading" class="loading-state">
      <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
      <p>Chargement du Kanban...</p>
    </div>

    <div v-else class="columns-container">
      <div 
        v-for="column in store.columns" 
        :key="column.id"
        class="kanban-column"
        @dragover.prevent
        @drop="handleDrop($event, column.id)"
      >
        <div class="column-header">
          <h3>{{ $t(column.title) }}</h3>
          <span class="item-count">{{ getColumnItems(column.id).length }}</span>
        </div>

        <div class="column-content">
          <TransitionGroup name="list" tag="div">
            <div
              v-for="item in getColumnItems(column.id)"
              :key="item.id"
              class="kanban-item"
              :class="[
                `type-${item.type}`,
                { 'is-dragging': isDragging(item) }
              ]"
              draggable="true"
              @dragstart="handleDragStart($event, item)"
              @dragend="handleDragEnd"
            >
              <div class="item-header">
                <i :class="getItemIcon(item.type)"></i>
                <span class="item-title">{{ item.title }}</span>
                <Button
                  icon="pi pi-times"
                  text
                  rounded
                  severity="danger"
                  @click="deleteItem(item.id)"
                />
              </div>

              <p class="item-description">{{ item.description }}</p>

              <div class="item-footer">
                <span class="item-date">{{ formatDate(item.date) }}</span>
                <div class="item-labels">
                  <span 
                    v-for="label in item.labels" 
                    :key="label"
                    class="label"
                  >
                    {{ label }}
                  </span>
                </div>
              </div>
            </div>
          </TransitionGroup>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useKanbanStore } from '@/stores/kanban'
import { formatDate } from '../../utils/dateFormatter'
import Button from 'primevue/button'
import type { KanbanItem, KanbanColumnId } from '@/services/kanbanService'

const store = useKanbanStore()

const loading = computed(() => store.loading)

const getColumnItems = (columnId: KanbanColumnId) => {
  return store.getColumnItems(columnId)
}

const isDragging = (item: KanbanItem) => {
  return store.draggedItem?.id === item.id
}

const getItemIcon = (type: string) => {
  switch (type) {
    case 'email':
      return 'pi pi-envelope'
    case 'task':
      return 'pi pi-check-square'
    case 'note':
      return 'pi pi-file'
    default:
      return 'pi pi-file'
  }
}

const handleDragStart = (event: DragEvent, item: KanbanItem) => {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', item.id)
  }
  store.startDragging(item)
}

const handleDragEnd = () => {
  store.endDragging()
}

const handleDrop = (event: DragEvent, columnId: KanbanColumnId) => {
  const itemId = event.dataTransfer?.getData('text/plain')
  if (itemId) {
    store.moveItem(itemId, columnId)
  }
}

const deleteItem = (itemId: string) => {
  store.deleteItem(itemId)
}

onMounted(() => {
  store.initialize()
})
</script>

<style scoped>
.kanban-board {
  height: 100%;
  padding: 1rem;
  overflow: hidden;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-color-secondary);
}

.columns-container {
  display: flex;
  gap: 1rem;
  height: 100%;
  overflow-x: auto;
}

.kanban-column {
  flex: 1;
  min-width: 300px;
  background: var(--surface-ground);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}

.column-header {
  padding: 1rem;
  background: var(--surface-card);
  border-radius: 8px 8px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.column-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.item-count {
  background: var(--primary-color);
  color: white;
  padding: 0.2rem 0.6rem;
  border-radius: 1rem;
  font-size: 0.9rem;
}

.column-content {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}

.kanban-item {
  background: var(--surface-card);
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 0.5rem;
  cursor: move;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.kanban-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.kanban-item.is-dragging {
  opacity: 0.5;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.item-title {
  flex: 1;
  font-weight: bold;
}

.item-description {
  margin: 0.5rem 0;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

.item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
  font-size: 0.8rem;
}

.item-date {
  color: var(--text-color-secondary);
}

.item-labels {
  display: flex;
  gap: 0.25rem;
}

.label {
  background: var(--primary-color);
  color: white;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

.type-email {
  border-left: 4px solid var(--blue-500);
}

.type-task {
  border-left: 4px solid var(--green-500);
}

.type-note {
  border-left: 4px solid var(--yellow-500);
}

/* Animations */
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.list-leave-active {
  position: absolute;
}
</style> 
