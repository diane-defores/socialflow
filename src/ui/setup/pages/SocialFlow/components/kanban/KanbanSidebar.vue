<template>
  <div class="kanban-sidebar">
    <div class="kanban-header">
      <h3>Kanban</h3>
      <span class="item-count">{{ totalItems }}</span>
    </div>

    <div class="kanban-sections">
      <div 
        v-for="column in store.columns" 
        :key="column.id"
        class="kanban-section"
        @dragover.prevent
        @drop="handleDrop($event, column.id)"
      >
        <div class="section-header">
          <span class="section-title">{{ $t(column.title) }}</span>
          <span class="section-count">{{ getColumnItems(column.id).length }}</span>
        </div>

        <div class="section-content">
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
                  size="small"
                  severity="danger"
                  @click="deleteItem(item.id)"
                />
              </div>
            </div>
          </TransitionGroup>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useKanbanStore } from '../../stores/kanban'
import Button from 'primevue/button'
import type { KanbanItem, KanbanColumnId } from '../../services/kanbanService'

const store = useKanbanStore()

const totalItems = computed(() => {
  return store.columns.reduce((total, column) => total + column.items.length, 0)
})

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
</script>

<style scoped>
.kanban-sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--surface-ground);
}

.kanban-header {
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--surface-border);
}

.kanban-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.item-count {
  background: var(--primary-color);
  color: white;
  padding: 0.2rem 0.6rem;
  border-radius: 1rem;
  font-size: 0.8rem;
}

.kanban-sections {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.kanban-section {
  margin-bottom: 1rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem;
  background: var(--surface-card);
  border-radius: 6px;
  margin-bottom: 0.5rem;
}

.section-title {
  font-weight: bold;
  font-size: 0.9rem;
}

.section-count {
  background: var(--surface-hover);
  color: var(--text-color);
  padding: 0.1rem 0.4rem;
  border-radius: 0.5rem;
  font-size: 0.8rem;
}

.section-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.kanban-item {
  background: var(--surface-card);
  border-radius: 4px;
  padding: 0.5rem;
  cursor: move;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.kanban-item:hover {
  transform: translateX(2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.kanban-item.is-dragging {
  opacity: 0.5;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.item-title {
  flex: 1;
  font-size: 0.9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.type-email {
  border-left: 3px solid var(--blue-500);
}

.type-task {
  border-left: 3px solid var(--green-500);
}

.type-note {
  border-left: 3px solid var(--yellow-500);
}

/* Animations */
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.list-leave-active {
  position: absolute;
}
</style> 
