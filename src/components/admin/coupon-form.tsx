"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createCoupon,
  deleteCoupon,
  fetchAssignableProfiles,
  generateCouponCode,
  updateCoupon,
} from "@/app/admin/coupons/actions";
import {
  formatProfileLabel,
  toDateTimeLocalValue,
  type AdminCouponListItem,
  type AssignableProfile,
} from "@/lib/admin/coupons";

interface CouponFormProps {
  coupon?: AdminCouponListItem;
}

const couponSchema = z
  .object({
    code: z.string().trim().min(1, "Coupon code is required"),
    discount_type: z.enum(["percent", "fixed"]),
    discount_value: z.coerce.number().min(0, "Discount value must be 0 or greater"),
    assigned_user_id: z.string().default("public"),
    expires_at: z.string().optional(),
    is_active: z.boolean().default(true),
    is_applied: z.boolean().default(false),
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

type CouponFormValues = z.infer<typeof couponSchema>;

function getDefaultValues(coupon?: AdminCouponListItem): CouponFormValues {
  return {
    code: coupon?.code ?? "",
    discount_type: coupon?.discount_type === "fixed" ? "fixed" : "percent",
    discount_value: coupon?.discount_value ?? 0,
    assigned_user_id: coupon?.assigned_user_id ?? "public",
    expires_at: toDateTimeLocalValue(coupon?.expires_at),
    is_active: coupon?.is_active ?? true,
    is_applied: coupon?.is_applied ?? false,
  };
}

export function CouponForm({ coupon }: CouponFormProps) {
  const router = useRouter();
  const [isOpen, setOpen] = useState(false);
  const [profiles, setProfiles] = useState<AssignableProfile[]>([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const discountType = coupon?.discount_type;

  const form = useForm<CouponFormValues>({
    resolver: zodResolver(couponSchema),
    defaultValues: getDefaultValues(coupon),
  });

  const currentDiscountType = form.watch("discount_type", discountType === "fixed" ? "fixed" : "percent");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    form.reset(getDefaultValues(coupon));

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
  }, [coupon, form, isOpen]);

  const onSubmit = async (values: CouponFormValues) => {
    const toastId = toast.loading(coupon ? "Updating coupon..." : "Creating coupon...");

    try {
      const payload = {
        code: values.code,
        discount_type: values.discount_type,
        discount_value: values.discount_value,
        assigned_user_id: values.assigned_user_id === "public" ? null : values.assigned_user_id,
        expires_at: values.expires_at ? new Date(values.expires_at).toISOString() : null,
        is_active: values.is_active,
        is_applied: values.is_applied,
      };

      const result = coupon ? await updateCoupon(coupon.id, payload) : await createCoupon(payload);

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success(`Coupon ${coupon ? "updated" : "created"} successfully.`, { id: toastId });
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save coupon.", { id: toastId });
    }
  };

  const handleDelete = async () => {
    if (!coupon) {
      return;
    }

    const toastId = toast.loading("Deleting coupon...");

    try {
      const result = await deleteCoupon(coupon.id);
      if (result.error) {
        throw new Error(result.error);
      }

      toast.success("Coupon deleted successfully.", { id: toastId });
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete coupon.", { id: toastId });
    }
  };

  const handleGenerateCode = async () => {
    setIsGeneratingCode(true);

    const result = await generateCouponCode();
    setIsGeneratingCode(false);

    if (result.error || !result.data) {
      toast.error(result.error || "Failed to generate a coupon code.");
      return;
    }

    form.setValue("code", result.data, { shouldDirty: true, shouldValidate: true });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={coupon ? "outline" : "default"}>{coupon ? "Edit" : "Add Coupon"}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{coupon ? "Edit Coupon" : "Add New Coupon"}</DialogTitle>
          <DialogDescription>
            {coupon
              ? "Update an existing coupon or client-specific discount."
              : "Create a public coupon or assign one directly to a client."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coupon Code</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input {...field} placeholder="SPRING-25" />
                    </FormControl>
                    <Button type="button" variant="secondary" onClick={handleGenerateCode} disabled={isGeneratingCode}>
                      {isGeneratingCode ? "Generating..." : "Generate Code"}
                    </Button>
                  </div>
                  <FormDescription>Manual codes are allowed. Generated codes stay unique against existing rows.</FormDescription>
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
                          <SelectValue placeholder="Choose discount type" />
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
                    <FormLabel>{currentDiscountType === "fixed" ? "Fixed Amount" : "Discount Percentage"}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max={currentDiscountType === "percent" ? "100" : undefined}
                        step={currentDiscountType === "fixed" ? "0.01" : "1"}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {currentDiscountType === "fixed"
                        ? "Use a currency amount, for example 10.00."
                        : "Use a percentage from 0 to 100."}
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
                        <SelectValue placeholder="Select a client or keep this public" />
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
                  <FormDescription>
                    Use Public for a general coupon, or assign this code to one specific profile.
                  </FormDescription>
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
                    <Input type="datetime-local" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormDescription>Leave empty to keep the coupon active until it is manually disabled or applied.</FormDescription>
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
                    <FormDescription>
                      Inactive coupons stay in the dashboard but cannot be treated as active discounts.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_applied"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(Boolean(checked))} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Mark as Applied</FormLabel>
                    <FormDescription>This is a manual override for coupons that are already used or consumed.</FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              {coupon ? (
                <Button type="button" variant="destructive" onClick={handleDelete}>
                  Delete
                </Button>
              ) : null}
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit">{coupon ? "Save Changes" : "Create Coupon"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
