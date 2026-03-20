"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createCoupon, updateCoupon, deleteCoupon, fetchUsersForAssignment } from "@/app/admin/coupons/actions"
import { Tables } from "@/types/supabase" // Import Tables type

interface CouponFormProps {
  coupon?: {
    id: string;
    code: string;
    discount_percent: number;
    assigned_user_id: string | null;
    is_applied: boolean | null; // Changed to boolean | null
    profiles?: Pick<Tables<'profiles'>, 'first_name' | 'last_name'> | null; // Explicitly type profiles
  };
}

const couponSchema = z.object({
  code: z.string().min(1, "Coupon code is required"),
  discount_percent: z.preprocess(
    (val) => Number(val),
    z.number().min(0, "Discount must be at least 0").max(100, "Discount cannot exceed 100")
  ),
  assigned_user_id: z.string().nullable().optional(),
  is_applied: z.boolean().default(false),
})

type CouponFormValues = z.infer<typeof couponSchema>

export function CouponForm({ coupon }: CouponFormProps): JSX.Element {
  const router = useRouter()
  const [isOpen, setOpen] = useState(false)
  const [users, setUsers] = useState<{ id: string; first_name: string | null; last_name: string | null; email: string | null }[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  const form = useForm<CouponFormValues>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: coupon?.code || "",
      discount_percent: coupon?.discount_percent || 0,
      assigned_user_id: coupon?.assigned_user_id || null,
      is_applied: coupon?.is_applied ?? false, // Use nullish coalescing to default null to false
    },
  })

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsLoadingUsers(true);
        const { data, error } = await fetchUsersForAssignment();

        if (error) throw error;
        
        setUsers(data || []);
      } catch (error) {
        console.error('Error loading users:', error);
        toast.error('Failed to load users');
      } finally {
        setIsLoadingUsers(false);
      }
    };

    if (isOpen) loadUsers();
  }, [isOpen]);

  const onSubmit = async (values: CouponFormValues) => {
    console.log("CouponForm onSubmit triggered with values:", values); // New client-side log
    const toastId = toast.loading(coupon ? "Updating coupon..." : "Creating coupon...")
    try {
      let result;
      // Ensure assigned_user_id is null if "public" is selected
      const dataToSubmit = {
        ...values,
        assigned_user_id: values.assigned_user_id === "public" ? null : values.assigned_user_id,
      };

      if (coupon) {
        result = await updateCoupon(coupon.id, dataToSubmit)
      } else {
        result = await createCoupon(dataToSubmit)
      }

      if (result.error) {
        throw new Error(result.error)
      }

      toast.success(`Coupon ${coupon ? "updated" : "created"} successfully!`, { id: toastId })
      setOpen(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "An unexpected error occurred.", { id: toastId })
    }
  }

  const handleDelete = async () => {
    if (coupon) {
      const toastId = toast.loading("Deleting coupon...")
      try {
        const result = await deleteCoupon(coupon.id)
        if (result.error) {
          throw new Error(result.error)
        }
        toast.success("Coupon deleted successfully!", { id: toastId })
        setOpen(false)
        router.refresh()
      } catch (error: any) {
        toast.error(error.message || "Failed to delete coupon.", { id: toastId })
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={coupon ? "outline" : "default"}>
          {coupon ? "Edit" : "Add Coupon"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{coupon ? "Edit Coupon" : "Add New Coupon"}</DialogTitle>
          <DialogDescription>
            {coupon ? "Edit the details of this coupon." : "Fill in the details to add a new coupon."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coupon Code</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="discount_percent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discount Percentage (%)</FormLabel>
                  <FormControl><Input type="number" step="1" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="assigned_user_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign to User (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value === null ? "public" : field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a user or leave public" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="public">Public (Any user)</SelectItem>
                      {isLoadingUsers ? (
                        <SelectItem value="loading" disabled>Loading users...</SelectItem>
                      ) : users.length === 0 ? (
                        <SelectItem value="no-users" disabled>No clients available</SelectItem>
                      ) : (
                        users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {(() => {
                              const displayName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim()
                              if (displayName && user.email) return `${displayName} (${user.email})`
                              return displayName || user.email || `User ${user.id.slice(0, 8)}`
                            })()}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    If a user is selected, only they can use this coupon. Otherwise, it's public.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="is_applied"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Mark as Applied
                    </FormLabel>
                    <FormDescription>
                      Check this if the coupon has already been used.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter className="pt-8">
              {coupon && (
                <Button type="button" variant="destructive" onClick={handleDelete}>
                  Delete
                </Button>
              )}
              <DialogClose asChild>
                <Button type="button" variant="secondary">Cancel</Button>
              </DialogClose>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
