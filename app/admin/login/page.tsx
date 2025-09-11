'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, UserPlus, LogIn } from 'lucide-react'

export default function AdminAuth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [hasAdmins, setHasAdmins] = useState(true)
  const [activeTab, setActiveTab] = useState('login')
  const router = useRouter()
  const supabase = createSupabaseClient()
  const isProduction = process.env.NODE_ENV === 'production'

  // Check if there are any admin users on component mount
  useEffect(() => {
    checkAdminUsers()
  }, [])

  const checkAdminUsers = async () => {
    try {
      const response = await fetch('/api/admin/check-users')
      const result = await response.json()

      if (!response.ok) {
        console.error('API error:', result.error)
        // If API fails, assume no admins and show registration
        setHasAdmins(false)
        setActiveTab('register')
        return
      }
      
      setHasAdmins(result.hasAdmins)
      
      // If no admins exist and not in production, switch to registration tab
      if (!result.hasAdmins && !isProduction) {
        setActiveTab('register')
      }
    } catch (err) {
      console.error('Error checking admin users:', err instanceof Error ? err.message : err)
      // Fallback to registration mode if there's any error and not in production
      setHasAdmins(false)
      if (!isProduction) {
        setActiveTab('register')
      }
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Handle specific email confirmation error
        if (error.message.includes('Email not confirmed')) {
          setError('Please check your email and click the confirmation link before logging in. If you haven\'t received the email, you can request a new one.')
        } else {
          setError(error.message)
        }
        return
      }

      if (data.user) {
        // Check if user is admin using API route
        try {
          const response = await fetch(`/api/admin/check-role?userId=${data.user.id}`)
          const result = await response.json()

          if (response.ok && result.role === 'admin') {
            router.push('/admin')
          } else {
            setError('You do not have admin privileges')
            await supabase.auth.signOut()
          }
        } catch (roleError) {
          console.error('Error checking user role:', roleError)
          setError('Error verifying admin privileges')
          await supabase.auth.signOut()
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    try {
      // Check if this is the first admin registration using API route
      const response = await fetch('/api/admin/check-users')
      const result = await response.json()
      
      if (!response.ok) {
        setError('Error checking existing admins')
        setLoading(false)
        return
      }
      
      const isFirstAdmin = !result.hasAdmins

      // Register the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: isFirstAdmin ? 'admin' : 'user' // First user becomes admin automatically
          },
          emailRedirectTo: `${window.location.origin}/admin/login`
        }
      })

      if (error) {
        setError(error.message)
        return
      }

      if (data.user) {
        // Update the user's profile with admin role if first admin
        if (isFirstAdmin) {
          try {
            const updateResponse = await fetch('/api/admin/users', {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: data.user.id,
                role: 'admin'
              })
            })

            if (!updateResponse.ok) {
              const updateResult = await updateResponse.json()
              console.error('Error updating profile:', updateResult.error)
            }
          } catch (profileError) {
            console.error('Error updating profile:', profileError)
          }
        }

        if (isFirstAdmin) {
          setSuccess('Admin account created successfully! Please check your email for a confirmation link, then return here to log in.')
          setActiveTab('login')
          // Clear form
          setEmail('')
          setPassword('')
          setConfirmPassword('')
          setFullName('')
          // Refresh admin check
          checkAdminUsers()
        } else {
          setSuccess('Registration successful! Please check your email for a confirmation link and wait for admin approval.')
        }
      }
    } catch (err) {
      setError('An unexpected error occurred during registration')
    } finally {
      setLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    if (!email) {
      setError('Please enter your email address first')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess('Confirmation email sent! Please check your inbox and spam folder.')
      }
    } catch (err) {
      setError('Failed to resend confirmation email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {!hasAdmins && !isProduction ? 'Create Admin Account' : 'Admin Authentication'}
          </CardTitle>
          <CardDescription className="text-center">
            {!hasAdmins && !isProduction
              ? 'No admin account exists. Create the first admin account to get started.'
              : isProduction 
                ? 'Access the admin panel'
                : 'Access the admin panel or register for approval'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {!isProduction && (
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" disabled={!hasAdmins}>
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </TabsTrigger>
                <TabsTrigger value="register">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Register
                </TabsTrigger>
              </TabsList>
            )}

            {(error || success) && (
              <Alert variant={error ? "destructive" : "default"} className="mt-4">
                <AlertDescription>{error || success}</AlertDescription>
              </Alert>
            )}

            <TabsContent value="login" className="space-y-4 mt-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="admin@techpinik.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
                
                {!isProduction && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full" 
                    onClick={handleResendConfirmation}
                    disabled={loading || !email}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Resend Confirmation Email'
                     )}
                   </Button>
                )}
               </form>
               
               {!isProduction && (
                 <div className="text-sm text-gray-600 text-center mt-4">
                   <p>Having trouble logging in?</p>
                   <p className="mt-1">Make sure you've confirmed your email address. Check your inbox and spam folder for the confirmation email.</p>
                 </div>
               )}
             </TabsContent>

            {!isProduction && (
              <TabsContent value="register" className="space-y-4 mt-4">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">Full Name</Label>
                  <Input
                    id="register-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="Enter your password (min 6 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    minLength={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {!hasAdmins ? 'Creating Admin...' : 'Registering...'}
                    </>
                  ) : (
                    !hasAdmins ? 'Create Admin Account' : 'Register for Approval'
                  )}
                </Button>

                {!hasAdmins && (
                  <p className="text-sm text-muted-foreground text-center">
                    This will be the first admin account with full access.
                  </p>
                )}
              </form>
            </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}