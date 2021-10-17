const List = require('../models/list')

module.exports = (pool) => {
  const db = {}

  db.insertList = async (list) => {
    const res = await pool.query(
      'INSERT INTO lists (title,is_shared,is_deleted,user_id) VALUES ($1,$2,$3,$4) RETURNING *',
      [list.title, list.is_shared, list.is_deleted, list.user_id]
    )
    return new List(res.rows[0])
  }

  return db
}