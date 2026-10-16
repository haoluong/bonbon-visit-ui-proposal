import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/bonbon-visit-ui-proposal/",
  plugins: [react()],
});
