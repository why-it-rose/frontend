import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ["firebase/app", "firebase/messaging"],
  },
  server: {
    proxy: {
      '/auth': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/oauth2': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/login': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      /** LS Open API OAuth (브라우저 CORS 회피) — POST /ls-oauth/oauth2/token */
      '/ls-oauth': {
        target: 'https://openapi.ls-sec.co.kr:8080',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/ls-oauth/, ''),
      },
      /** LS REST 시세 등 POST /ls-api/stock/market-data (tr_cd 헤더) */
      '/ls-api': {
        target: 'https://openapi.ls-sec.co.kr:8080',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/ls-api/, ''),
      },
      '/kis-api': {
        target: 'https://openapi.koreainvestment.com:9443',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/kis-api/, ''),
      },
      '/kis-oauth': {
        target: 'https://openapi.koreainvestment.com:9443',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/kis-oauth/, ''),
      },
      '/data-go': {
        target: 'https://apis.data.go.kr',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/data-go/, ''),
      },
    },
  },

});
