"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { createAdminClient, createSupabaseServerClientComponent } from "@/lib/supabase/server";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/supabase";
import {
  formatProfileLabel,
  getCouponStatus,
  normalizeCouponCode,
  type AdminCouponListItem,
  type AssignableProfile,
  type BulkCouponInput,
  type CouponFormInput,
} from "@/lib/admin/coupons";

type AdminSupabaseClient = Awaited<ReturnType<typeof createAdminClient>>;

const PROFILE_SELECT = "id, first_name, last_name, company_name, email, created_at, is_admin";
const COUPON_SELECT = "id, code, discount_type, discount_value, assigned_user_id, expires_at, is_active, is_applied, created_at";
const CODE_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function revalidateAdminCouponPaths() {
  revalidatePath("/admin/coupons");
}

function generateRandomCode(length = 10) {
  const bytes = randomBytes(length);
  let code = "";

  for (let index = 0; index < length; index += 1) {
    code += CODE_CHARSET[bytes[index] % CODE_CHARSET.length];
  }

  return code;
}

function normalizeExpiresAt(value?: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function validateCouponInput(input: Pick<CouponFormInput, "code" | "discount_type" | "discount_value">) {
  if (!normalizeCouponCode(input.code)) {
    return "Coupon code is required";
  }

  if (!["percent", "fixed"].includes(input.discount_type)) {
    return "Invalid discount type";
  }

  if (!Number.isFinite(input.discount_value) || input.discount_value < 0) {
    return "Discount value must be 0 or greater";
  }

  if (input.discount_type === "percent" && input.discount_value > 100) {
    return "Percentage discount cannot exceed 100";
  }

  return null;
}

function buildCouponPayload(input: CouponFormInput): TablesInsert<"coupons"> {
  return {
    code: normalizeCouponCode(input.code),
    discount_type: input.discount_type,
    discount_value: input.discount_value,
    assigned_user_id: input.assigned_user_id ?? null,
    expires_at: normalizeExpiresAt(input.expires_at),
    is_active: input.is_active,
    is_applied: input.is_applied,
  };
}

async function getExistingCodes(supabaseAdmin: AdminSupabaseClient, codes: string[]) {
  if (codes.length === 0) {
    return new Set<string>();
  }

  const { data, error } = await supabaseAdmin
    .from("coupons")
    .select("code")
    .in("code", codes);

  if (error) {
    throw new Error(error.message);
  }

  return new Set((data ?? []).map((coupon) => coupon.code));
}

async function generateUniqueCouponCodes(supabaseAdmin: AdminSupabaseClient, count: number) {
  const codes = new Set<string>();
  let attempts = 0;

  while (codes.size < count) {
    codes.add(generateRandomCode());
    attempts += 1;

    if (attempts > count * 20) {
      throw new Error("Unable to generate enough unique coupon codes");
    }
  }

  let existingCodes = await getExistingCodes(supabaseAdmin, Array.from(codes));
  let conflictPasses = 0;

  while (existingCodes.size > 0) {
    for (const code of Array.from(existingCodes)) {
      codes.delete(code);
    }

    while (codes.size < count) {
      codes.add(generateRandomCode());
    }

    existingCodes = await getExistingCodes(supabaseAdmin, Array.from(codes));
    conflictPasses += 1;

    if (conflictPasses > 10) {
      throw new Error("Unable to resolve coupon code collisions");
    }
  }

  return Array.from(codes);
}

export async function getAdminCouponsClient() {
  const supabase = await createSupabaseServerClientComponent();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { supabaseAdmin: null, error: "User not authenticated" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.is_admin) {
    return { supabaseAdmin: null, error: "Unauthorized: Admin access required" };
  }

  return { supabaseAdmin: await createAdminClient(), error: null };
}

export async function fetchAssignableProfiles() {
  const { supabaseAdmin, error: adminError } = await getAdminCouponsClient();

  if (adminError || !supabaseAdmin) {
    return { data: null, error: adminError || "Unauthorized" };
  }

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select(PROFILE_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: (data ?? []) as AssignableProfile[], error: null };
}

export async function listCouponsForAdmin() {
  const { supabaseAdmin, error: adminError } = await getAdminCouponsClient();

  if (adminError || !supabaseAdmin) {
    return { data: null, error: adminError || "Unauthorized" };
  }

  const { data: coupons, error: couponError } = await supabaseAdmin
    .from("coupons")
    .select(COUPON_SELECT)
    .order("created_at", { ascending: false });

  if (couponError) {
    return { data: null, error: couponError.message };
  }

  const assignedUserIds = Array.from(
    new Set((coupons ?? []).map((coupon) => coupon.assigned_user_id).filter(Boolean))
  ) as string[];
  let profileMap = new Map<string, AssignableProfile>();

  if (assignedUserIds.length > 0) {
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select(PROFILE_SELECT)
      .in("id", assignedUserIds);

    if (profileError) {
      return { data: null, error: profileError.message };
    }

    profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile as AssignableProfile]));
  }

  const items: AdminCouponListItem[] = (coupons ?? []).map((coupon) => {
    const assignedProfile = coupon.assigned_user_id ? profileMap.get(coupon.assigned_user_id) ?? null : null;

    return {
      ...(coupon as Tables<"coupons">),
      assigned_profile: assignedProfile,
      assigned_to_label: coupon.assigned_user_id
        ? formatProfileLabel(assignedProfile, coupon.assigned_user_id)
        : "Public",
      status: getCouponStatus(coupon),
    };
  });

  return { data: items, error: null };
}

export async function generateCouponCode() {
  const { supabaseAdmin, error: adminError } = await getAdminCouponsClient();

  if (adminError || !supabaseAdmin) {
    return { data: null, error: adminError || "Unauthorized" };
  }

  try {
    const [code] = await generateUniqueCouponCodes(supabaseAdmin, 1);
    return { data: code, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to generate a coupon code",
    };
  }
}

export async function createCoupon(input: CouponFormInput) {
  const validationError = validateCouponInput(input);
  if (validationError) {
    return { error: validationError };
  }

  const { supabaseAdmin, error: adminError } = await getAdminCouponsClient();
  if (adminError || !supabaseAdmin) {
    return { error: adminError || "Unauthorized" };
  }

  const payload = buildCouponPayload(input);
  const { error } = await supabaseAdmin.from("coupons").insert(payload);

  if (error) {
    return { error: error.message };
  }

  revalidateAdminCouponPaths();
  return { error: null };
}

export async function updateCoupon(id: string, input: CouponFormInput) {
  const validationError = validateCouponInput(input);
  if (validationError) {
    return { error: validationError };
  }

  const { supabaseAdmin, error: adminError } = await getAdminCouponsClient();
  if (adminError || !supabaseAdmin) {
    return { error: adminError || "Unauthorized" };
  }

  const payload: TablesUpdate<"coupons"> = buildCouponPayload(input);
  const { error } = await supabaseAdmin.from("coupons").update(payload).eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidateAdminCouponPaths();
  return { error: null };
}

export async function deleteCoupon(id: string) {
  const { supabaseAdmin, error: adminError } = await getAdminCouponsClient();
  if (adminError || !supabaseAdmin) {
    return { error: adminError || "Unauthorized" };
  }

  const { error } = await supabaseAdmin.from("coupons").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidateAdminCouponPaths();
  return { error: null };
}

export async function bulkGenerateCoupons(input: BulkCouponInput) {
  if (!Number.isInteger(input.count) || input.count < 1 || input.count > 100) {
    return { data: null, error: "Coupon count must be between 1 and 100" };
  }

  const validationError = validateCouponInput({
    code: "TEMP-CODE",
    discount_type: input.discount_type,
    discount_value: input.discount_value,
  });

  if (validationError) {
    return { data: null, error: validationError.replace("Coupon code is required", "Discount settings are invalid") };
  }

  const { supabaseAdmin, error: adminError } = await getAdminCouponsClient();
  if (adminError || !supabaseAdmin) {
    return { data: null, error: adminError || "Unauthorized" };
  }

  try {
    const codes = await generateUniqueCouponCodes(supabaseAdmin, input.count);
    const payload: TablesInsert<"coupons">[] = codes.map((code) => ({
      code,
      discount_type: input.discount_type,
      discount_value: input.discount_value,
      assigned_user_id: input.assigned_user_id ?? null,
      expires_at: normalizeExpiresAt(input.expires_at),
      is_active: input.is_active,
      is_applied: false,
    }));

    const { data, error } = await supabaseAdmin
      .from("coupons")
      .insert(payload)
      .select(COUPON_SELECT)
      .order("created_at", { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    revalidateAdminCouponPaths();
    return { data: (data ?? []) as Tables<"coupons">[], error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to generate coupons",
    };
  }
}
