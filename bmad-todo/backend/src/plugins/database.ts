import type { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import Database from 'better-sqlite3'
import '../types.js'

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY,
    text TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`

function databasePlugin(server: FastifyInstance) {
  const dbPath = process.env['DATABASE_PATH'] ?? ':memory:'
  const db = new Database(dbPath)

  db.pragma('journal_mode = WAL')
  db.exec(SCHEMA)

  server.decorate('db', db)
  server.addHook('onClose', () => {
    db.close()
  })
}

export default fp(databasePlugin, { name: 'database' })
