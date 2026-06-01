export const siteConfig = {
  name: "Dropskey",
  url: "https://dropskey.com",
  description:
    "Buy genuine software licenses, digital keys, antivirus, Microsoft Windows, Office, Adobe, Autodesk, and Kaspersky products from Dropskey.",
  phoneNumbers: ["+1 (310) 777 8808", "+1 (310) 888 7708"],
  supportEmail: "support@dropskey.com",
}

export function getSiteUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.SITE_URL?.trim()

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "")
  }

  return siteConfig.url
}
