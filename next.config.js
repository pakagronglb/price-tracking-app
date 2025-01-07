/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
    serverComponentsExternalPackages: ['mongoose']
  },
  images: {
    domains: ['m.media-amazon.com']
  },
  functions: {
    maxDuration: 60
  }
}

module.exports = nextConfig
