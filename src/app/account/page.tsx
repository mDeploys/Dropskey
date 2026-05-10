import { getSession } from "@/lib/supabase/server"
import { getCurrentUserProfile } from "@/app/account/actions"
import { AccountClient } from "./account-client"
import { redirect } from "next/navigation"

export const metadata = {
  title: "My Account | Dropskey",
  description: "Manage your account and profile.",
}

export default async function AccountPage() {
  const session = await getSession();
  
  if (!session) {
    redirect("/login");
  }

  const { data: profile } = await getCurrentUserProfile();

  return (
    <AccountClient initialSession={session} initialProfile={profile} />
  )
}