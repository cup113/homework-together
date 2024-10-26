import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      coverage: {
        enabled: true,
        exclude: [
          ...configDefaults.exclude,
          '**/tests/**',
          '**/src/components/ui/**',
          '**/pb_migrations/**',
          '**/pb_data/**',
          '**/dist-server/**',
          '**/*.config.*',
          '**/types/*.ts',
        ]
      },
      reporters: ['default', 'junit'],
      outputFile: './coverage/junit/junit.xml',
    }
  })
)
