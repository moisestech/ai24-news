/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'placehold.co',
      'jxjvweexayixwcchoebb.supabase.co', // your Supabase domain
      'localhost',
      'via.placeholder.com' // Add this for placeholder images
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // ... other config
}

module.exports = nextConfig 