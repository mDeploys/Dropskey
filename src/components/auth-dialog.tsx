"use client"

import { FormEvent, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Turnstile from "react-turnstile"
import type { BoundTurnstileObject } from "react-turnstile"
import { AuthChangeEvent, Session } from "@supabase/supabase-js"
import { Loader2 } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSession } from "@/context/session-context"
import { getPublicEnv } from "@/lib/public-env"
import { toast } from "sonner"

interface AuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type AuthView = "sign_in" | "sign_up"

const allowedDomains = ["gmail.com", "hotmail.com", "outlook.com"]
const adminEmail = "admin@dropskey.com"

function isAllowedEmail(email: string) {
  if (email.toLowerCase() === adminEmail) return true
  const domain = email.split("@")[1]?.toLowerCase()
  return allowedDomains.includes(domain || "")
}

function formatAuthError(message?: string) {
  if (!message) return "Authentication failed."

  const lowered = message.toLowerCase()
  if (lowered.includes("captcha")) {
    return "Turnstile verification failed. Complete the security check and try again."
  }

  return message
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
      <path
        d="M21.35 11.1H12v2.98h5.35c-.23 1.5-1.9 4.4-5.35 4.4-3.22 0-5.84-2.66-5.84-5.94s2.62-5.94 5.84-5.94c1.84 0 3.07.78 3.78 1.46l2.58-2.5C16.7 4 14.58 3 12 3 7.03 3 3 7.03 3 12s4.03 9 9 9c5.19 0 8.62-3.64 8.62-8.77 0-.59-.06-1.03-.14-1.13Z"
        fill="#4285F4"
      />
      <path
        d="M3.96 7.69 6.4 9.48A5.96 5.96 0 0 1 12 6.06c1.84 0 3.07.78 3.78 1.46l2.58-2.5C16.7 4 14.58 3 12 3 8.55 3 5.56 4.97 3.96 7.69Z"
        fill="#EA4335"
      />
      <path
        d="M12 21c2.52 0 4.63-.83 6.17-2.25l-2.85-2.33c-.76.54-1.78.92-3.32.92-3.44 0-5.07-2.9-5.3-4.39l-2.52 1.94C5.76 18.06 8.64 21 12 21Z"
        fill="#34A853"
      />
      <path
        d="M3.96 7.69A8.94 8.94 0 0 0 3 12c0 1.57.38 3.06 1.06 4.31l2.52-1.94A5.97 5.97 0 0 1 6.16 12c0-.84.17-1.63.47-2.37L3.96 7.69Z"
        fill="#FBBC05"
      />
    </svg>
  )
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const router = useRouter()
  const { supabase } = useSession()
  const [view, setView] = useState<AuthView>("sign_in")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [turnstileError, setTurnstileError] = useState<string | null>(null)
  const [redirectAfterAuth, setRedirectAfterAuth] = useState<string | null>(null)
  const turnstileRef = useRef<BoundTurnstileObject | null>(null)

  const publicEnv = getPublicEnv()
  const turnstileSiteKey = publicEnv.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || ""
  const baseUrl = useMemo(() => {
    if (publicEnv.NEXT_PUBLIC_BASE_URL?.trim()) {
      return publicEnv.NEXT_PUBLIC_BASE_URL.trim()
    }

    if (typeof window !== "undefined" && window.location?.origin) {
      return window.location.origin
    }

    return ""
  }, [publicEnv.NEXT_PUBLIC_BASE_URL])

  const isCaptchaConfigured = Boolean(turnstileSiteKey)

  const resetTurnstile = () => {
    turnstileRef.current?.reset()
    setTurnstileToken(null)
    setTurnstileError(null)
  }

  const validateRegistrationEmail = () => {
    if (view !== "sign_up") {
      setEmailError(null)
      return true
    }

    if (!isAllowedEmail(email.trim())) {
      const message = "Only Gmail, Hotmail, or Outlook are allowed for registration."
      setEmailError(message)
      toast.error(message)
      return false
    }

    setEmailError(null)
    return true
  }

  useEffect(() => {
    if (!open) {
      setPassword("")
      setEmailError(null)
      setTurnstileError(null)
      setTurnstileToken(null)
      return
    }

    if (typeof window !== "undefined") {
      const savedFormData = sessionStorage.getItem("checkoutFormData")
      if (savedFormData) {
        setRedirectAfterAuth("/checkout")
      }
    }
  }, [open])

  useEffect(() => {
    if (!supabase) return

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (event === "SIGNED_IN" && session?.user) {
          try {
            const response = await fetch("/api/auth/create-profile", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: session.user.id,
                email: session.user.email,
              }),
            })

            if (!response.ok) {
              const error = await response.json()
              console.error("Error creating user profile:", error)
            }

            onOpenChange(false)

            if (redirectAfterAuth) {
              toast.success("Account created successfully! Redirecting to checkout...")
              setTimeout(() => {
                router.push(redirectAfterAuth)
                setRedirectAfterAuth(null)
              }, 500)
            }
          } catch (error) {
            console.error("Error in auth state change:", error)
          }
        }
      }
    )

    return () => {
      subscription?.unsubscribe()
    }
  }, [supabase, onOpenChange, redirectAfterAuth, router])

  const handlePasswordAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!supabase) {
      toast.error("Supabase client is not ready yet.")
      return
    }

    if (!email.trim() || !password) {
      toast.error("Email and password are required.")
      return
    }

    if (!validateRegistrationEmail()) {
      return
    }

    if (isCaptchaConfigured && !turnstileToken) {
      toast.error("Complete the security check before continuing.")
      return
    }

    setIsSubmitting(true)
    const toastId = toast.loading(view === "sign_in" ? "Signing in..." : "Creating account...")

    try {
      if (view === "sign_in") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
          options: turnstileToken ? { captchaToken: turnstileToken } : undefined,
        })

        if (error) {
          throw error
        }

        toast.success("Signed in successfully.", { id: toastId })
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${baseUrl}/auth/callback`,
            ...(turnstileToken ? { captchaToken: turnstileToken } : {}),
          },
        })

        if (error) {
          throw error
        }

        if (data.session) {
          toast.success("Account created successfully.", { id: toastId })
        } else {
          toast.success("Check your email to confirm your account.", { id: toastId })
          onOpenChange(false)
        }
      }
    } catch (error: any) {
      toast.error(formatAuthError(error?.message), { id: toastId })
    } finally {
      setIsSubmitting(false)
      resetTurnstile()
    }
  }

  const handleGoogleAuth = async () => {
    if (!supabase) {
      toast.error("Supabase client is not ready yet.")
      return
    }

    if (isCaptchaConfigured && !turnstileToken) {
      toast.error("Complete the security check before continuing with Google.")
      return
    }

    setIsSubmitting(true)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${baseUrl}/auth/callback`,
          ...(turnstileToken ? { captchaToken: turnstileToken } : {}),
        },
      })

      if (error) {
        throw error
      }
    } catch (error: any) {
      setIsSubmitting(false)
      toast.error(formatAuthError(error?.message))
      resetTurnstile()
    }
  }

  const renderCaptchaBlock = () => (
    <div className="space-y-3">
      {isCaptchaConfigured ? (
        <Turnstile
          sitekey={turnstileSiteKey}
          onVerify={(token, boundTurnstile) => {
            turnstileRef.current = boundTurnstile
            setTurnstileToken(token)
            setTurnstileError(null)
          }}
          onLoad={(_, boundTurnstile) => {
            turnstileRef.current = boundTurnstile
          }}
          onExpire={() => {
            setTurnstileToken(null)
          }}
          onError={() => {
            setTurnstileToken(null)
            setTurnstileError("Security check failed to load. Refresh the page and try again.")
          }}
        />
      ) : (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Turnstile is not configured for the auth dialog. Add <code>NEXT_PUBLIC_TURNSTILE_SITE_KEY</code> and redeploy if CAPTCHA is enabled in Supabase Auth.
        </div>
      )}

      {turnstileError ? (
        <p className="text-sm text-red-600">{turnstileError}</p>
      ) : isCaptchaConfigured ? (
        <p className="text-sm text-muted-foreground">
          Complete the security check before continuing.
        </p>
      ) : null}
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign In / Sign Up</DialogTitle>
          <DialogDescription>
            Enter your email and password to sign in or create an account. Only Gmail, Hotmail, or Outlook are allowed for registration.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div className="space-y-4">
            <Tabs value={view} onValueChange={(value) => setView(value as AuthView)} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="sign_in">Sign In</TabsTrigger>
                <TabsTrigger value="sign_up">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="sign_in" className="mt-4">
                <form className="space-y-4" onSubmit={handlePasswordAuth}>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="auth-email">
                      Email address
                    </label>
                    <Input
                      id="auth-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value)
                        if (emailError) {
                          setEmailError(null)
                        }
                      }}
                      placeholder="you@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="auth-password">
                      Password
                    </label>
                    <Input
                      id="auth-password"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter your password"
                    />
                  </div>

                  {renderCaptchaBlock()}

                  {emailError ? <p className="text-sm text-red-600">{emailError}</p> : null}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting || (isCaptchaConfigured && !turnstileToken)}
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Sign in
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="sign_up" className="mt-4">
                <form className="space-y-4" onSubmit={handlePasswordAuth}>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="signup-email">
                      Email address
                    </label>
                    <Input
                      id="signup-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value)
                        if (emailError) {
                          setEmailError(null)
                        }
                      }}
                      placeholder="you@gmail.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="signup-password">
                      Password
                    </label>
                    <Input
                      id="signup-password"
                      type="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Create a password"
                    />
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Registration is limited to Gmail, Hotmail, Outlook, or the admin account.
                  </p>

                  {renderCaptchaBlock()}

                  {emailError ? <p className="text-sm text-red-600">{emailError}</p> : null}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting || (isCaptchaConfigured && !turnstileToken)}
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Create account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <Separator />

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Google sign-in uses the same security check above.
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleAuth}
                disabled={isSubmitting || (isCaptchaConfigured && !turnstileToken)}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
                Continue with Google
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
