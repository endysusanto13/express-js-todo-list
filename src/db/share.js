const Users_Share_Lists = require('../models/share')

module.exports = (pool) => {
  const db = {}

  db.shareList = async (sharedList) => {
    const res = await pool.query(`
      INSERT INTO Users_Share_Lists (list_id, shared_by_email, shared_with_email, is_deleted) 
      VALUES ($1,$2,$3,$4) RETURNING *`,
      [sharedList.list_id, sharedList.shared_by_email, sharedList.shared_with_email, sharedList.is_deleted]
    )
    return new Users_Share_Lists(res.rows[0])
  }

  db.getSharedList = async (listId) => {
    const res = await pool.query(`
      SELECT * FROM Users_Share_Lists WHERE list_id=$1
      `,
      [listId]
    )
    return res.rows.map(row => new Users_Share_Lists(row))
  }

  db.getListSharedBy = async (email) => {
    const res = await pool.query(`
      SELECT * FROM Users_Share_Lists WHERE shared_by_email=$1
      `,
      [email]
    )
    return res.rows.map(row => new Users_Share_Lists(row))
  }

  db.getListSharedWith = async (email) => {
    const res = await pool.query(`
      SELECT * FROM Users_Share_Lists WHERE shared_with_email=$1
      `,
      [email]
    )
    return res.rows.map(row => new Users_Share_Lists(row))
  }

  db.unshareList = async (listId, sharedByEmail, sharedWithEmail) => {
    const res = await pool.query(`
      UPDATE Users_Share_Lists SET is_deleted=TRUE 
      WHERE list_id=$1 AND shared_by_email=$2 AND shared_with_email=$3
      RETURNING *
      `,
      [listId, sharedByEmail, sharedWithEmail]
    )
    return new Users_Share_Lists(res.rows[0])
  }

  return db
}