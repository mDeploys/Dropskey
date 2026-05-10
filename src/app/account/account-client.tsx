"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/context/session-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardTitle, CardHeader } from "@/components/ui/card"
import Link from "next/link"
import { ProfileForm } from "@/components/profile-form"
import { getCurrentUserProfile } from "@/app/account/actions"
import { Loader2, User, ShoppingBag, Shield, LogOut, Mail, Calendar, CheckCircle2, AlertCircle } from "lucide-react"
import { z } from "zod"
import { Tables } from "@/types/supabase"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { format } from "date-fns"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import MD5 from "crypto-js/md5"
import { Session } from "@supabase/supabase-js"

type Profile = Tables<'profiles'>;

const getGravatarUrl = (email: string, size: number = 200): string => {
  const trimmedEmail = email.trim().toLowerCase();
  const emailHash = MD5(trimmedEmail).toString();
  return `https://www.gravatar.com/avatar/${emailHash}?s=${size}&d=identicon`;
};

const profileSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required"),
  last_name: z.string().trim().min(1, "Last name is required"),
  company_name: z.string().optional(),
  vat_number: z.string().optional(),
  address_line_1: z.string().trim().min(1, "Address is required"),
  address_line_2: z.string().optional(),
  city: z.string().trim().min(1, "City is required"),
  state_province_region: z.string().trim().min(1, "State/Province/Region is required"),
  postal_code: z.string().trim().min(1, "Postal code is required"),
  country: z.string().trim().length(2, "Country is required"),
});

const calculateProfileCompletion = (profile: Profile | null): number => {
  if (!profile) return 0;
  const requiredFields = [
    'first_name', 'last_name', 'address_line_1',
    'city', 'state_province_region', 'postal_code', 'country'
  ];
  const filledFields = requiredFields.filter(field => {
    const value = profile[field as keyof Profile];
    return value && String(value).trim().length > 0;
  });
  return Math.round((filledFields.length / requiredFields.length) * 100);
};

interface AccountClientProps {
  initialSession: Session | null;
  initialProfile: Profile | null;
}

export function AccountClient({ initialSession, initialProfile }: AccountClientProps) {
  const { supabase } = useSession()
  const router = useRouter()
  const [loadingSignOut, setLoadingSignOut] = useState(false)
  const [userProfile, setUserProfile] = useState<Profile | null>(initialProfile);

  // Use the session from props primarily to avoid client-side session loading delays
  const session = initialSession;
  const isAdmin = !!userProfile?.is_admin;

  const handleProfileUpdated = async () => {
    // Re-fetch profile on the client after an update
    const { data: profileData } = await getCurrentUserProfile();
    if (profileData) {
      setUserProfile(profileData);
    }
  };

  if (!session) {
    return (
      <div className="flex justify-center items-center py-12 px-4">
        <Card className="w-full max-w-md mx-auto">
          <CardTitle className="p-6 pb-2">Access Denied</CardTitle>
          <CardDescription className="px-6 pb-6">
            You must be signed in to view this page.
          </CardDescription>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Please sign in using the button in the header to access your account details.
            </p>
            <Button asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isProfileComplete = userProfile ? profileSchema.safeParse(userProfile).success : false;
  const profileCompletion = calculateProfileCompletion(userProfile);

  return (
    <div className="container mx-auto p-4 py-12 max-w-6xl">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-2 border-primary">
              <AvatarImage
                src={session?.user?.email ? getGravatarUrl(session.user.email, 200) : undefined}
                alt={session?.user?.email || 'User'}
              />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                {session?.user?.email?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">My Account</h1>
              <p className="text-muted-foreground mt-2">
                Welcome back, {userProfile?.first_name || session?.user?.email || 'User'}
              </p>
            </div>
          </div>
          {isAdmin && (
            <Badge variant="default" className="text-sm px-3 py-1">
              <Shield className="h-3 w-3 mr-1" />
              Admin
            </Badge>
          )}
        </div>

        {/* Profile Completion Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {profileCompletion === 100 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                )}
                <h3 className="font-semibold">Profile Completion</h3>
              </div>
              <span className="text-2xl font-bold">{profileCompletion}%</span>
            </div>
            <Progress value={profileCompletion} className="h-2 mb-2" />
            <p className="text-sm text-muted-foreground">
              {profileCompletion === 100
                ? "Your profile is complete! You're all set to make purchases."
                : "Complete your profile to proceed with purchases and enjoy a better experience."}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Info & Quick Actions */}
        <div className="space-y-6">
          {/* Account Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Gravatar Section */}
              <div className="flex flex-col items-center pb-4 border-b">
                <Avatar className="h-24 w-24 border-2 border-primary/20">
                  <AvatarImage
                    src={session?.user?.email ? getGravatarUrl(session.user.email, 200) : undefined}
                    alt={session?.user?.email || 'User'}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary text-3xl font-semibold">
                    {session?.user?.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Profile picture from{" "}
                  <a
                    href="https://gravatar.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Gravatar
                  </a>
                </p>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
                </div>
              </div>

              {userProfile?.created_at && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
                  <div className="flex-1">
                     <p className="text-sm font-medium">Member Since</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(userProfile.created_at), 'MMMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Shield className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Account Type</p>
                  <p className="text-sm text-muted-foreground">
                    {isAdmin ? 'Administrator' : 'Customer'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full justify-start" size="lg">
                <Link href="/account/orders">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  View Order History
                </Link>
              </Button>

              {isAdmin && (
                <Button asChild variant="outline" className="w-full justify-start" size="lg">
                  <Link href="/admin">
                    <Shield className="h-4 w-4 mr-2" />
                    Admin Panel
                  </Link>
                </Button>
              )}

              <Separator className="my-4" />

              <Button
                variant="destructive"
                className="w-full justify-start"
                size="lg"
                onClick={async () => {
                  if (!supabase) return;
                  setLoadingSignOut(true);
                  try {
                    await supabase.auth.signOut();
                    router.push('/');
                    router.refresh();
                  } catch (error) {
                    console.error('Error signing out:', error);
                  } finally {
                    setLoadingSignOut(false);
                  }
                }}
                disabled={loadingSignOut}
              >
                {loadingSignOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4 mr-2" />}
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Profile Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
              <CardDescription>
                Update your personal information and billing address
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isProfileComplete && (
                <div className="bg-orange-50 dark:bg-orange-950/20 border-l-4 border-orange-500 text-orange-900 dark:text-orange-200 p-4 mb-6" role="alert">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Profile Incomplete</p>
                      <p className="text-sm mt-1">Please complete all required fields below to proceed with purchases.</p>
                    </div>
                  </div>
                </div>
              )}

              {userProfile && (
                <ProfileForm
                  key={userProfile.id}
                  initialProfile={userProfile}
                  onProfileUpdated={handleProfileUpdated}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
