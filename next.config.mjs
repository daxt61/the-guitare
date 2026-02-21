/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optionnel : permet d'optimiser le déploiement sur Vercel
  reactStrictMode: true,
  // Si tu utilises des images externes (ex: avatars), configure les domaines ici
  images: {
    domains: [],
  },
};

export default nextConfig;
