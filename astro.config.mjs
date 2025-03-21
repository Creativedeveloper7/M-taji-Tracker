import { defineConfig } from "astro/config";

export default defineConfig({
  vite: {
    server: {
      proxy: {
        "/wp-json": {
          target: "https://navigatingadolescenceonline.wordpress.com",
          changeOrigin: true,
          secure: false
        }
      }
    }
  }
});