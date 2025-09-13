import { jwtDecode } from 'jwt-decode'

export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  role: 'patient' | 'doctor' | 'admin'
  is_active: boolean
  created_at: string
  last_login?: string
}

export interface AuthTokens {
  access_token: string
}

export interface JWTPayload {
  sub: number // user id
  exp: number // expiration timestamp
  iat: number // issued at timestamp
}

class AuthService {
  private static instance: AuthService
  private readonly tokenKey = 'hackloop_auth_token'
  private readonly userKey = 'hackloop_user'

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  // Token management
  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.tokenKey, token)
    }
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.tokenKey)
    }
    return null
  }

  removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.tokenKey)
      localStorage.removeItem(this.userKey)
    }
  }

  // User management
  setUser(user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.userKey, JSON.stringify(user))
    }
  }

  getUser(): User | null {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem(this.userKey)
      if (userStr) {
        try {
          return JSON.parse(userStr)
        } catch {
          return null
        }
      }
    }
    return null
  }

  // Token validation
  isTokenValid(token: string): boolean {
    if (!token) return false
    
    try {
      const decoded: JWTPayload = jwtDecode(token)
      const now = Date.now() / 1000
      return decoded.exp > now
    } catch {
      return false
    }
  }

  isAuthenticated(): boolean {
    try {
      const token = this.getToken()
      return token !== null && this.isTokenValid(token)
    } catch {
      return false
    }
  }

  // API calls
  async login(email: string, password: string): Promise<{ user: User; access_token: string }> {
    const response = await fetch('http://localhost:5000/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Login failed')
    }

    const data = await response.json()
    this.setToken(data.access_token)
    this.setUser(data.user)
    
    return data
  }

  async register(userData: {
    email: string
    password: string
    first_name: string
    last_name: string
    role?: 'patient' | 'doctor' | 'admin'
  }): Promise<{ user: User; access_token: string }> {
    const response = await fetch('http://localhost:5000/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Registration failed')
    }

    const data = await response.json()
    this.setToken(data.access_token)
    this.setUser(data.user)
    
    return data
  }

  async getCurrentUser(): Promise<User> {
    const token = this.getToken()
    if (!token) {
      this.logout()
      throw new Error('No authentication token')
    }
    
    if (!this.isTokenValid(token)) {
      this.logout()
      throw new Error('Invalid token')
    }

    try {
      const response = await fetch('http://localhost:5000/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          this.logout()
        }
        const error = await response.json()
        throw new Error(error.error || 'Failed to get user info')
      }

      const data = await response.json()
      this.setUser(data.user)
      return data.user
    } catch (error) {
      this.logout()
      throw error
    }
  }

  async refreshToken(): Promise<string> {
    const token = this.getToken()
    if (!token) {
      throw new Error('No authentication token')
    }

    const response = await fetch('http://localhost:5000/auth/refresh', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      this.logout()
      throw new Error('Token refresh failed')
    }

    const data = await response.json()
    this.setToken(data.access_token)
    return data.access_token
  }

  async logout(): Promise<void> {
    const token = this.getToken()
    
    if (token) {
      try {
        await fetch('http://localhost:5000/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      } catch (error) {
        console.warn('Logout request failed:', error)
      }
    }
    
    this.removeToken()
  }

  // Helper method for authenticated API calls
  async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = this.getToken()
    
    if (!token) {
      throw new Error('No authentication token')
    }

    if (!this.isTokenValid(token)) {
      try {
        await this.refreshToken()
      } catch {
        this.logout()
        throw new Error('Authentication expired')
      }
    }

    const headers = new Headers(options.headers)
    headers.set('Authorization', `Bearer ${this.getToken()}`)
    headers.set('Content-Type', 'application/json')

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (response.status === 401) {
      this.logout()
      throw new Error('Authentication expired')
    }

    return response
  }
}

export const authService = AuthService.getInstance()
export default authService