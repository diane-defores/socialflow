import { defineStore } from 'pinia'

export interface FacebookPost {
  id: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    type: 'user' | 'page';
    verified?: boolean;
  };
  content: {
    text?: string;
    images?: string[];
    video?: string;
    link?: {
      url: string;
      title: string;
      description: string;
      thumbnail: string;
    };
  };
  privacy: 'public' | 'friends' | 'private';
  stats: {
    likes: number;
    comments: number;
    shares: number;
    reactions: {
      like: number;
      love: number;
      care: number;
      haha: number;
      wow: number;
      sad: number;
      angry: number;
    };
  };
  timestamp: string;
  location?: string;
  tagged_users?: string[];
  comments?: FacebookComment[];
}

export interface FacebookComment {
  id: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  replies?: FacebookComment[];
}

export interface FacebookStory {
  id: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  image: string;
  timestamp: string;
  viewed: boolean;
}

export const useFacebookMockStore = defineStore('facebookMock', {
  state: () => ({
    currentUser: {
      id: 'user1',
      name: 'John Doe',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
      friends: 847,
      notifications: 3
    },
    stories: [
      {
        id: 'story1',
        author: {
          id: 'user2',
          name: 'Marie Laurent',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marie'
        },
        image: 'https://picsum.photos/seed/story1/400/600',
        timestamp: '2024-01-10T14:30:00Z',
        viewed: false
      },
      {
        id: 'story2',
        author: {
          id: 'user3',
          name: 'Pierre Dubois',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pierre'
        },
        image: 'https://picsum.photos/seed/story2/400/600',
        timestamp: '2024-01-10T15:15:00Z',
        viewed: true
      }
    ] as FacebookStory[],
    posts: [
      {
        id: 'post1',
        author: {
          id: 'vuejs',
          name: 'Vue.js France',
          avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=vuefr',
          type: 'page',
          verified: true
        },
        content: {
          text: "🎉 Grande nouvelle ! Vue.js 3.4 est sorti avec des améliorations significatives de performances !\n\n✨ Principales nouveautés :\n- Optimisation du rendu\n- Meilleure gestion de la mémoire\n- Nouvelles fonctionnalités pour les composables\n\nQui a déjà testé cette version ?",
          link: {
            url: 'https://blog.vuejs.org/posts/vue-3-4',
            title: 'Vue 3.4 "Slam Dunk" Released',
            description: 'Découvrez les nouvelles fonctionnalités de Vue.js 3.4',
            thumbnail: 'https://picsum.photos/seed/vue34/600/300'
          }
        },
        privacy: 'public',
        stats: {
          likes: 1234,
          comments: 89,
          shares: 156,
          reactions: {
            like: 890,
            love: 234,
            care: 45,
            haha: 12,
            wow: 34,
            sad: 0,
            angry: 0
          }
        },
        timestamp: '2024-01-10T10:00:00Z',
        comments: [
          {
            id: 'comment1',
            author: {
              id: 'user4',
              name: 'Sophie Martin',
              avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sophie'
            },
            content: "J'ai déjà migré mon projet, les performances sont impressionnantes ! 🚀",
            timestamp: '2024-01-10T10:15:00Z',
            likes: 23,
            replies: [
              {
                id: 'reply1',
                author: {
                  id: 'user5',
                  name: 'Lucas Bernard',
                  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lucas'
                },
                content: "Tu as remarqué des breaking changes ?",
                timestamp: '2024-01-10T10:20:00Z',
                likes: 3
              }
            ]
          }
        ]
      },
      {
        id: 'post2',
        author: {
          id: 'techparis',
          name: 'Tech Events Paris',
          avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=techparis',
          type: 'page'
        },
        content: {
          text: "📢 Le plus grand événement tech de l'année arrive à Paris !\n\n🗓️ 15-16 Mars 2024\n📍 Paris Expo Porte de Versailles\n\n🎟️ Early bird tickets disponibles !",
          images: [
            'https://picsum.photos/seed/event1/800/400',
            'https://picsum.photos/seed/event2/800/400'
          ]
        },
        privacy: 'public',
        stats: {
          likes: 567,
          comments: 45,
          shares: 89,
          reactions: {
            like: 423,
            love: 89,
            care: 12,
            haha: 0,
            wow: 43,
            sad: 0,
            angry: 0
          }
        },
        timestamp: '2024-01-10T09:30:00Z',
        location: 'Paris, France'
      },
      {
        id: 'post3',
        author: {
          id: 'user6',
          name: 'Emma Wilson',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emma',
          type: 'user'
        },
        content: {
          text: "Super session de code aujourd'hui ! 💻✨\nJe suis enfin passée à TypeScript sur mon projet Vue, et franchement, c'est un game changer !",
          images: [
            'https://picsum.photos/seed/code1/600/400'
          ]
        },
        privacy: 'friends',
        stats: {
          likes: 34,
          comments: 12,
          shares: 2,
          reactions: {
            like: 23,
            love: 8,
            care: 3,
            haha: 0,
            wow: 0,
            sad: 0,
            angry: 0
          }
        },
        timestamp: '2024-01-10T08:45:00Z'
      }
    ] as FacebookPost[],
    onlineFriends: [
      {
        id: 'user2',
        name: 'Marie Laurent',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marie',
        status: 'online'
      },
      {
        id: 'user4',
        name: 'Sophie Martin',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sophie',
        status: 'online'
      },
      {
        id: 'user5',
        name: 'Lucas Bernard',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lucas',
        status: 'idle'
      }
    ]
  }),

  getters: {
    getUnviewedStories: (state) => {
      return state.stories.filter(story => !story.viewed)
    },
    getPostById: (state) => {
      return (postId: string) => state.posts.find(post => post.id === postId)
    },
    getPostComments: (state) => {
      return (postId: string) => {
        const post = state.posts.find(p => p.id === postId)
        return post?.comments || []
      }
    }
  },

  actions: {
    addPost(post: Partial<FacebookPost>) {
      const newPost: FacebookPost = {
        id: `post${Date.now()}`,
        author: this.currentUser,
        content: post.content || {},
        privacy: post.privacy || 'friends',
        stats: {
          likes: 0,
          comments: 0,
          shares: 0,
          reactions: {
            like: 0,
            love: 0,
            care: 0,
            haha: 0,
            wow: 0,
            sad: 0,
            angry: 0
          }
        },
        timestamp: new Date().toISOString()
      } as FacebookPost

      this.posts.unshift(newPost)
    },

    addComment(postId: string, content: string) {
      const post = this.posts.find(p => p.id === postId)
      if (!post) return

      const newComment: FacebookComment = {
        id: `comment${Date.now()}`,
        author: this.currentUser,
        content,
        timestamp: new Date().toISOString(),
        likes: 0
      }

      if (!post.comments) {
        post.comments = []
      }
      post.comments.push(newComment)
      post.stats.comments++
    },

    addReaction(postId: string, reactionType: keyof FacebookPost['stats']['reactions']) {
      const post = this.posts.find(p => p.id === postId)
      if (!post) return

      post.stats.reactions[reactionType]++
      post.stats.likes = Object.values(post.stats.reactions).reduce((a, b) => a + b, 0)
    },

    sharePost(postId: string) {
      const post = this.posts.find(p => p.id === postId)
      if (!post) return

      post.stats.shares++
    },

    viewStory(storyId: string) {
      const story = this.stories.find(s => s.id === storyId)
      if (story) {
        story.viewed = true
      }
    }
  }
}) 