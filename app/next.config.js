module.exports = {
  reactStrictMode: true,
  i18n: {
    locales: ['en-US'],
    defaultLocale: 'en-US',
  },
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    // Ignore imports of "fs" when called from front-end files
    config.resolve.fallback = { fs: false };
    return config;
  },
};
