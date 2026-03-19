"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import Turnstile from "react-turnstile"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { getPublicEnv } from "@/lib/public-env"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required."),
  email: z.string().email("Please enter a valid email address."),
  subject: z.string().min(1, "Subject is required."),
  message: z.string().min(10, "Message must be at least 10 characters.").max(1000, "Message cannot exceed 1000 characters."),
})

type ContactFormValues = z.infer<typeof contactFormSchema>

export default function ContactForm() {
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [turnstileError, setTurnstileError] = useState<string | null>(null)
  const siteKey = getPublicEnv().NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || ""
  const isTurnstileConfigured = Boolean(siteKey)

  async function onSubmit(values: ContactFormValues) {
    if (!isTurnstileConfigured) {
      toast.error("Contact form protection is not configured. Add NEXT_PUBLIC_TURNSTILE_SITE_KEY and redeploy.")
      return
    }

    if (!turnstileToken) {
      toast.error("Complete the security check before sending your message.")
      return
    }

    setIsSubmitting(true)
    const toastId = toast.loading("Sending your message...")

    try {
      const res = await fetch("/contact/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, turnstileToken })
      })

      if (res.ok) {
        toast.success("Message sent successfully!", { id: toastId })
        form.reset()
        setTurnstileToken(null)
        setTurnstileError(null)
      } else {
        const errorData = await res.json()
        toast.error(`Failed to send message: ${errorData.error || "An unknown error occurred."}`, { id: toastId })
      }
    } catch (error: any) {
      console.error("Error sending contact form:", error)
      toast.error(`Failed to send message: ${error.message || "Network error."}`, { id: toastId })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="max-w-lg mx-auto shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Get in Touch</CardTitle>
        <CardDescription>We'd love to hear from you! Fill out the form below.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john.doe@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="Regarding my order..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us how we can help you..."
                      className="min-h-[120px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isTurnstileConfigured ? (
              <div className="space-y-2">
                <Turnstile
                  sitekey={siteKey}
                  onVerify={(token: string) => {
                    setTurnstileToken(token)
                    setTurnstileError(null)
                  }}
                  onExpire={() => setTurnstileToken(null)}
                  onError={() => {
                    setTurnstileToken(null)
                    setTurnstileError("Security check failed to load. Please refresh the page and try again.")
                  }}
                />
                {turnstileError ? (
                  <p className="text-sm text-red-600">{turnstileError}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Complete the security check to enable the send button.
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                Cloudflare Turnstile is not configured. Add <code>NEXT_PUBLIC_TURNSTILE_SITE_KEY</code> to your environment and redeploy.
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting || !isTurnstileConfigured || !turnstileToken}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Message"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
