/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/uploads/**",
      },
    ],
  },

  /**
   * Stabilise the webpack watcher in development.
   *
   * Without these settings, rapid file saves can cause webpack to start
   * a new compile before the previous chunk is fully written to disk.
   * The browser then requests the stale URL and times out → ChunkLoadError.
   *
   * poll: 1000          — fall back to polling if native FS events miss a change
   * aggregateTimeout: 300 — batch rapid saves into one rebuild instead of many
   */
  webpack(config, { dev }) {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

export default nextConfig;
