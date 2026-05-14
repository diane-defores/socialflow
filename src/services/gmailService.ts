const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me'

export interface GmailConfig {
  clientId: string
  apiKey: string
  scope: string
}

interface GmailMessageSummary {
  id?: string
  labelIds?: string[]
}

interface GmailMessagePayloadHeader {
  name: string
  value?: string
}

interface GmailMessagePayloadBody {
  data?: string
}

interface GmailMessagePayloadPart {
  mimeType?: string
  body?: GmailMessagePayloadBody
}

interface GmailMessagePayload {
  headers?: GmailMessagePayloadHeader[]
  parts?: GmailMessagePayloadPart[]
  body?: GmailMessagePayloadBody
}

interface GmailMessage {
  id?: string
  threadId?: string
  labelIds?: string[]
  payload?: GmailMessagePayload
}

interface ParsedGmailMessage {
  id: string
  threadId: string
  subject: string
  preview: string
  body: string
  date: Date
  sender: {
    id: string
    name: string
    email: string
    avatar: string
  }
  isRead: boolean
  labels: string[]
}

interface GmailLabel {
  id: string
  name: string
  type?: string
  [key: string]: unknown
}

export class GmailService {
  private accessToken: string | null = null
  private config: GmailConfig

  constructor(config: GmailConfig) {
    this.config = config
  }

  async init() {
    // Charger la bibliothèque Google
    await this.loadGoogleAPI()
    await this.initializeGoogleAuth()
  }

  private async loadGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://apis.google.com/js/api.js'
      script.onload = () => {
        gapi.load('client:auth2', () => {
          resolve()
        })
      }
      script.onerror = reject
      document.body.appendChild(script)
    })
  }

  private async initializeGoogleAuth(): Promise<void> {
    await gapi.client.init({
      apiKey: this.config.apiKey,
      clientId: this.config.clientId,
      scope: this.config.scope,
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest']
    })
  }

  async authenticate(): Promise<void> {
    try {
      const googleAuth = gapi.auth2.getAuthInstance()
      const user = await googleAuth.signIn()
      this.accessToken = user.getAuthResponse().access_token
    } catch (error) {
      console.error('Erreur d\'authentification Gmail:', error)
      throw error
    }
  }

  async getEmails(maxResults: number = 20): Promise<ParsedGmailMessage[]> {
    if (!this.accessToken) {
      throw new Error('Non authentifié')
    }

    try {
      // Récupérer la liste des messages
      const response = await gapi.client.gmail.users.messages.list({
        userId: 'me',
        maxResults: maxResults,
        labelIds: ['INBOX']
      })

      // Récupérer les détails de chaque message
      const messages = response.result.messages || []
      const parsed = await Promise.all(
        messages.map(async (message: GmailMessageSummary) => {
          const details = await gapi.client.gmail.users.messages.get({
            userId: 'me',
            id: message.id || '',
            format: 'full'
          })
          return this.parseMessage(details.result as GmailMessage)
        })
      )

      return parsed
    } catch (error) {
      console.error('Erreur lors de la récupération des emails:', error)
      throw error
    }
  }

  private async parseMessage(message: GmailMessage): Promise<ParsedGmailMessage> {
    const headers = message.payload?.headers ?? []
    const subject = headers.find((h) => h.name === 'Subject')?.value
    const from = headers.find((h) => h.name === 'From')?.value
    const date = headers.find((h) => h.name === 'Date')?.value

    // Extraire le nom et l'email de l'expéditeur
    const fromMatch = from?.match(/(?:"?([^"]*)"?\s)?(?:<?(.+@[^>]+)>?)/)
    const [, senderName = '', senderEmail = ''] = fromMatch || []

    // Extraire le contenu du message
    let body = ''
    if (message.payload.parts) {
      const textPart = message.payload.parts?.find((part) => part.mimeType === 'text/plain')
      if (textPart?.body?.data) {
        body = atob(textPart.body.data.replace(/-/g, '+').replace(/_/g, '/'))
      }
    } else if (message.payload.body?.data) {
      body = atob(message.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'))
    }

    return {
      id: message.id ?? '',
      threadId: message.threadId ?? '',
      subject: subject || '(pas de sujet)',
      preview: body.substring(0, 100),
      body: body,
      date: new Date(date),
      sender: {
        id: senderEmail,
        name: senderName || senderEmail,
        email: senderEmail,
        avatar: `https://www.gravatar.com/avatar/${await this.hashEmail(senderEmail)}?d=mp`
      },
      isRead: !(message.labelIds ?? []).includes('UNREAD'),
      labels: message.labelIds ?? []
    }
  }

  private async hashEmail(email: string): Promise<string> {
    const data = new TextEncoder().encode(email.trim().toLowerCase())
    const hash = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
  }

  async markAsRead(messageId: string): Promise<void> {
    if (!this.accessToken) {
      throw new Error('Non authentifié')
    }

    try {
      await gapi.client.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        resource: {
          removeLabelIds: ['UNREAD']
        }
      })
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error)
      throw error
    }
  }

  async getLabels(): Promise<GmailLabel[]> {
    if (!this.accessToken) {
      throw new Error('Non authentifié')
    }

    try {
      const response = await gapi.client.gmail.users.labels.list({
        userId: 'me'
      })
      return (response.result.labels || []) as GmailLabel[]
    } catch (error) {
      console.error('Erreur lors de la récupération des labels:', error)
      throw error
    }
  }
} 
