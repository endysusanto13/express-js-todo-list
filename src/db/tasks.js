const Task = require('../models/task')

module.exports = (pool) => {
  const db = {}

  db.insertTask = async (task) => {
    const res = await pool.query(`
      INSERT INTO Tasks (title, is_deleted, create_user_id, update_user_id, list_id) 
      VALUES ($1,$2,$3,$4,$5) RETURNING *
      `,
      [task.title, task.is_deleted, task.create_user_id, task.update_user_id, task.list_id]
    )
    return new Task(res.rows[0])
  }

  db.findTaskByTaskId = async (taskId) => {
    const res = await pool.query(`
      SELECT * FROM Tasks WHERE id=$1
      `,
      [taskId]
    )
    return res.rowCount ? new Task(res.rows[0]) : null
  }

  db.findTaskByTitle = async (listId, taskTitle) => {
    const res = await pool.query(`
      SELECT * FROM Tasks 
      WHERE list_id=$1 AND title=$2
      `,
      [listId, taskTitle]
    )
    return res.rowCount ? new Task(res.rows[0]) : null
  }
  
  db.updateTask = async (userId, newTitle, TaskId) => {
    const res = await pool.query(`
      UPDATE Tasks SET update_user_id=$1, title=$2
      WHERE id=$3 RETURNING *
      `,
      [userId, newTitle, TaskId]
    )
    return new Task(res.rows[0])
  }

  db.deleteTask = async (userId, TaskId) => {
    const res = await pool.query(`
      UPDATE Tasks SET update_user_id=$1, is_deleted=TRUE 
      WHERE id=$2 RETURNING *
      `,
      [userId, TaskId]
    )
    return new Task(res.rows[0])
  }

  return db
}