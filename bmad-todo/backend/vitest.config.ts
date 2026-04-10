import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reportsDirectory: '../qa-reports/coverage-backend',
      reporter: ['text', 'html', 'json-summary'],
    },
  },
})
