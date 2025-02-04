export type KanbanItemType = 'email' | 'task' | 'note'
export type KanbanColumnId = 'archived' | 'todo' | 'waiting'

export interface KanbanItem {
  id: string
  type: KanbanItemType
  title: string
  description: string
  date: Date
  labels: string[]
  originalData?: any // Données originales (email complet, tâche complète, etc.)
  columnId: KanbanColumnId
  order: number
}

export interface KanbanColumn {
  id: KanbanColumnId
  title: string
  items: KanbanItem[]
}

export class KanbanService {
  private columns: Map<KanbanColumnId, KanbanColumn>

  constructor() {
    this.columns = new Map([
      ['archived', { id: 'archived', title: 'Archivé', items: [] }],
      ['todo', { id: 'todo', title: 'À faire', items: [] }],
      ['waiting', { id: 'waiting', title: 'En attente', items: [] }]
    ])
  }

  // Récupérer toutes les colonnes
  getColumns(): KanbanColumn[] {
    return Array.from(this.columns.values())
  }

  // Récupérer une colonne spécifique
  getColumn(columnId: KanbanColumnId): KanbanColumn | undefined {
    return this.columns.get(columnId)
  }

  // Ajouter un élément dans une colonne
  addItem(columnId: KanbanColumnId, item: Omit<KanbanItem, 'id' | 'order' | 'columnId'>): KanbanItem {
    const column = this.columns.get(columnId)
    if (!column) {
      throw new Error(`Colonne ${columnId} non trouvée`)
    }

    const newItem: KanbanItem = {
      ...item,
      id: this.generateId(),
      columnId,
      order: column.items.length
    }

    column.items.push(newItem)
    return newItem
  }

  // Déplacer un élément vers une autre colonne
  moveItem(itemId: string, targetColumnId: KanbanColumnId): void {
    // Trouver l'élément dans toutes les colonnes
    let item: KanbanItem | undefined
    let sourceColumn: KanbanColumn | undefined

    for (const column of this.columns.values()) {
      const foundItem = column.items.find(i => i.id === itemId)
      if (foundItem) {
        item = foundItem
        sourceColumn = column
        break
      }
    }

    if (!item || !sourceColumn) {
      throw new Error(`Élément ${itemId} non trouvé`)
    }

    const targetColumn = this.columns.get(targetColumnId)
    if (!targetColumn) {
      throw new Error(`Colonne cible ${targetColumnId} non trouvée`)
    }

    // Retirer l'élément de la colonne source
    sourceColumn.items = sourceColumn.items.filter(i => i.id !== itemId)

    // Ajouter l'élément à la colonne cible
    item.columnId = targetColumnId
    item.order = targetColumn.items.length
    targetColumn.items.push(item)
  }

  // Réordonner les éléments dans une colonne
  reorderItems(columnId: KanbanColumnId, itemIds: string[]): void {
    const column = this.columns.get(columnId)
    if (!column) {
      throw new Error(`Colonne ${columnId} non trouvée`)
    }

    // Créer un nouvel ordre pour les éléments
    const reorderedItems: KanbanItem[] = []
    itemIds.forEach((id, index) => {
      const item = column.items.find(i => i.id === id)
      if (item) {
        item.order = index
        reorderedItems.push(item)
      }
    })

    column.items = reorderedItems
  }

  // Supprimer un élément
  deleteItem(itemId: string): void {
    for (const column of this.columns.values()) {
      column.items = column.items.filter(i => i.id !== itemId)
    }
  }

  // Convertir un email en élément Kanban
  emailToKanbanItem(email: any): Omit<KanbanItem, 'id' | 'order' | 'columnId'> {
    return {
      type: 'email',
      title: email.subject,
      description: email.preview,
      date: email.date,
      labels: email.labels,
      originalData: email
    }
  }

  // Générer un ID unique
  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  // Sauvegarder l'état dans le localStorage
  saveState(): void {
    const state = Array.from(this.columns.entries())
    localStorage.setItem('kanban-state', JSON.stringify(state))
  }

  // Charger l'état depuis le localStorage
  loadState(): void {
    const savedState = localStorage.getItem('kanban-state')
    if (savedState) {
      const state = JSON.parse(savedState)
      this.columns = new Map(state)
    }
  }
} 