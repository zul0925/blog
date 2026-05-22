import { defineConfig } from 'drizzle-kit'
import { existsSync, readFileSync } from 'node:fs'

const loadEnv = () => {
  if (!existsSync('.env')) {
    return
  }

  const lines = readFileSync('.env', 'utf8').split(/\r?\n/)

  for (const line of lines) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)

    if (!match || process.env[match[1]]) {
      continue
    }

    process.env[match[1]] = match[2].replace(/^["']|["']$/g, '')
  }
}

loadEnv()

const databaseUrl = process.env.NUXT_DATABASE_URL

if (!databaseUrl) {
  throw new Error('NUXT_DATABASE_URL is not configured. Please create .env first.')
}

export default defineConfig({
  schema: './server/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl
  }
})
