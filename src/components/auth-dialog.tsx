"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription, // Ensure this is imported
} from "@/components/ui/dialog"
import { Auth } from "@supabase/auth-ui-react"
import { ThemeSupa } from "@supabase/auth-ui-shared"
import { useSession } from "@/context/session-context"
import { toast } from "sonner"
import { AuthChangeEvent, Session } from "@supabase/supabase-js" // Import types

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const allowedDomains = [
  "gmail.com",
  "hotmail.com",
  "outlook.com"
];

const adminEmail = "admin@dropskey.com";

function isAllowedEmail(email: string) {
  if (email.toLowerCase() === adminEmail) return true;
  const domain = email.split("@")[1]?.toLowerCase();
  return allowedDomains.includes(domain);
}
export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const router = useRouter()
  const { supabase, session } = useSession() // Get supabase from context
  const [emailError, setEmailError] = useState<string | null>(null)
  const emailInputRef = useRef<HTMLInputElement | null>(null)
  const [redirectAfterAuth, setRedirectAfterAuth] = useState<string | null>(null)

  // Check if there's saved checkout form data to redirect back after signup
  useEffect(() => {
    if (open && typeof window !== 'undefined') {
      const savedFormData = sessionStorage.getItem('checkoutFormData')
      if (savedFormData) {
        setRedirectAfterAuth('/checkout')
      }
    }
  }, [open])

  // Handle email input validation
  useEffect(() => {
    if (!open) return;

    const interval = setInterval(() => {
      const input = document.querySelector('input[type="email"]') as HTMLInputElement | null;
      if (input) {
        emailInputRef.current = input;
        // Add event listener to the parent form
        const form = input.closest("form");
        if (form) {
          const handler = (e: Event) => {
            const email = input.value.trim();
            if (email && !isAllowedEmail(email)) {
              e.preventDefault();
              setEmailError("Only Gmail, Hotmail, or Outlook are allowed.");
              toast.error("Only Gmail, Hotmail, or Outlook are allowed.");
              input.focus();
              return false;
            } else {
              setEmailError(null);
            }
          };
          form.addEventListener("submit", handler, { capture: true });
          // Clean up
          return () => {
            form.removeEventListener("submit", handler, { capture: true });
          };
        }
      }
    }, 300);

    return () => clearInterval(interval);
  }, [open]);

  // Handle auth state changes and profile creation
  useEffect(() => {
    if (!supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => { // Explicitly type event and session
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            // Create a profile for new users
            const response = await fetch('/api/auth/create-profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: session.user.id,
                email: session.user.email
              })
            });

            if (!response.ok) {
              const error = await response.json();
              console.error('Error creating user profile:', error);
            }

            // Close the dialog after successful sign in
            onOpenChange(false);

            // Redirect to checkout if user was in the middle of checkout flow
            if (redirectAfterAuth) {
              toast.success("Account created successfully! Redirecting to checkout...");
              setTimeout(() => {
                router.push(redirectAfterAuth);
                setRedirectAfterAuth(null);
              }, 500);
            }
          } catch (error) {
            console.error('Error in auth state change:', error);
          }
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [open, supabase, onOpenChange, redirectAfterAuth, router]); // Add dependencies

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign In / Sign Up</DialogTitle>
          <DialogDescription>
            Enter your email and password to sign in or create an account. Only Gmail, Hotmail, or Outlook are allowed for registration.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6">
          {/* Render Auth only once Supabase client is ready to avoid runtime errors */}
          {supabase && (
            <Auth
              key={open ? "auth-dialog-open" : "auth-dialog-closed"}
              supabaseClient={supabase}
              providers={['google']}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: "#1e73be",
                      brandAccent: "#28a745",
                    },
                  },
                },
              }}
              theme="light"
              showLinks={true}
              redirectTo={`${(() => {
                // Prioritize the injected public env variable
                if (typeof window !== 'undefined' && (window as any).__PUBLIC_ENV?.NEXT_PUBLIC_BASE_URL) {
                  return (window as any).__PUBLIC_ENV.NEXT_PUBLIC_BASE_URL;
                }
                // Fallback to window.location.origin if public env is not available
                if (typeof window !== 'undefined' && window.location?.origin) {
                  return window.location.origin;
                }
                return ''; // Final fallback to empty string
              })()}/auth/callback`}
              view="sign_in"
              additionalData={{
                emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : ''
              }}
            />
          )}
          {emailError && (
            <div className="text-red-600 text-sm text-center">{emailError}</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
