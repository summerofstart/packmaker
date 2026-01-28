const isProd = process.env.NODE_ENV === 'production';
const isVercel = process.env.VERCEL === '1';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: isVercel ? undefined : 'export',
  basePath: (isProd && !isVercel) ? '/packmaker' : '', // Use subpath only in production (likely for GitHub Pages)
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
