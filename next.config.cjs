/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['notncpmpmgostfxesrvk.supabase.co'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'notncpmpmgostfxesrvk.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },

  env: { // Re-adding the env block
    // Publicly exposed variables (NEXT_PUBLIC_ prefix)
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_PAYPAL_CLIENT_ID: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_GTM_ID: process.env.NEXT_PUBLIC_GTM_ID,

    // Server-side only variables (no NEXT_PUBLIC_ prefix)
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID,
    PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET,
    POSTMARK_API_TOKEN: process.env.POSTMARK_API_TOKEN,
    POSTMARK_FROM: process.env.POSTMARK_FROM,
    POSTMARK_TO: process.env.POSTMARK_TO,
    TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
    VONAGE_API_KEY: process.env.VONAGE_API_KEY,
    VONAGE_API_SECRET: process.env.VONAGE_API_SECRET,
    VONAGE_APPLICATION_ID: process.env.VONAGE_APPLICATION_ID,
    VONAGE_PRIVATE_KEY: process.env.VONAGE_PRIVATE_KEY,
    VONAGE_WHATSAPP_NUMBER: process.env.VONAGE_WHATSAPP_NUMBER,
    VONAGE_ADMIN_WHATSAPP: process.env.VONAGE_ADMIN_WHATSAPP,
    DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL,
    CRON_SECRET_TOKEN: process.env.CRON_SECRET_TOKEN,
  },

  experimental: {
    serverComponentsExternalPackages: [
      '@vonage/server-sdk',
    ],
  },
}

module.exports = nextConfig
