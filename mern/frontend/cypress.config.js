import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://127.0.0.1:5173',
    specPattern: 'cypress/integration/**/*.js',
    supportFile: 'cypress/support/index.js',
    chromeWebSecurity: false,
    defaultCommandTimeout: 20000,
    requestTimeout: 20000,
    responseTimeout: 20000,
    pageLoadTimeout: 30000,
    setupNodeEvents(on, config) {
      return config;
    },
  },
});
