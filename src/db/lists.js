const List = require('../models/list')

module.exports = (pool) => {
  const db = {}

  db.insertList = async (list) => {
    const res = await pool.query(`
      INSERT INTO Lists (title, is_shared, is_deleted, create_user_id, update_user_id) 
      VALUES ($1,$2,$3,$4,$5) RETURNING *
      `,
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

  db.findListByTitle = async (createUserId, title) => {
    const res = await pool.query(`
      SELECT * FROM Lists 
      WHERE create_user_id=$1 AND title=$2
      `,
      [createUserId, title]
    )
    return res.rowCount ? new List(res.rows[0]) : null
  }

  db.getAllLists = async (createUserId) => {
    const res = await pool.query(`
      SELECT * FROM Lists
      WHERE create_user_id=$1
      `,
      [createUserId]
    )
    return res.rows.map(row => new List(row))
  }
  
  db.updateList = async (userId, newTitle, listId) => {
    const res = await pool.query(`
      UPDATE Lists SET update_user_id=$1, title=$2 
      WHERE id=$3 RETURNING *
      `,
      [userId, newTitle, listId]
    )
    return new List(res.rows[0])
  }

  db.updateShareStatusList = async (listId) => {
    const res = await pool.query(`
      UPDATE Lists SET is_shared=TRUE
      WHERE id=$1 RETURNING *
      `,
      [listId]
    )
    return new List(res.rows[0])
  }

  db.deleteList = async (userId, listId) => {
    const res = await pool.query(`
      UPDATE Lists SET update_user_id=$1, is_deleted=TRUE 
      WHERE id=$2 RETURNING *
      `,
      [userId, listId]
    )
    return new List(res.rows[0])
  }

  return db
}