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

export interface Email {
  id: string
  subject: string
  preview: string
  body: string
  date: Date
  sender: {
    id: string
    name: string
    avatar: string
    email: string
  }
  isRead: boolean
  labels: string[]
} 