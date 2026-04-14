import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  enqueueCustomLinkRemove,
  enqueueCustomLinkUpsert,
  flushCloudSyncQueue,
} from '@/lib/cloudSyncQueue'

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
    enqueueCustomLinkUpsert({
      linkId: link.id,
      profileId,
      label: link.label,
      url: link.url,
      icon: link.icon,
    })
    await flushCloudSyncQueue()
  }

  const removeLinkFromCloud = async (linkId: string) => {
    enqueueCustomLinkRemove(linkId)
    await flushCloudSyncQueue()
  }

  const seedCloud = async () => {
    for (const profileId in links.value) {
      const profileLinks = links.value[profileId] ?? []
      for (const link of profileLinks) {
        await syncLinkToCloud(profileId, link)
      }
    }
    await flushCloudSyncQueue()
  }

  const clearLocal = () => {
    links.value = {}
  }

  return { links, getLinks, addLink, removeLink, replaceFromCloud, seedCloud, clearLocal }
}, { persist: true })
