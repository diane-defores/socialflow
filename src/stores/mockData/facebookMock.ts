import { defineStore } from 'pinia'

export interface FacebookPost {
  id: string
  author: {
    name: string
    avatar: string
  }
  content: string
  image?: string
  likes: number
  comments: number
  shares: number
  date: Date
}

export const mockPosts: FacebookPost[] = [
  {
    id: '1',
    author: {
      name: 'John Doe',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john'
    },
    content: 'Incroyable journée au bureau ! 🚀 #startup #innovation',
    image: 'https://picsum.photos/seed/fb1/600/400',
    likes: 156,
    comments: 23,
    shares: 5,
    date: new Date('2024-03-19T10:30:00')
  },
  {
    id: '2',
    author: {
      name: 'Marie Martin',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marie'
    },
    content: 'Nouveau projet en cours... Plus d\'infos bientôt ! 😊',
    likes: 89,
    comments: 12,
    shares: 2,
    date: new Date('2024-03-19T09:15:00')
  },
  {
    id: '3',
    author: {
      name: 'Tech News',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tech'
    },
    content: 'Les dernières avancées en IA sont impressionnantes ! Découvrez notre article complet sur le sujet.',
    image: 'https://picsum.photos/seed/fb2/600/400',
    likes: 432,
    comments: 67,
    shares: 89,
    date: new Date('2024-03-19T08:00:00')
  }
]

interface FacebookMockState {
  posts: FacebookPost[]
  loading: boolean
  error: string | null
}

export const useFacebookMockStore = defineStore('facebookMock', {
  state: (): FacebookMockState => ({
    posts: [],
    loading: false,
    error: null
  }),

  actions: {
    async fetchPosts() {
      this.loading = true
      this.error = null

      try {
        // Simuler un délai réseau
        await new Promise(resolve => setTimeout(resolve, 1000))
        this.posts = mockPosts
      } catch (error) {
        this.error = 'Erreur lors du chargement des posts'
        console.error('Erreur:', error)
      } finally {
        this.loading = false
      }
    },

    async addPost(content: string, image?: string) {
      const newPost: FacebookPost = {
        id: crypto.randomUUID(),
        author: {
          name: 'Utilisateur actuel',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=current'
        },
        content,
        image,
        likes: 0,
        comments: 0,
        shares: 0,
        date: new Date()
      }

      this.posts.unshift(newPost)
    },

    likePost(postId: string) {
      const post = this.posts.find(p => p.id === postId)
      if (post) {
        post.likes++
      }
    },

    sharePost(postId: string) {
      const post = this.posts.find(p => p.id === postId)
      if (post) {
        post.shares++
      }
    }
  }
}) 