import { format } from "date-fns";
import { CouponForm } from "@/components/admin/coupon-form";
import { BulkCouponGenerator } from "@/components/admin/bulk-coupon-generator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listCouponsForAdmin } from "./actions";
import { formatDiscountLabel } from "@/lib/admin/coupons";

export const revalidate = 0;

function getBadgeVariant(status: "Applied" | "Inactive" | "Expired" | "Active") {
  if (status === "Applied") {
    return "secondary" as const;
  }

  if (status === "Inactive" || status === "Expired") {
    return "outline" as const;
  }

  return "default" as const;
}

export default async function AdminCouponsPage() {
  const { data: coupons, error } = await listCouponsForAdmin();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Coupons</h1>
          <p className="text-sm text-muted-foreground">
            Create, assign, and bulk-generate coupon discounts from one place.
          </p>
        </div>
        <CouponForm />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">All Coupons</CardTitle>
            <CardDescription>
              {error
                ? "The coupon table could not be loaded."
                : coupons && coupons.length > 0
                  ? "Every coupon row stored in Supabase, including client-assigned discounts."
                  : "No coupons have been created yet."}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {error ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {error}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires At</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons && coupons.length > 0 ? (
                    coupons.map((coupon) => (
                      <TableRow key={coupon.id}>
                        <TableCell className="font-medium">{coupon.code}</TableCell>
                        <TableCell>{formatDiscountLabel(coupon)}</TableCell>
                        <TableCell>{coupon.assigned_to_label}</TableCell>
                        <TableCell>
                          <Badge variant={getBadgeVariant(coupon.status)}>{coupon.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {coupon.expires_at ? format(new Date(coupon.expires_at), "PPP p") : "No expiry"}
                        </TableCell>
                        <TableCell>
                          {coupon.created_at ? format(new Date(coupon.created_at), "PPP") : "N/A"}
                        </TableCell>
                        <TableCell>
                          <CouponForm coupon={coupon} />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                        No coupons found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <BulkCouponGenerator />
      </div>
    </div>
  );
}
