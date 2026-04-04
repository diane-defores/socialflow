import { fileURLToPath, URL } from 'node:url'
import { dirname, resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import IconsResolver from 'unplugin-icons/resolver'
import Icons from 'unplugin-icons/vite'
import Components from 'unplugin-vue-components/vite'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import { defineConfig } from 'vite'
import 'dotenv/config'

const APP_ROOT = 'src/ui/setup/pages/SocialFlow'

// Web build config — serves SocialFlow as a standalone SPA on Vercel
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
      resolvers: [IconsResolver()],
      allowOverrides: true,
    }),

    Icons({
      autoInstall: true,
      compiler: 'vue3',
      scale: 1.5,
    }),
  ],

  build: {
    outDir: 'dist/web',
    emptyOutDir: true,
  },
})
