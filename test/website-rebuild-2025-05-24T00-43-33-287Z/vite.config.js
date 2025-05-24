import { defineConfig } from 'vite'
import legacy from '@vitejs/plugin-legacy'

export default defineConfig({
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11']
    })
  ],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: './index.html',
        content: './content.html',
        company: './company.html',
        cpghouse: './cpghouse.html',
        pricing: './pricing.html',
        'product-qr-codes': './product-qr-codes.html'
      }
    }
  },
  css: {
    postcss: {
      plugins: [
        require('autoprefixer')
      ]
    }
  },
  server: {
    port: 3000,
    open: true
  }
})
