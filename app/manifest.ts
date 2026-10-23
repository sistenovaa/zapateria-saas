import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Siste Nova Calzado',
    short_name: 'Siste Nova',
    description: 'Sistema de gestión para zapaterías',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#10b981', // El verde esmeralda de tu SaaS
    icons: [
      {
        src: '/icon-192.png', // 👈 Debes tener este ícono en public/
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png', // 👈 Debes tener este ícono en public/
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}