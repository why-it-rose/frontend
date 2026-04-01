import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_API_BASE_URL || 'http://localhost:8080';
  return {
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
          target: apiTarget,
          changeOrigin: true,
        },
        '/oauth2': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/login': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/ls-oauth': {
          target: 'https://openapi.ls-sec.co.kr:8080',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/ls-oauth/, ''),
        },
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
  };
});
