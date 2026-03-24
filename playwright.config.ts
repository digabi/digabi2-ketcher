import { defineConfig } from '@playwright/test'

const baseURL = 'http://localhost:5173'

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  retries: 0,
  use: { baseURL },
  webServer: {
    command: 'just dev',
    url: baseURL
  }
})
