/**
 * Formate une date en français
 * @param date - La date à formater
 * @returns La date formatée en français
 */
export function formatDate(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  // Si moins d'une minute
  if (seconds < 60) {
    return 'À l\'instant'
  }

  // Si moins d'une heure
  if (minutes < 60) {
    return `Il y a ${minutes} min${minutes > 1 ? 's' : ''}`
  }

  // Si moins d'un jour
  if (hours < 24) {
    return `Il y a ${hours} h${hours > 1 ? 's' : ''}`
  }

  // Si moins d'une semaine
  if (days < 7) {
    return `Il y a ${days} jour${days > 1 ? 's' : ''}`
  }

  // Format complet pour les dates plus anciennes
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
} 