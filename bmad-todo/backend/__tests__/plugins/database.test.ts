import { describe, it, expect, afterAll } from 'vitest'
import type BetterSqlite3 from 'better-sqlite3'
import { buildServer } from '../../src/server.js'

interface PragmaColumnInfo {
  cid: number
  name: string
  type: string
  notnull: number
  dflt_value: string | null
  pk: number
}

function getTableInfo(db: BetterSqlite3.Database, table: string): PragmaColumnInfo[] {
  const stmt = db.prepare<[], PragmaColumnInfo>(`SELECT * FROM pragma_table_info('${table}')`)
  return stmt.all()
}

describe('Database initialization', () => {
  const server = buildServer({ logger: false })

  afterAll(async () => {
    await server.close()
  })

  it('creates the todos table with correct schema', async () => {
    await server.ready()

    const tableInfo = getTableInfo(server.db, 'todos')

    expect(tableInfo).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'id', type: 'INTEGER', pk: 1 }),
        expect.objectContaining({ name: 'text', type: 'TEXT', notnull: 1 }),
        expect.objectContaining({ name: 'completed', type: 'INTEGER', notnull: 0 }),
        expect.objectContaining({ name: 'created_at', type: 'TEXT', notnull: 0 }),
      ]),
    )
  })

  it('has the correct default values', async () => {
    await server.ready()

    const tableInfo = getTableInfo(server.db, 'todos')

    const completedCol = tableInfo.find((col) => col.name === 'completed')
    expect(completedCol?.dflt_value).toBe('0')

    const createdAtCol = tableInfo.find((col) => col.name === 'created_at')
    expect(createdAtCol?.dflt_value).toBe('CURRENT_TIMESTAMP')
  })

  it('registers all required plugins', async () => {
    await server.ready()

    expect(server.hasDecorator('db')).toBe(true)
    expect(server.hasDecorator('httpErrors')).toBe(true)
  })
})
