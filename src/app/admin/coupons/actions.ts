"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient, createSupabaseServerClientComponent } from '@/lib/supabase/server';

interface CouponData {
  code: string;
  discount_percent: number;
  assigned_user_id?: string | null;
  is_applied: boolean;
}

export async function createCoupon(formData: CouponData) {
  const supabase = await createSupabaseServerClientComponent();
  console.log("Attempting to create coupon with data:", formData); // Added log
  const { error } = await supabase.from("coupons").insert([formData]);
  if (error) {
    console.error("Error creating coupon:", error); // Added log
    return { error: error.message };
  }
  console.log("Coupon created successfully."); // Added log
  revalidatePath("/admin/coupons");
  return { error: null };
}

export async function updateCoupon(id: string, formData: CouponData) {
  const supabase = await createSupabaseServerClientComponent();
  console.log(`Attempting to update coupon ${id} with data:`, formData); // Added log
  const { error } = await supabase.from("coupons").update(formData).eq("id", id);
  if (error) {
    console.error(`Error updating coupon ${id}:`, error); // Added log
    return { error: error.message };
  }
  console.log(`Coupon ${id} updated successfully.`); // Added log
  revalidatePath("/admin/coupons");
  return { error: null };
}

export async function deleteCoupon(id: string) {
  const supabase = await createSupabaseServerClientComponent();
  console.log(`Attempting to delete coupon with ID: ${id}`); // Added log
  const { error } = await supabase.from("coupons").delete().eq("id", id);
  if (error) {
    console.error(`Error deleting coupon ${id}:`, error); // Added log
    return { error: error.message };
  }
  console.log(`Coupon ${id} deleted successfully.`); // Added log
  revalidatePath("/admin/coupons");
  return { error: null };
}

export async function fetchUsersForAssignment() {
  const supabase = await createSupabaseServerClientComponent();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "User not authenticated" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.is_admin) {
    return { data: null, error: "Unauthorized: Admin access required" };
  }

  const supabaseAdmin = await createAdminClient();
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, first_name, last_name, email, is_admin")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching users:", error);
    return { data: null, error: error.message };
  }

  return { data: data || [], error: null };
}
