require('dotenv').config({ path: '.env.test' })
const db = require('./index')
const User = require('../models/user')

const id = 1
const username = 'test_user'
const email = 'test@gmail.com'
const password = 'test_password'

const newUser = new User({ 
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

describe('Insert data to table Users', () => {
  it('should return User object', async () => {
    const user = await db.insertUser(new User({ username, email, password_hash: password }))
    expect(user).toMatchObject(newUser)
  })
})

describe('Find data in table Users with username', () => {
  it('should return User object', async () => {
    const user = await db.findUserByUsername(username)
    expect(user).toMatchObject(newUser)
  })
})

describe('Find data in table Users with email', () => {
  it('should return User object', async () => {
    const user = await db.findUserByEmail(email)
    expect(user).toMatchObject(newUser)
  })
})