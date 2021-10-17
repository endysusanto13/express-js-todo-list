const { Pool } = require('pg')

let pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

const db = {}

db.initialise = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS Users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL,
      password_hash VARCHAR(100) NOT NULL
    )
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS Lists (
      id SERIAL PRIMARY KEY,
      title VARCHAR(100) NOT NULL,
      is_shared BOOLEAN NOT NULL,
      is_deleted BOOLEAN NOT NULL,
      user_id INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
    )
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS Tasks (
      id SERIAL PRIMARY KEY,
      title VARCHAR(100) NOT NULL,
      is_deleted BOOLEAN NOT NULL,
      list_id INTEGER NOT NULL,
      FOREIGN KEY (list_id) REFERENCES Lists(id) ON DELETE CASCADE
    )
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS Users_Share_Lists (
      list_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      FOREIGN KEY (list_id) REFERENCES Lists(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES Lists(id) ON DELETE CASCADE
    )
  `)
}

db.clearUsersTable = async () => {
  await pool.query('DELETE FROM Users')
  await pool.query('ALTER SEQUENCE users_id_seq RESTART')
}
db.clearItemsTable = async () => {
  await pool.query('DELETE FROM Lists')
  await pool.query('ALTER SEQUENCE lists_id_seq RESTART')
}
db.clearTasksTable = async () => {
  await pool.query('DELETE FROM Tasks')
  await pool.query('ALTER SEQUENCE tasks_id_seq RESTART')
}
db.clearUsersShareListsTable = async () => {
  await pool.query('DELETE FROM Users_Share_Lists')
}

db.end = async () => {
  await pool.end()
}

module.exports = db