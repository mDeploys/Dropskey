import { createAdminClient, createSupabaseServerClientComponent } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
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
import { format } from "date-fns"
import Link from "next/link"
import { Tables } from "@/types/supabase"

interface Client {
  id: string
  first_name: string | null
  last_name: string | null
  company_name: string | null
  created_at: string
}

export default async function AdminClientsPage() {
  const supabase = await createSupabaseServerClientComponent()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Check admin status
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', session.user.id)
    .single() as { data: Pick<Tables<'profiles'>, 'is_admin'> | null, error: any };

  if (profileError || !profile?.is_admin) {
    console.error('Admin check failed:', profileError)
    redirect("/account")
  }

  let clients: Client[] = []
  
  try {
    const supabaseAdmin = await createAdminClient()

    // Fetch clients with elevated access after the admin check above.
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, first_name, last_name, company_name, created_at')
      .order('created_at', { ascending: false }) as { data: Client[] | null, error: any };

    if (error) throw error
    clients = data || []
  } catch (error) {
    console.error('Error fetching clients:', error)
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Clients</CardTitle>
          <CardDescription>
            There was an error loading the clients list. Please check your database permissions.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clients</CardTitle>
        <CardDescription>
          {clients.length === 0 
            ? 'No clients found or you do not have permission to view them.'
            : 'List of registered clients with details.'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Full Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Joined Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients?.map((client) => (
              <TableRow key={client.id}>
                <TableCell>{(client.first_name || '') + ' ' + (client.last_name || '')}</TableCell>
                <TableCell>{client.company_name || 'N/A'}</TableCell>
                <TableCell>{client.created_at ? format(new Date(client.created_at), 'PPP') : 'N/A'}</TableCell>
                <TableCell>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/clients/${client.id}/orders`}>View Client Orders</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
