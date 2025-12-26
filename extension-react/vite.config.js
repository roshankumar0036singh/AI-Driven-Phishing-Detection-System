import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json'

export default defineConfig({
    plugins: [
        react(),
        crx({ manifest }),
    ],
    base: './',
    build: {
        rollupOptions: {
            input: {
                popup: 'src/popup/popup.html',
                warning: 'src/warning/warning.html',
            },
        },
    },
})
