/**
 * Formate une date en une chaîne lisible en français
 * @param date La date à formater (string, number ou Date)
 * @returns La date formatée en français
 */
export function formatDate(date: string | number | Date): string {
  const dateObj = new Date(date)
  const now = new Date()
  const diff = now.getTime() - dateObj.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  // Si c'est aujourd'hui
  if (days === 0) {
    if (hours === 0) {
      if (minutes === 0) {
        return 'À l\'instant'
      }
      return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`
    }
    return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`
  }

  // Si c'est hier
  if (days === 1) {
    return 'Hier'
  }

  // Si c'est cette semaine
  if (days < 7) {
    return `Il y a ${days} jour${days > 1 ? 's' : ''}`
  }

  // Si c'est cette année
  if (dateObj.getFullYear() === now.getFullYear()) {
    return dateObj.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long'
    })
  }

  // Sinon, afficher la date complète
  return dateObj.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}