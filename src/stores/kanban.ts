import { defineStore } from 'pinia'

export interface KanbanItem {
  id: string
  title: string
  type: 'email' | 'task' | 'note'
  columnId: KanbanColumnId
}

export type KanbanColumnId = 'todo' | 'inProgress' | 'done'

interface KanbanColumn {
  id: KanbanColumnId
  title: string
  items: KanbanItem[]
}

interface KanbanState {
  columns: KanbanColumn[]
  draggedItem: KanbanItem | null
}

export const useKanbanStore = defineStore('kanban', {
  state: (): KanbanState => ({
    columns: [
      { id: 'todo', title: 'À faire', items: [] },
      { id: 'inProgress', title: 'En cours', items: [] },
      { id: 'done', title: 'Terminé', items: [] }
    ],
    draggedItem: null
  }),

  actions: {
    initialize() {
      // Charger les données depuis le stockage local si disponible
      const savedData = localStorage.getItem('kanban-data')
      if (savedData) {
        const parsedData = JSON.parse(savedData)
        this.columns = parsedData.columns
      }
    },

    saveToLocalStorage() {
      localStorage.setItem('kanban-data', JSON.stringify({
        columns: this.columns
      }))
    },

    getColumnItems(columnId: KanbanColumnId) {
      const column = this.columns.find(col => col.id === columnId)
      return column ? column.items : []
    },

    addItem(item: Omit<KanbanItem, 'id'>) {
      const newItem = {
        ...item,
        id: crypto.randomUUID()
      }
      const column = this.columns.find(col => col.id === item.columnId)
      if (column) {
        column.items.push(newItem)
        this.saveToLocalStorage()
      }
    },

    moveItem(itemId: string, targetColumnId: KanbanColumnId) {
      // Trouver l'item et sa colonne source
      let sourceColumn: KanbanColumn | undefined
      let item: KanbanItem | undefined

      for (const column of this.columns) {
        const foundItem = column.items.find(i => i.id === itemId)
        if (foundItem) {
          sourceColumn = column
          item = foundItem
          break
        }
      }

      if (sourceColumn && item) {
        // Retirer l'item de sa colonne source
        sourceColumn.items = sourceColumn.items.filter(i => i.id !== itemId)
        
        // Ajouter l'item à la colonne cible
        const targetColumn = this.columns.find(col => col.id === targetColumnId)
        if (targetColumn) {
          item.columnId = targetColumnId
          targetColumn.items.push(item)
          this.saveToLocalStorage()
        }
      }
    },

    deleteItem(itemId: string) {
      for (const column of this.columns) {
        const index = column.items.findIndex(item => item.id === itemId)
        if (index !== -1) {
          column.items.splice(index, 1)
          this.saveToLocalStorage()
          break
        }
      }
    },

    startDragging(item: KanbanItem) {
      this.draggedItem = item
    },

    endDragging() {
      this.draggedItem = null
    }
  }
}) 