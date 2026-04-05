import { resolve, dirname } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import IconsResolver from 'unplugin-icons/resolver'
import { PrimeVueResolver } from 'unplugin-vue-components/resolvers'
import Icons from 'unplugin-icons/vite'
import Components from 'unplugin-vue-components/vite'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'
import 'dotenv/config'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const APP_ROOT = 'src/ui/setup/pages/SocialFlow'

// Web build — landing page + technology page + interactive demo
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('src', import.meta.url)),
      '~': fileURLToPath(new URL('src', import.meta.url)),
    },
  },

  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern',
      },
    },
  },

  plugins: [
    vue(),

    VueI18nPlugin({
      include: resolve(
        dirname(fileURLToPath(import.meta.url)),
        './src/locales/**',
      ),
      globalSFCScope: true,
      compositionOnly: true,
    }),

    AutoImport({
      imports: [
        'vue',
        'vue-router',
        '@vueuse/core',
        'pinia',
        {
          'vue-i18n': ['useI18n'],
        },
      ],
      dts: `${APP_ROOT}/types/auto-imports.d.ts`,
      dirs: ['src/composables/**', 'src/stores/**', 'src/utils/**'],
      vueTemplate: true,
    }),

    Components({
      dirs: ['src/components', `${APP_ROOT}/components`],
      dts: `${APP_ROOT}/types/components.d.ts`,
      resolvers: [IconsResolver(), PrimeVueResolver()],
      allowOverrides: true,
    }),

    Icons({
      autoInstall: true,
      compiler: 'vue3',
      scale: 1.5,
    }),

    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // Precache all static assets (JS, CSS, HTML, fonts, images)
        globPatterns: ['**/*.{js,css,html,woff,woff2,png,svg,ico}'],
        // Cache social network logos and external images at runtime
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/logo\.microlink\.io\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'logo-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      manifest: {
        name: 'SocialFlow',
        short_name: 'SocialFlow',
        theme_color: '#2196F3',
        background_color: '#f8f9fa',
        display: 'standalone',
        icons: [
          { src: '/logo-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/logo-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],

  build: {
    outDir: 'dist/web',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (/\/(vue|vue-router|pinia|@vueuse)\//.test(id)) return 'vendor-vue'
            if (/\/(primevue|primeicons|primeflex)\//.test(id)) return 'vendor-ui'
          }
        },
      },
      input: [
        resolve(__dirname, 'index.html'),
        resolve(__dirname, 'demo.html'),
        resolve(__dirname, '404.html'),
        // FR
        resolve(__dirname, 'fr/index.html'),
        resolve(__dirname, 'fr/features.html'),
        resolve(__dirname, 'fr/technology.html'),
        resolve(__dirname, 'fr/use-cases.html'),
        resolve(__dirname, 'fr/pricing.html'),
        resolve(__dirname, 'fr/faq.html'),
        resolve(__dirname, 'fr/download.html'),
        resolve(__dirname, 'fr/vs-sessionbox.html'),
        resolve(__dirname, 'fr/vs-gologin.html'),
        resolve(__dirname, 'fr/vs-hootsuite.html'),
        resolve(__dirname, 'fr/vs-buffer.html'),
        resolve(__dirname, 'fr/vs-ghost-browser.html'),
        // EN
        resolve(__dirname, 'en/index.html'),
        resolve(__dirname, 'en/features.html'),
        resolve(__dirname, 'en/technology.html'),
        resolve(__dirname, 'en/use-cases.html'),
        resolve(__dirname, 'en/pricing.html'),
        resolve(__dirname, 'en/faq.html'),
        resolve(__dirname, 'en/download.html'),
        resolve(__dirname, 'en/vs-sessionbox.html'),
        resolve(__dirname, 'en/vs-gologin.html'),
        resolve(__dirname, 'en/vs-hootsuite.html'),
        resolve(__dirname, 'en/vs-buffer.html'),
        resolve(__dirname, 'en/vs-ghost-browser.html'),
      ],
    },
  },
})
