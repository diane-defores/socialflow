import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface CustomLink {
  id: string
  label: string
  url: string
  icon: string
}

export const useCustomLinksStore = defineStore('customLinks', () => {
  /** Per-profile custom links: profileId → CustomLink[] */
  const links = ref<Record<string, CustomLink[]>>({})

  const getLinks = (profileId: string): CustomLink[] =>
    links.value[profileId] ?? []

  const addLink = (profileId: string, label: string, url: string) => {
    const trimmedLabel = label.trim()
    let trimmedUrl = url.trim()
    if (!trimmedLabel || !trimmedUrl) return

    // Auto-prefix https if missing
    if (!/^https?:\/\//i.test(trimmedUrl)) trimmedUrl = `https://${trimmedUrl}`

    if (!links.value[profileId]) links.value[profileId] = []
    links.value[profileId].push({
      id: `custom-${crypto.randomUUID()}`,
      label: trimmedLabel,
      url: trimmedUrl,
      icon: 'pi pi-link',
    })
  }

  const removeLink = (profileId: string, linkId: string) => {
    if (links.value[profileId]) {
      links.value[profileId] = links.value[profileId].filter(l => l.id !== linkId)
    }
  }

  return { links, getLinks, addLink, removeLink }
}, { persist: true })
