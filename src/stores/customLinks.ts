import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getConvexClient } from '@/lib/convex'
import { api } from '../../convex/_generated/api'

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
    const link = {
      id: `custom-${crypto.randomUUID()}`,
      label: trimmedLabel,
      url: trimmedUrl,
      icon: 'pi pi-link',
    }
    links.value[profileId].push(link)
    syncLinkToCloud(profileId, link)
  }

  const removeLink = (profileId: string, linkId: string) => {
    if (links.value[profileId]) {
      links.value[profileId] = links.value[profileId].filter(l => l.id !== linkId)
    }
    removeLinkFromCloud(linkId)
  }

  const replaceFromCloud = (cloudLinks: Array<{
    linkId: string
    profileId: string
    label: string
    url: string
    icon: string
  }>) => {
    links.value = {}
    for (const link of cloudLinks) {
      if (!links.value[link.profileId]) links.value[link.profileId] = []
      links.value[link.profileId].push({
        id: link.linkId,
        label: link.label,
        url: link.url,
        icon: link.icon,
      })
    }
  }

  const syncLinkToCloud = async (profileId: string, link: CustomLink) => {
    try {
      const client = getConvexClient()
      await client.mutation(api.customLinks.upsert, {
        linkId: link.id,
        profileId,
        label: link.label,
        url: link.url,
        icon: link.icon,
      })
    } catch {
      // Offline or unauthenticated.
    }
  }

  const removeLinkFromCloud = async (linkId: string) => {
    try {
      const client = getConvexClient()
      await client.mutation(api.customLinks.remove, { linkId })
    } catch {
      // Offline or unauthenticated.
    }
  }

  const seedCloud = async () => {
    for (const [profileId, profileLinks] of Object.entries(links.value)) {
      for (const link of profileLinks) {
        await syncLinkToCloud(profileId, link)
      }
    }
  }

  const clearLocal = () => {
    links.value = {}
  }

  return { links, getLinks, addLink, removeLink, replaceFromCloud, seedCloud, clearLocal }
}, { persist: true })
