// drizzle.config.ts
import { defineConfig } from 'drizzle-kit'

// noinspection JSUnusedGlobalSymbols
export default defineConfig({
  dbCredentials: {
    url: Bun.env.DATABASE_URL ?? 'postgresql://app:app@localhost:5432/app',
  },
  dialect: 'postgresql',
  out: './drizzle',
  schema: './src/database/schema.ts',
})
