import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    viewTransition: true,
  },
  turbopack: {},
  async redirects() {
    return [
      {
        source: '/projects',
        destination: '/properties/projects',
        permanent: true,
      },
    ]
  },
  // Serve iOS Universal Links + Android App Links verification files with
  // the right Content-Type so Apple / Google can verify domain ownership.
  // AASA ships without a file extension, so Next.js would otherwise default
  // to application/octet-stream and Apple rejects verification.
  async headers() {
    return [
      {
        source: '/.well-known/apple-app-site-association',
        headers: [{ key: 'Content-Type', value: 'application/json' }],
      },
      {
        source: '/.well-known/assetlinks.json',
        headers: [{ key: 'Content-Type', value: 'application/json' }],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'qjesattjnuoogqgiorws.supabase.co',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: true,
  webpack: (config) => {
    // Required for react-pdf
    config.resolve.alias.canvas = false;
    // pdfjs-dist ships .mjs files that webpack must treat as plain JS modules
    // otherwise it throws "Object.defineProperty called on non-object"
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
    });
    return config;
  },
};

export default nextConfig;
