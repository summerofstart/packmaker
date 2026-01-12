/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/packmaker', // Uncommented for subpath deployment
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
