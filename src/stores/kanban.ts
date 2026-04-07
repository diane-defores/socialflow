import { defineStore } from 'pinia'
import { KanbanService, type KanbanItem, type KanbanColumnId } from '@/services/kanbanService'

export type { KanbanItem, KanbanColumnId }

export const useKanbanStore = defineStore('kanban', {
  state: () => ({
    service: new KanbanService(),
    loading: false,
    error: null as string | null,
    draggedItem: null as KanbanItem | null
  }),

  getters: {
    columns: (state) => state.service.getColumns(),

    getColumnItems: (state) => (columnId: KanbanColumnId) => {
      const column = state.service.getColumn(columnId)
      return column?.items.sort((a, b) => a.order - b.order) || []
    }
  },

  actions: {
    async initialize() {
      this.loading = true
      try {
        this.service.loadState()
      } catch (error) {
        this.error = 'Erreur lors de l\'initialisation du Kanban'
        console.error(error)
      } finally {
        this.loading = false
      }
    },

    addItem(columnId: KanbanColumnId, item: Omit<KanbanItem, 'id' | 'order' | 'columnId'>) {
      try {
        const newItem = this.service.addItem(columnId, item)
        this.service.saveState()
        return newItem
      } catch (error) {
        this.error = 'Erreur lors de l\'ajout de l\'élément'
        console.error(error)
      }
    },

    moveItem(itemId: string, targetColumnId: KanbanColumnId) {
      try {
        this.service.moveItem(itemId, targetColumnId)
        this.service.saveState()
      } catch (error) {
        this.error = 'Erreur lors du déplacement de l\'élément'
        console.error(error)
      }
    },

    reorderItems(columnId: KanbanColumnId, itemIds: string[]) {
      try {
        this.service.reorderItems(columnId, itemIds)
        this.service.saveState()
      } catch (error) {
        this.error = 'Erreur lors de la réorganisation des éléments'
        console.error(error)
      }
    },

    deleteItem(itemId: string) {
      try {
        this.service.deleteItem(itemId)
        this.service.saveState()
      } catch (error) {
        this.error = 'Erreur lors de la suppression de l\'élément'
        console.error(error)
      }
    },

    addEmailToKanban(email: any, columnId: KanbanColumnId = 'todo') {
      try {
        const kanbanItem = this.service.emailToKanbanItem(email)
        return this.addItem(columnId, kanbanItem)
      } catch (error) {
        this.error = 'Erreur lors de l\'ajout de l\'email au Kanban'
        console.error(error)
      }
    },

    startDragging(item: KanbanItem) {
      this.draggedItem = item
    },

    endDragging() {
      this.draggedItem = null
    },

    clearError() {
      this.error = null
    }
  }
})
