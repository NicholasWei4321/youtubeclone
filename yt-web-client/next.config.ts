/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'storage.googleapis.com',
          pathname: '/prac-nc-yt-thumbnails/**',
        },
      ],
    },
  };
  
export default nextConfig;