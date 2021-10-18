const { Pool } = require('pg')

let pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // ssl: {
  //   rejectUnauthorized: false
  // }
})

const db = {
  ...require('./users')(pool),
  ...require('./lists')(pool),
  ...require('./tasks')(pool),
  ...require('./share')(pool),
}

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
      create_user_id INTEGER NOT NULL,
      update_user_id INTEGER
      )
    `)
  // Don't delete the list even if users are deleted as there maybe be multiple users sharing it
  // If need to cascade delete next time, use `FOREIGN KEY (create_user_id) REFERENCES Users(id) ON DELETE CASCADE`
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS Tasks (
      id SERIAL PRIMARY KEY,
      title VARCHAR(100) NOT NULL,
      is_deleted BOOLEAN NOT NULL,
      list_id INTEGER NOT NULL,
      create_user_id INTEGER NOT NULL,
      update_user_id INTEGER,
      FOREIGN KEY (list_id) REFERENCES Lists(id) ON DELETE CASCADE
    )
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS Users_Share_Lists (
      list_id INTEGER NOT NULL,
      shared_by_email VARCHAR(100) NOT NULL,
      shared_with_email VARCHAR(100) NOT NULL,
      is_deleted BOOLEAN NOT NULL,
      FOREIGN KEY (list_id) REFERENCES Lists(id) ON DELETE CASCADE
      )
    `)
  // Doesn't need id primary key as list_id is unique for all users
  // Don't delete the shared link even if the user that share has been deleted
  // If need to cascade delete next time, use `FOREIGN KEY (shared_by_user_id) REFERENCES Users(email) ON DELETE CASCADE`
}

// For general query using the same pool without return value
db.query = async (queryStr,array) => {
  await pool.query(queryStr,array)
}
db.clearUsersTable = async () => {
  await pool.query('DELETE FROM Users')
  await pool.query('ALTER SEQUENCE users_id_seq RESTART')
}
db.clearListsTable = async () => {
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

db.deleteAllTables = async () => {
  await pool.query('DROP TABLE IF EXISTS Users CASCADE;')
  await pool.query('DROP TABLE IF EXISTS Lists CASCADE;')
  await pool.query('DROP TABLE IF EXISTS Tasks CASCADE;')
  await pool.query('DROP TABLE IF EXISTS Users_Share_Lists CASCADE;')
}

db.end = async () => {
  await pool.end()
}

module.exports = db