require('dotenv').config({ path: '.env.test' })
const User = require('../models/user')
const List = require('../models/list')
const db = require('./index')

const testUser = new User({ 
  username:'test_username',
  email:'test@gmail.com', 
  password_hash:'test_password'
})

const id = 1
const title = 'test_title'
const is_shared = false
const is_deleted = false
const user_id = 1

const newList = new List({ 
  id,
  title,
  is_shared,
  is_deleted,
  user_id
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
  await db.end()
})

describe('Querying into Lists table to', () => {
  describe('insert data', () => {
    it('should return List object', async () => {
      const list = await db.insertList(new List({ title, is_shared, is_deleted, user_id }))
      expect(list).toMatchObject(newList)
    })
  })

  describe('find list by title', () => {
    it('should return List object if exists', async () => {
      const list = await db.findListByTitle(newList.title)
      expect(list).toMatchObject(newList)
    })
  })

  describe('find list by title', () => {
    it('should return null if does not exists', async () => {
      const list = await db.findListByTitle("wrong_title")
      expect(list).toBeFalsy()
    })
  })
})