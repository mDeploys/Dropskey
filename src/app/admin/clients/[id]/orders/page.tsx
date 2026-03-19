"use server"

import { createAdminClient, createSupabaseServerClientComponent } from "@/lib/supabase/server" // Updated import
import { notFound, redirect } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function ClientOrdersPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createSupabaseServerClientComponent() // Await the client
  
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
  const { data: client, error: clientError } = await supabaseAdmin
    .from('profiles')
    .select('first_name, last_name, email')
    .eq('id', params.id)
    .single()

  if (clientError) {
    console.error('Error fetching client:', clientError)
    notFound()
  }

  // Fetch orders for the client
  const { data: orders, error: ordersError } = await supabaseAdmin
    .from('orders')
    .select(`
      *,
      order_items(*)
    `)
    .eq('user_id', params.id)
    .order('created_at', { ascending: false })

  if (ordersError) {
    console.error('Error fetching orders:', ordersError)
    return (
      <div className="container mx-auto p-6">
        <div className="text-red-500">Error loading orders. Please try again later.</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          Orders for {client.first_name} {client.last_name}
        </h1>
        <p className="text-muted-foreground">{client.email}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
          <CardDescription>
            View and manage orders for this client
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orders && orders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.id.substring(0, 8)}...
                    </TableCell>
                    <TableCell>
                      {new Date(order.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {order.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {(order.total / 100).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/orders/${order.id}`}>
                          View Details
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No orders found for this client.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
