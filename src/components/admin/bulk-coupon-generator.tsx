"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { bulkGenerateCoupons, fetchAssignableProfiles } from "@/app/admin/coupons/actions";
import { formatProfileLabel, toDateTimeLocalValue, type AssignableProfile } from "@/lib/admin/coupons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const bulkCouponSchema = z
  .object({
    count: z.coerce.number().int().min(1, "Generate at least one coupon").max(100, "Maximum 100 coupons"),
    discount_type: z.enum(["percent", "fixed"]),
    discount_value: z.coerce.number().min(0, "Discount value must be 0 or greater"),
    assigned_user_id: z.string().default("public"),
    expires_at: z.string().optional(),
    is_active: z.boolean().default(true),
  })
  .superRefine((values, context) => {
    if (values.discount_type === "percent" && values.discount_value > 100) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["discount_value"],
        message: "Percentage discount cannot exceed 100",
      });
    }
  });

type BulkCouponValues = z.infer<typeof bulkCouponSchema>;

function downloadCsv(rows: Array<{
  code: string;
  discount_type: string;
  discount_value: number;
  assigned_user_id: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string | null;
}>) {
  const escapeCell = (value: string | number | boolean | null) => {
    const normalized = value == null ? "" : String(value);
    return `"${normalized.replace(/"/g, '""')}"`;
  };

  const csvLines = [
    ["code", "discount_type", "discount_value", "assigned_user_id", "expires_at", "is_active", "created_at"].join(","),
    ...rows.map((row) =>
      [
        row.code,
        row.discount_type,
        row.discount_value,
        row.assigned_user_id,
        row.expires_at,
        row.is_active,
        row.created_at,
      ]
        .map(escapeCell)
        .join(",")
    ),
  ];

  const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const timestamp = toDateTimeLocalValue(new Date().toISOString()).replace(/[:T]/g, "-") || Date.now().toString();

  link.href = url;
  link.download = `coupons-${timestamp}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function BulkCouponGenerator() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<AssignableProfile[]>([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentDiscountType = useForm<BulkCouponValues>({
    resolver: zodResolver(bulkCouponSchema),
    defaultValues: {
      count: 10,
      discount_type: "percent",
      discount_value: 10,
      assigned_user_id: "public",
      expires_at: "",
      is_active: true,
    },
  });
  const form = currentDiscountType;
  const watchedDiscountType = form.watch("discount_type", "percent");

  useEffect(() => {
    const loadProfiles = async () => {
      setIsLoadingProfiles(true);

      const { data, error } = await fetchAssignableProfiles();
      if (error) {
        toast.error(error);
        setIsLoadingProfiles(false);
        return;
      }

      setProfiles(data ?? []);
      setIsLoadingProfiles(false);
    };

    void loadProfiles();
  }, []);

  const onSubmit = async (values: BulkCouponValues) => {
    setIsSubmitting(true);
    const toastId = toast.loading("Generating coupons...");

    try {
      const result = await bulkGenerateCoupons({
        count: values.count,
        discount_type: values.discount_type,
        discount_value: values.discount_value,
        assigned_user_id: values.assigned_user_id === "public" ? null : values.assigned_user_id,
        expires_at: values.expires_at ? new Date(values.expires_at).toISOString() : null,
        is_active: values.is_active,
      });

      if (result.error || !result.data) {
        throw new Error(result.error || "Failed to generate coupons.");
      }

      downloadCsv(result.data);
      toast.success(`${result.data.length} coupon${result.data.length === 1 ? "" : "s"} generated.`, { id: toastId });
      form.reset({
        count: 10,
        discount_type: values.discount_type,
        discount_value: values.discount_value,
        assigned_user_id: values.assigned_user_id,
        expires_at: values.expires_at,
        is_active: values.is_active,
      });
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate coupons.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="text-xl">Bulk Generate</CardTitle>
        <CardDescription>
          Create multiple public or client-assigned coupon codes and download them as CSV immediately.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Codes</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" max="100" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="discount_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="percent">Percentage</SelectItem>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discount_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{watchedDiscountType === "fixed" ? "Fixed Amount" : "Discount Percentage"}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max={watchedDiscountType === "percent" ? "100" : undefined}
                        step={watchedDiscountType === "fixed" ? "0.01" : "1"}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {watchedDiscountType === "fixed" ? "Example: 10.00" : "Use a value between 0 and 100"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="assigned_user_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign to User</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Public (Any user)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="public">Public (Any user)</SelectItem>
                      {isLoadingProfiles ? (
                        <SelectItem value="loading" disabled>
                          Loading clients...
                        </SelectItem>
                      ) : profiles.length > 0 ? (
                        profiles.map((profile) => (
                          <SelectItem key={profile.id} value={profile.id}>
                            {formatProfileLabel(profile, profile.id)}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="empty" disabled>
                          No clients available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>Leave this public for general coupons or target one client for all generated codes.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expires_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expiry Date</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" value={field.value ?? ""} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(Boolean(checked))} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Active</FormLabel>
                    <FormDescription>Disable this if the generated coupons should be stored but not treated as active.</FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Generating..." : "Generate Coupons"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
