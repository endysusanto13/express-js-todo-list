require('dotenv').config({ path: '.env.test' })
const User = require('../models/user')
const List = require('../models/list')
const Task = require('../models/task')
const db = require('./index')

const testUser = new User({ 
  id: 1,
  username:'test_username',
  email:'test@gmail.com', 
  password_hash:'test_password'
})

const listId = 1
const testList = new List({ 
  id:listId,
  title:'test_todo_list',
  is_shared:false,
  is_deleted:false,
  create_user_id:testUser.id,
  update_user_id:null
})

const taskId = 1
const title = 'test_title'
const is_deleted = false
const create_user_id = 1
const update_user_id = null

const newTask = new Task({ 
  id:taskId,
  title,
  is_deleted,
  create_user_id,
  update_user_id,
  list_id:listId
})

beforeAll(async () => {
  await db.deleteAllTables()
  await db.initialise()
  // Avoid using db.insertUser() to isolate this unit test
  await db.query(`
    INSERT INTO Users (username,email,password_hash) VALUES ($1,$2,$3) RETURNING *`,
    [testUser.username, testUser.email, testUser.password_hash]
  )
})

afterAll(async () => {
  await db.clearUsersTable()
  await db.clearListsTable()
  await db.clearTasksTable()
  await db.end()
})

describe('Querying into Tasks table to', () => {
  describe('Create new TODO list for testing', () => {
    it('should return List object', async () => {
      await db.query(`
        INSERT INTO Lists (title, is_shared, is_deleted, create_user_id, update_user_id) 
        VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [testList.title, testList.is_shared, testList.is_deleted, testList.create_user_id, testList.update_user_id]
      )
      const list = await db.findListByListId(testList.id)
      expect(list).toMatchObject(testList)

    })
  })

  describe('insert data', () => {
    it('should return Task object', async () => {
      const task = await db.insertTask(new Task({ title, is_deleted, create_user_id, update_user_id, list_id:listId }))
      expect(task).toMatchObject(newTask)
    })
  })
  
  describe('find task', () => {
    describe('by id only', () => {
      it('should return Task object if exists', async () => {
        const task = await db.findTaskByTaskId(newTask.id)
        expect(task).toMatchObject(newTask)
      })
      
      it('should return null if does not exists', async () => {
        const task = await db.findTaskByTaskId(5)
        expect(task).toBeFalsy()
      })
    })
    
    describe('by title based on current user', () => {
      it('should return Task object if exists', async () => {
        const task = await db.findTaskByTitle(newTask.create_user_id, newTask.title)
        expect(task).toMatchObject(newTask)
      })
      
      it('should return null if id is incorrect but title is correct', async () => {
        const task = await db.findTaskByTitle(5, newTask.title)
        expect(task).toBeFalsy()
      })
      
      it('should return null if title is incorrect but id is correct', async () => {
        const task = await db.findTaskByTitle(newTask.create_user_id, "wrong_title")
        expect(task).toBeFalsy()
      })
    })
  })
  
  describe('update task', () => {
    const anotherAuthUserId = 2
    const updatedTitle = 'updated_task_title'
    const updatedTask = {
      ...newTask, 
      title:updatedTitle, 
      update_user_id:anotherAuthUserId 
    }
    
    it('should return Task object', async () => {
      const task = await db.updateTask(anotherAuthUserId, updatedTitle, taskId)
      expect(task).toMatchObject(updatedTask)
    })
  })
  
  describe('delete task', () => {
    const updatedTitle = 'updated_task_title'

    const deletedTask = { 
      ...newTask,
      title:updatedTitle, 
      is_deleted:true,
      update_user_id:testUser.id
    }
    it('should return Task object with is_deleted attribute is true and update update_user_id attribute', async () => {
      const task = await db.deleteTask(testUser.id, taskId)
      expect(task).toMatchObject(deletedTask)
    })
  })
})