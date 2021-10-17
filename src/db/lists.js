const List = require('../models/list')

module.exports = (pool) => {
  const db = {}

  db.insertList = async (list) => {
    const res = await pool.query(
      'INSERT INTO Lists (title, is_shared, is_deleted, create_user_id, update_user_id) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [list.title, list.is_shared, list.is_deleted, list.create_user_id, list.update_user_id]
    )
    return new List(res.rows[0])
  }
  db.findListByListId = async (listId) => {
    const res = await pool.query(`
      SELECT * FROM Lists WHERE id=$1
      `,
      [listId]
    )
    return res.rowCount ? new List(res.rows[0]) : null
  }

  db.findListByTitle = async (create_user_id, title) => {
    const res = await pool.query(`
      SELECT * FROM Lists 
      WHERE create_user_id=$1 AND title=$2
      `,
      [create_user_id, title]
    )
    return res.rowCount ? new List(res.rows[0]) : null
  }


  return db
}