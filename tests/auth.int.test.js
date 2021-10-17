const request = require('supertest')
const utils = require('./utils')

const app = utils.app
const db = utils.db

const username = 'test_user'
const another_username = 'another_test_user'
const email = 'test@gmail.com'
const another_email = 'another_test@gmail.com'
const password = 'test_password'

beforeAll(async () => {
  await utils.setup()
})

afterAll(async () => {
  await utils.teardown()
})

describe('GET /', () => {
  it('should return 200', async () => {
    return request(app)
      .get('/')
      .expect(200)
  })
})

describe('POST /register', () => {
  beforeAll(async () => {
    await db.clearUsersTable()
  })

  it('should return with a token', async () => {
    return request(app)
      .post('/register')
      .send({ username, email, password })
      .expect(201)
      .then(response => {
        expect(response.body.token).toBeTruthy()
      })
  })

  it('should return 400 if username is already used', async () => {
    return request(app)
      .post('/register')
      .send({ username, another_email, password })
      .expect(400)
      .then(response => {
        expect(response.body.token).toBeFalsy()
      })
  })

  it('should return 400 if email is already used', async () => {
    return request(app)
      .post('/register')
      .send({ another_username, email, password })
      .expect(400)
      .then(response => {
        expect(response.body.token).toBeFalsy()
      })
  })
})

describe('POST /login', () => {
  beforeAll(async () => {
    await db.clearUsersTable()
    await utils.registerUser(username, email, password)
  })
  
  describe('valid login credentials', () => {
    it('should return with a token', async () => {
      return request(app)
        .post('/login')
        .send({ email, password })
        .expect(200)
        .then(response => {
          expect(response.body.token).toBeTruthy()
        })
    })
  })
  
  describe('invalid email', () => {
    it('should return 401', async () => {
      return request(app)
        .post('/login')
        .send({ email: 'wrong_email', password })
        .expect(401)
        .then(response => {
          expect(response.body.token).toBeFalsy()
        })
    })
  })

  describe('invalid password', () => {
    it('should return 401', async () => {
      return request(app)
        .post('/login')
        .send({ email, password: 'wrong_password' })
        .expect(401)
        .then(response => {
          expect(response.body.token).toBeFalsy()
        })
    })
  })
})