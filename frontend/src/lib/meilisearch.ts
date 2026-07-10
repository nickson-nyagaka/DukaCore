import { Meilisearch } from 'meilisearch'

// Connects to the Meilisearch instance running in Docker on port 7700.
export const meiliClient = new Meilisearch({
  host: process.env.NEXT_PUBLIC_MEILI_HOST || 'http://127.0.0.1:7700',
  apiKey: process.env.NEXT_PUBLIC_MEILI_KEY || 'mve_master_key_123'
})
