require('dotenv').config({ path: '.env.test' })
const User = require('../models/user')
const List = require('../models/list')
const db = require('./index')

const testUser = new User({ 
  id: 1,
  username:'test_username',
  email:'test@gmail.com', 
  password_hash:'test_password'
})

const listId = 1
const title = 'test_title'
const is_shared = false
const is_deleted = false
const create_user_id = 1
const update_user_id = null

const newList = new List({ 
  id:listId,
  title,
  is_shared,
  is_deleted,
  create_user_id,
  update_user_id
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
      const list = await db.insertList(new List({ title, is_shared, is_deleted, create_user_id, update_user_id }))
      expect(list).toMatchObject(newList)
    })
  })

  describe('find list', () => {
    describe('by id only', () => {
      it('should return List object if exists', async () => {
        const list = await db.findListByListId(newList.id)
        expect(list).toMatchObject(newList)
      })
      
      it('should return null if does not exists', async () => {
        const list = await db.findListByListId(5)
        expect(list).toBeFalsy()
      })
    })

    describe('by title based on current user', () => {
      it('should return List object if exists', async () => {
        const list = await db.findListByTitle(newList.create_user_id, newList.title)
        expect(list).toMatchObject(newList)
      })

      it('should return null if id is incorrect but title is correct', async () => {
        const list = await db.findListByTitle(5, newList.title)
        expect(list).toBeFalsy()
      })

      it('should return null if title is incorrect but id is correct', async () => {
        const list = await db.findListByTitle(newList.create_user_id, "wrong_title")
        expect(list).toBeFalsy()
      })
    })
  })

  describe('update list', () => {
    const anotherAuthUserId = 2
    const updatedTitle = 'updated_test_title'
    const updatedList = {
      ...newList, 
      title:updatedTitle, 
      update_user_id:anotherAuthUserId 
    }

    it('should return List object', async () => {
      const list = await db.updateList(anotherAuthUserId, updatedTitle, listId)
      expect(list).toMatchObject(updatedList)
    })
  })

  describe('delete list', () => {
    const updatedTitle = 'updated_test_title'

    const deletedList = { 
      ...newList,
      title:updatedTitle, 
      is_deleted:true,
      update_user_id:testUser.id
    }
    it('should return List object with is_deleted attribute is true and update update_user_id attribute', async () => {
      const list = await db.deleteList(testUser.id, listId)
      expect(list).toMatchObject(deletedList)
    })
  })
})