import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

let client: postgres.Sql | undefined
let db: ReturnType<typeof drizzle<typeof schema>> | undefined

export const useDb = () => {
  if (db) {
    return db
  }

  const config = useRuntimeConfig()
  const databaseUrl = config.databaseUrl

  if (!databaseUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: 'NUXT_DATABASE_URL is not configured'
    })
  }

  client = postgres(databaseUrl, {
    max: 10,
    prepare: false
  })
  db = drizzle(client, { schema })

  return db
}
