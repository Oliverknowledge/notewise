// @ts-check
 
/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
      serverActions: {
        bodySizeLimit: '50mb',
      }
    },
    images: {
      remotePatterns: [{
        protocol: "https",
        hostname: "images.unsplash.com"
      }]
    }
  }
   
  module.exports = nextConfig