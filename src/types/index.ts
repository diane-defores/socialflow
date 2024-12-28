export interface MenuItem {
  id: number
  label: string
  icon: string
  route: string
}

export interface NetworkData {
  id: number
  label: string
  icon: string
  route: string
}

export interface FilterOptions {
  dateRange: [Date | null, Date | null] | null
  quickDate: string
  filters: number[]
  sort: string | null
}

export interface ProfileMenuItem {
  label: string
  icon: string
  separator?: boolean
  command?: () => void
} 