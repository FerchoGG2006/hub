import { defineConfig, loadEnv } from 'vite'
import process from 'node:process'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: loadEnv(mode, process.cwd()).VITE_BASE_PATH || '/',
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
  },
}))
