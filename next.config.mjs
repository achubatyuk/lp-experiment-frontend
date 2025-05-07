/** @type {import('next').NextConfig} */
const nextConfig = {
  // async rewrites() {
  //   return [
  //     {
  //       // Proxy requests starting with /api/ to the backend server
  //       source: '/api/:path*', // Match any path starting with /api/
  //       destination: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/:path*`, // Use env var for backend URL
  //     },
  //     {
  //       // Specific rewrite for the Google login trigger path
  //       source: '/auth/login/google',
  //       destination: `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/login/google`,
  //     },
  //   ];
  // },
};

export default nextConfig;
