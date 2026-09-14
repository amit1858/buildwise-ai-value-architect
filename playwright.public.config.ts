import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.public.spec.ts",
  workers: 1,
  retries: 0,
  reporter: "line",
  use: {
    baseURL: "http://127.0.0.1:3002/buildwise-ai-value-architect",
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run build:pages && node scripts/serve-static-pages.mjs",
    url: "http://127.0.0.1:3002/buildwise-ai-value-architect/",
    reuseExistingServer: false,
    timeout: 240_000,
  },
});
