"use server"

import { createAdminClient, createSupabaseServerClientComponent } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { format } from "date-fns" // Import format

export default async function ClientPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createSupabaseServerClientComponent()
  
  // Verify admin status
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', session.user.id)
    .single()

  if (!profile?.is_admin) {
    redirect("/account")
  }

  const supabaseAdmin = await createAdminClient()

  // Fetch client details
  const { data: client, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !client) {
    notFound()
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {client.first_name} {client.last_name}
          </h1>
          <p className="text-muted-foreground">{client.email}</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/clients">Back to Clients</Link>
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Client Details</CardTitle>
            <CardDescription>View and manage client information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div>
                <h3 className="font-medium">Contact Information</h3>
                {/* Removed client.phone as it does not exist in the schema */}
                <p className="text-sm text-muted-foreground">
                  {client.email || 'No email provided'}
                </p>
              </div>
              <div>
                <h3 className="font-medium">Account Status</h3>
                <p className="text-sm text-muted-foreground">
                  {client.is_admin ? 'Admin' : 'Customer'}
                </p>
              </div>
              <div>
                <h3 className="font-medium">Member Since</h3>
                <p className="text-sm text-muted-foreground">
                  {client.created_at ? format(new Date(client.created_at), 'PPP') : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Orders</CardTitle>
                <CardDescription>View and manage client orders</CardDescription>
              </div>
              <Button asChild size="sm">
                <Link href={`/admin/clients/${params.id}/orders`}>
                  View All Orders
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              View and manage all orders placed by this client.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
