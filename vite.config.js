import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import basicSsl from '@vitejs/plugin-basic-ssl';

// https://vite.dev/config/
export default defineConfig({
  base: './',
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
  plugins: [
    react(),
    basicSsl(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
      },
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png', 'screenshot-mobile.png', 'screenshot-desktop.png'],
      manifest: {
        id: 'https://erfanjll.github.io/dokkan-pos/',
        name: 'دکان | نرم‌افزار حسابداری و انبارداری پوشاک',
        short_name: 'دکان',
        description: 'نرم‌افزار صندوق، حسابداری و انبارداری کاملاً آفلاین دکان ویژه موبایل و تبلت',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        display_override: ['standalone', 'window-controls-overlay', 'minimal-ui'],
        orientation: 'any',
        dir: 'rtl',
        lang: 'fa',
        start_url: './',
        scope: './',
        categories: ['business', 'finance', 'productivity', 'utilities'],
        prefer_related_applications: false,
        shortcuts: [
          {
            name: 'فاکتور جدید',
            short_name: 'فاکتور',
            description: 'ثبت و صدور فاکتور جدید',
            url: './',
            icons: [{ src: 'icon-192.png', sizes: '192x192' }]
          },
          {
            name: 'انبار و کالاها',
            short_name: 'انبار',
            description: 'مشاهده موجودی انبار کالا',
            url: './',
            icons: [{ src: 'icon-192.png', sizes: '192x192' }]
          }
        ],
        screenshots: [
          {
            src: 'screenshot-mobile.png',
            sizes: '540x960',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'نمای موبایل دکان'
          },
          {
            src: 'screenshot-desktop.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
            label: 'نمای تبلت و دسکتاپ دکان'
          }
        ],
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true
      }
    })
  ]
});
