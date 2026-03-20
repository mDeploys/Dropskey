import type { Tables } from "@/types/supabase";

export type CouponDiscountType = "percent" | "fixed";
export type CouponStatus = "Applied" | "Inactive" | "Expired" | "Active";

export type AssignableProfile = Pick<
  Tables<"profiles">,
  "id" | "first_name" | "last_name" | "company_name" | "email" | "created_at" | "is_admin"
>;

export type AdminCouponRecord = Pick<
  Tables<"coupons">,
  | "id"
  | "code"
  | "discount_type"
  | "discount_value"
  | "assigned_user_id"
  | "expires_at"
  | "is_active"
  | "is_applied"
  | "created_at"
>;

export interface CouponFormInput {
  code: string;
  discount_type: CouponDiscountType;
  discount_value: number;
  assigned_user_id?: string | null;
  expires_at?: string | null;
  is_active: boolean;
  is_applied: boolean;
}

export interface BulkCouponInput {
  count: number;
  discount_type: CouponDiscountType;
  discount_value: number;
  assigned_user_id?: string | null;
  expires_at?: string | null;
  is_active: boolean;
}

export interface AdminCouponListItem extends AdminCouponRecord {
  assigned_profile: AssignableProfile | null;
  assigned_to_label: string;
  status: CouponStatus;
}

export function normalizeCouponCode(code: string) {
  return code.trim().replace(/\s+/g, "-").toUpperCase();
}

export function formatProfileLabel(profile: Partial<AssignableProfile> | null | undefined, fallbackId?: string | null) {
  const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim();
  const email = profile?.email?.trim() || null;

  if (displayName && email) {
    return `${displayName} (${email})`;
  }

  if (displayName) {
    return displayName;
  }

  if (email) {
    return email;
  }

  if (fallbackId) {
    return `Unknown user (${fallbackId.slice(0, 8)})`;
  }

  return "Public";
}

export function formatDiscountLabel(coupon: Pick<AdminCouponRecord, "discount_type" | "discount_value">) {
  if (coupon.discount_type === "fixed") {
    return `$${coupon.discount_value.toFixed(2)}`;
  }

  return `${coupon.discount_value}%`;
}

export function getCouponStatus(
  coupon: Pick<AdminCouponRecord, "is_applied" | "is_active" | "expires_at">
): CouponStatus {
  if (coupon.is_applied) {
    return "Applied";
  }

  if (!coupon.is_active) {
    return "Inactive";
  }

  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()) {
    return "Expired";
  }

  return "Active";
}

export function toDateTimeLocalValue(value?: string | null) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const localDate = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}
