import api from '../services/api'

export interface User {
  id: string
  email: string
  username: string
  avatarUrl: string | null
  bannerUrl: string | null
  role: 'PLAYER' | 'ORGANIZER' | 'ADMIN'
  authProvider: 'EMAIL' | 'GOOGLE'
  emailVerified: boolean
  twitterUrl: string | null
  discordTag: string | null
  twitchUrl: string | null
  youtubeUrl: string | null
  riotGameName: string | null
  riotTagLine: string | null
  riotPuuid: string | null
  riotRegion: string | null
  riotVerified: boolean
  createdAt: string
}

export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  username: string
}

const API_URL = (import.meta as Record<string, any>).env?.VITE_API_URL ?? 'http://localhost:3000'

export const authService = {
  async login(data: LoginData): Promise<User> {
    const res = await api.post<User>('/api/auth/login', data)
    return res.data
  },

  async register(data: RegisterData): Promise<User> {
    const res = await api.post<User>('/api/auth/register', data)
    return res.data
  },

  async logout(): Promise<void> {
    await api.post('/api/auth/logout')
  },

  async me(): Promise<User> {
    const res = await api.get<{ user: User }>('/api/auth/me')
    return res.data.user
  },

  loginWithGoogle(): void {
    window.location.href = `${API_URL}/api/auth/google`
  },
}
