import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// @ts-ignore
import { firebaseRedirect } from './firebaseRedirect.js'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), firebaseRedirect()],
})
