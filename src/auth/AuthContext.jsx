import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, supabaseConfigError } from '../config/supabase.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setUser(null)
      setIsAdmin(false)
      setLoading(false)
      return
    }

    let mounted = true

    async function loadInitialSession() {
      const { data, error } = await supabase.auth.getSession()
      if (!mounted) return

      if (error) {
        setUser(null)
        setIsAdmin(false)
        setLoading(false)
        return
      }

      const sessionUser = data?.session?.user ?? null
      setUser(sessionUser)
      setIsAdmin(Boolean(sessionUser?.user_metadata?.is_admin === true))
      setLoading(false)
    }

    loadInitialSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null
      setUser(nextUser)
      setIsAdmin(Boolean(nextUser?.user_metadata?.is_admin === true))
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const value = useMemo(() => {
    return {
      user,
      isAdmin,
      loading,
      configError: supabaseConfigError,
      signOut: async () => {
        if (!supabase) return
        await supabase.auth.signOut()
      },
    }
  }, [user, isAdmin, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}