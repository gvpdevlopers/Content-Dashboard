import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "prompt",
      injectRegister: null,
      manifest: {
        name: "Glow Ventures",
        short_name: "Glow Ventures",
        description: "Glow Ventures public website",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#f7f7f8",
        theme_color: "#f7f7f8",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icon.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: false,
        globPatterns: [
          "**/*.{css,html,ico,jpg,jpeg,js,png,svg,webp,woff,woff2}",
        ],
        globIgnores: ["favicon.png"],
        navigateFallback: "/index.html",
        navigateFallbackAllowlist: [
          /^\/$/,
          /^\/(?:services|about|contact|privacy|terms|privacy-policy|terms-conditions)\/?$/,
          /^\/(?:login|dashboard|admin|staff)(?:\/|$)/,
        ],
        navigateFallbackDenylist: [/^\/api(?:\/|$)/],
      },
    }),
  ],
});