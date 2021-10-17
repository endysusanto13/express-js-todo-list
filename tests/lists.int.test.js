const request = require('supertest')
const utils = require('./utils')

const app = utils.app
const db = utils.db

let token = undefined

beforeAll(async () => {
  await utils.setup()
  token = await utils.registerUser()
})

afterAll(async () => {
  await utils.teardown()
})

describe('POST /list', () => {
  beforeAll(async () => {
    await db.clearListsTable()
  })
  
  const list = {
    title: 'new_todo_list'
  }
  
  describe('create an item', () => {
    it('should return 201 and list title as the response', async () => {
      return await request(app)
        .post('/list')
        .set('Authorization', token)
        .send(list)
        .expect(201)  
        .then(response => {
          expect(response.body).toMatchObject(list)
        })
    })
  })

  describe('create an item with existing title', () => {
    it('should return 400', async () => {
      return await request(app)
        .post('/list')
        .set('Authorization', token)
        .send(list)
        .expect(400)
        .then(response => {
          expect(response.text).toEqual(`'${list.title}' has already been created by you.`)
        })
    })
  })

  describe('given that users are not logged in', () => {
    it('should return 401', async () => {
      token = null
      return await request(app)
        .post('/list')
        .set('Authorization', token)
        .send(list)
        .expect(401)
    })
  })

  describe('given that token is invalid', () => {
    it('should return 401', async () => {
      token = "invalid_token"
      return await request(app)
        .post('/list')
        .set('Authorization', token)
        .send(list)
        .expect(401)
    })
  })
})