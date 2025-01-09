declare module '@/components/common' {
  import { DefineComponent } from 'vue'

  export const NetworkLogo: DefineComponent<{
    domain: string
    size?: 'small' | 'medium' | 'large'
  }>

  export const SocialNetworkLogo: DefineComponent<{
    network: 'facebook' | 'twitter' | 'linkedin' | 'reddit' | 'instagram' | 'discord'
    size?: 'small' | 'medium' | 'large'
    className?: string
  }>
} 