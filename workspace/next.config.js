
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", // Important for Firebase App Hosting and optimal deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.kwcdn.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com', // For Firebase Storage
        port: '',
        pathname: '/**',
      }
    ],
  },
};

module.exports = nextConfig;
