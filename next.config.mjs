/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['react-leaflet-cluster', 'react-leaflet', '@react-leaflet/core'],
  experimental: {
    esmExternals: 'loose',
  },
};

export default nextConfig;
