'use client'

import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createSupabaseClient } from '@/lib/supabase'

interface AuthState {
  user: User | null
  loading: boolean
  isAdmin: boolean
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    isAdmin: false
  })
  
  const supabase = createSupabaseClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          // Check if user is admin using API route
          try {
            const response = await fetch(`/api/admin/check-role?userId=${user.id}`)
            const result = await response.json()
            
            setAuthState({
              user,
              loading: false,
              isAdmin: response.ok && result.role === 'admin'
            })
          } catch (error) {
            console.error('Error checking user role:', error)
            setAuthState({
              user,
              loading: false,
              isAdmin: false
            })
          }
        } else {
          setAuthState({
            user: null,
            loading: false,
            isAdmin: false
          })
        }
      } catch (error) {
        console.error('Auth check error:', error)
        setAuthState({
          user: null,
          loading: false,
          isAdmin: false
        })
      }
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // Check if user is admin
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()
          
          setAuthState({
            user: session.user,
            loading: false,
            isAdmin: profile?.role === 'admin'
          })
        } else if (event === 'SIGNED_OUT') {
          setAuthState({
            user: null,
            loading: false,
            isAdmin: false
          })
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    return data
  }

  return {
    ...authState,
    signOut,
    signIn
  }
}