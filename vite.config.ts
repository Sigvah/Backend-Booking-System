import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Relative asset paths so the app works on GitHub Pages regardless of the
  // repository name (served from /<repo>/), on a custom domain, or locally.
  base: "./",
});
