export const gmailConfig = {
  clientId: import.meta.env.VITE_GMAIL_CLIENT_ID || '',
  apiKey: import.meta.env.VITE_GMAIL_API_KEY || '',
  scope: 'https://www.googleapis.com/auth/gmail.modify'
} 