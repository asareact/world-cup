/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Allow Supabase storage public URLs like:
    // https://<project>.supabase.co/storage/v1/object/public/<bucket>/...
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
}

module.exports = nextConfig

