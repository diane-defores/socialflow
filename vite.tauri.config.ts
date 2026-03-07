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

const APP_ROOT = 'src/ui/setup/pages/SocialFlowz'

// https://vitejs.dev/config/
export default defineConfig({
  // Tauri expects a fixed port and no browser auto-open
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      // Watch Tauri src-tauri folder for Rust changes
      ignored: ['**/src-tauri/**'],
    },
  },

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
      // Only scan root src/ — SocialFlowz subfolder stores are duplicates
      dirs: ['src/composables/**', 'src/stores/**', 'src/utils/**'],
      vueTemplate: true,
    }),

    Components({
      // Prefer SocialFlowz-local component variants when names overlap.
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
    // Tauri supports ES2021
    target: ['es2021', 'chrome100', 'safari13'],
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_DEBUG,
    outDir: 'dist/tauri',
  },
})
