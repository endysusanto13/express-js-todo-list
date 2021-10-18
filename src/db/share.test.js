require('dotenv').config({ path: '.env.test' })
const User = require('../models/user')
const List = require('../models/list')
const Users_Share_Lists = require('../models/share')
const db = require('./index')

const testUser1 = new User({
  id: 1,
  username:'1test_username',
  email:'1test@gmail.com', 
  password_hash:'1test_password'
})
const testUser2 = new User({
  id: 2,
  username:'2test_username',
  email:'2test@gmail.com', 
  password_hash:'2test_password'
})
const testUser3 = new User({
  id: 3,
  username:'3test_username',
  email:'3test@gmail.com', 
  password_hash:'3test_password'
})
const testUsers = [testUser1, testUser2, testUser3]

const list1 = new List({ 
  id:1,
  title:'first_todo_list',
  is_shared:false,
  is_deleted:false,
  create_user_id:1,
  update_user_id:null
})
const list2 = new List({ 
  id:2,
  title:'first_todo_list',
  is_shared:false,
  is_deleted:false,
  create_user_id:1,
  update_user_id:null
})
const list3 = new List({ 
  id:3,
  title:'first_todo_list',
  is_shared:false,
  is_deleted:false,
  create_user_id:3,
  update_user_id:null
})
const lists = [list1, list2, list3]

const sharedList1 = new Users_Share_Lists({
  list_id:1,
  shared_by_email:'1test@gmail.com',
  shared_with_email:'2test@gmail.com',
  is_deleted:false,
})
const sharedList2 = new Users_Share_Lists({
  list_id:1,
  shared_by_email:'2test@gmail.com',
  shared_with_email:'3test@gmail.com',
  is_deleted:false,
})
const sharedList3 = new Users_Share_Lists({
  list_id:2,
  shared_by_email:'1test@gmail.com',
  shared_with_email:'3test@gmail.com',
  is_deleted:false,
})
const sharedList4 = new Users_Share_Lists({
  list_id:3,
  shared_by_email:'3test@gmail.com',
  shared_with_email:'2test@gmail.com',
  is_deleted:false,
})

beforeAll(async () => {
  await db.deleteAllTables()
  await db.initialise()
  // Avoid using db.insertUser() to isolate this unit test
  testUsers.map(async (testUser) => await db.query(`
    INSERT INTO Users (username,email,password_hash) VALUES ($1,$2,$3) RETURNING *`,
    [testUser.username, testUser.email, testUser.password_hash]
  ))
  lists.map(async (list) => await db.query(`
    INSERT INTO Lists (title, is_shared, is_deleted, create_user_id, update_user_id) 
    VALUES ($1,$2,$3,$4,$5) RETURNING *
    `,
    [list.title, list.is_shared, list.is_deleted, list.create_user_id, list.update_user_id]
  ))
})

afterAll(async () => {
  await db.clearUsersTable()
  await db.clearListsTable()
  await db.clearUsersShareListsTable()
  await db.end()
})

describe('Querying into Users_Share_Lists table to', () => {
  describe('share list', () => {
    describe('first list', () => {
      it('should return Users_Share_Lists object', async () => {
        const sharedList = await db.shareList(new Users_Share_Lists({ list_id:1, shared_by_email:'1test@gmail.com', shared_with_email:'2test@gmail.com', is_deleted:false }))
        expect(sharedList).toMatchObject(sharedList1)
      })
    })
    describe('second list', () => {
      it('should return Users_Share_Lists object', async () => {
        const sharedList = await db.shareList(new Users_Share_Lists({ list_id:1, shared_by_email:'2test@gmail.com', shared_with_email:'3test@gmail.com', is_deleted:false }))
        expect(sharedList).toMatchObject(sharedList2)
      })
    })
    describe('third list', () => {
      it('should return Users_Share_Lists object', async () => {
        const sharedList = await db.shareList(new Users_Share_Lists({ list_id:2, shared_by_email:'1test@gmail.com', shared_with_email:'3test@gmail.com', is_deleted:false }))
        expect(sharedList).toMatchObject(sharedList3)
      })
    })
    describe('fourth list', () => {
      it('should return Users_Share_Lists object', async () => {
        const sharedList = await db.shareList(new Users_Share_Lists({ list_id:3, shared_by_email:'3test@gmail.com', shared_with_email:'2test@gmail.com', is_deleted:false }))
        expect(sharedList).toMatchObject(sharedList4)
      })
    })
  })

  describe('get shared list(s)', () => {
    describe('by list id', () => {
      it('should return an array of Users_Share_Lists object if exists', async () => {
        const searchResult = await db.getSharedList(1)
        expect(searchResult).toEqual([sharedList1,sharedList2])
      })
      
      it('should return an empty array if it does not exists', async () => {
        const searchResult = await db.getSharedList(5)
        expect(searchResult).toEqual([])
      })
    })
    
    describe('that are shared by a user', () => {
      it('should return an array of Users_Share_Lists object if exists', async () => {
        const searchResult = await db.getListSharedBy('1test@gmail.com')
        expect(searchResult).toEqual([sharedList1,sharedList3])
      })
      
      it('should return an empty array if it does not exists', async () => {
        const searchResult = await db.getListSharedBy('wrong@gmail.com')
        expect(searchResult).toEqual([])
      })
    })
    
    describe('that are shared with a user', () => {
      it('should return an array of Users_Share_Lists object if exists', async () => {
        const searchResult = await db.getListSharedWith('2test@gmail.com')
        expect(searchResult).toEqual([sharedList1,sharedList4])
      })
      
      it('should return an empty array if it does not exists', async () => {
        const searchResult = await db.getListSharedWith('1test@gmail.com')
        expect(searchResult).toEqual([])
      })
    })
  })

  describe('unshare list', () => {
    const unsharedList = { 
      ...sharedList4,
      is_deleted:true
    }
    it('should return Users_Share_Lists object with is_deleted attribute is true', async () => {
      const sharedList = await db.unshareList(3, '3test@gmail.com', '2test@gmail.com')
      expect(sharedList).toMatchObject(unsharedList)
    })
  })
})