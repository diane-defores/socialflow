import type { Email } from '../../types'

export const gmailMockData: Email[] = [
  {
    id: '1',
    subject: 'Réunion importante demain',
    preview: 'Bonjour, je vous confirme la réunion de demain à 10h...',
    body: 'Bonjour,\n\nje vous confirme la réunion de demain à 10h dans la salle de conférence principale. N\'oubliez pas d\'apporter vos documents.\n\nCordialement,\nPierre',
    date: new Date('2024-01-15T09:30:00'),
    sender: {
      id: '101',
      name: 'Pierre Dupont',
      avatar: 'https://i.pravatar.cc/150?img=1',
      email: 'pierre.dupont@example.com'
    },
    isRead: false,
    labels: ['Important', 'Travail']
  },
  {
    id: '2',
    subject: 'Facture Janvier 2024',
    preview: 'Veuillez trouver ci-joint votre facture pour le mois de janvier...',
    body: 'Cher client,\n\nVeuillez trouver ci-joint votre facture pour le mois de janvier 2024.\n\nMerci de votre confiance.\n\nBien cordialement,\nService Facturation',
    date: new Date('2024-01-14T15:45:00'),
    sender: {
      id: '102',
      name: 'Service Facturation',
      avatar: 'https://i.pravatar.cc/150?img=2',
      email: 'facturation@example.com'
    },
    isRead: true,
    labels: ['Factures']
  },
  {
    id: '3',
    subject: 'Newsletter Tech - Janvier 2024',
    preview: 'Découvrez les dernières actualités tech du mois...',
    body: 'Les dernières actualités tech du mois :\n- Intelligence artificielle\n- Développement web\n- Cybersécurité',
    date: new Date('2024-01-13T08:00:00'),
    sender: {
      id: '103',
      name: 'Tech News',
      avatar: 'https://i.pravatar.cc/150?img=3',
      email: 'news@tech-example.com'
    },
    isRead: true,
    labels: ['Newsletter']
  }
] 
