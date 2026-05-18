import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useLocalStorage } from './useLocalStorage'
import type { User } from '@/types'

interface AuthContextType {
  token: string | null
  user: User | null | undefined // undefined means loading
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name?: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useLocalStorage<string | null>('flmr_auth_token', null)
  
  const user = useQuery(api.auth.getMe, token ? { token } : 'skip') as User | null | undefined
  const loginMutation = useMutation(api.auth.login)
  const signupMutation = useMutation(api.auth.signup)

  const login = async (email: string, password: string) => {
    const { token: newToken } = await loginMutation({ email, password })
    setToken(newToken)
  }

  const signup = async (email: string, password: string, name?: string) => {
    const { token: newToken } = await signupMutation({ email, password, name })
    setToken(newToken)
  }

  const logout = () => {
    setToken(null)
  }

  useEffect(() => {
    if (token && user === null) {
      setToken(null)
    }
  }, [token, user, setToken])

  return (
    <AuthContext.Provider value={{ token, user: token ? user : null, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
