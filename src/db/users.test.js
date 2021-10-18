require('dotenv').config({ path: '.env.test' })
const db = require('./index')
const User = require('../models/user')

const id = 1
const username = 'test_user'
const email = 'test@gmail.com'
const password = 'test_password'

const testUser = new User({ 
  id, 
  username, 
  email, 
  password_hash: password
})

beforeAll(async () => {
  await db.deleteAllTables()
  await db.initialise()
})

afterAll(async () => {
  await db.end()
})

describe('Querying into Users table to', () => {
  describe('insert data', () => {
    it('should return User object', async () => {
      const user = await db.insertUser(new User({ username, email, password_hash: password }))
      expect(user).toMatchObject(testUser)
    })
  })

  describe('find data with', () => {
    describe('user id', () => {
      it('should return User object', async () => {
        const user = await db.findUserByID(id)
        expect(user).toMatchObject(testUser)
      })
    })

    describe('username', () => {
      it('should return User object', async () => {
        const user = await db.findUserByUsername(username)
        expect(user).toMatchObject(testUser)
      })
    })

    describe('email', () => {
      it('should return User object', async () => {
        const user = await db.findUserByEmail(email)
        expect(user).toMatchObject(testUser)
      })
    })
  })
})