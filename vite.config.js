import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { bookingApiPlugin } from "./server/booking.js";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), bookingApiPlugin(env)],
  };
});
