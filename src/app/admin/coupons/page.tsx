import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CouponForm } from "@/components/admin/coupon-form"
import { createAdminClient } from "@/lib/supabase/server"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Tables } from "@/types/supabase" // Import Tables type

export const revalidate = 0 // Disable cache to always get fresh data

export default async function AdminCouponsPage() {
  const supabase = await createAdminClient()
  const { data: coupons, error } = await supabase
    .from("coupons")
    .select(`
      id,
      code,
      discount_percent,
      assigned_user_id,
      is_applied,
      created_at,
      profiles (first_name, last_name)
    `)
    .order("created_at", { ascending: false }) as { data: (Tables<'coupons'> & { profiles: Pick<Tables<'profiles'>, 'first_name' | 'last_name'> | null })[] | null, error: any }; // Explicitly type coupons

  if (error) {
    console.error("Error fetching coupons:", error)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Coupons</h1>
        <CouponForm />
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons?.map((coupon) => (
              <TableRow key={coupon.id}>
                <TableCell className="font-medium">{coupon.code}</TableCell>
                <TableCell>{coupon.discount_percent}%</TableCell>
                <TableCell>
                  {coupon.assigned_user_id
                    ? `${coupon.profiles?.first_name || ''} ${coupon.profiles?.last_name || ''} (${coupon.assigned_user_id.substring(0, 8)}...)`
                    : "Public"}
                </TableCell>
                <TableCell>
                  <Badge variant={coupon.is_applied ? "secondary" : "default"}>
                    {coupon.is_applied ? "Applied" : "Active"}
                  </Badge>
                </TableCell>
                <TableCell>{coupon.created_at ? format(new Date(coupon.created_at), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                <TableCell>
                  <CouponForm coupon={coupon} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
