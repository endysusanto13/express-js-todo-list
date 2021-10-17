require('dotenv').config({ path: '.env.test' })
const db = require('./index')

describe('Creating Tables', () => {
  it('should not throw error', async () => {
    await db.deleteAllTables()
    expect(() => db.initialise()).not.toThrow()
  })
})

afterAll(async () => {
  await db.end()
})