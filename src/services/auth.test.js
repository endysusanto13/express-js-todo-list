require('dotenv').config()
const bcrypt = require('bcrypt')
const AuthService = require('./auth')

const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS)
const username = 'test_user'
const email = 'test@gmail.com'
const password = 'test_password'

const db = {
  findUserByUsername: jest.fn(async () => {
    return {
      id: 1,
      email: email,
      username: username,
      password_hash: await bcrypt.hash(password, SALT_ROUNDS)
    }
  }),
  findUserByEmail: jest.fn(async () => {
    return {
      id: 1,
      email: email,
      username: username,
      password_hash: await bcrypt.hash(password, SALT_ROUNDS)
    }
  }),
  insertUser: jest.fn(() => {
    return { id: 1 }
  })
}

const authService = AuthService(db)

describe('Register user', () => {
  describe('given a new username and password', () => {
    it('should return a token', async () => {
      db.findUserByUsername.mockResolvedValueOnce(null)
      db.findUserByEmail.mockResolvedValueOnce(null)
      const token = await authService.registerUser(username, email, password)
      expect(token).toBeTruthy()
    })
  })
  describe('given an existing username but new email', () => {
    it('should return 1', async () => {
      db.findUserByEmail.mockResolvedValueOnce(null)
      const token = await authService.registerUser(username, "new_test@gmail.com", "new_test_password")
      expect(token).toEqual(1)
    })
  })
  describe('given an existing email but new username', () => {
    it('should return 0', async () => {
      db.findUserByUsername.mockResolvedValueOnce(null)
      const token = await authService.registerUser("new_test_user", email, "new_test_password")
      expect(token).toEqual(0)
    })
  })
  describe('given an existing email and existing username', () => {
    it('should return 0', async () => {
      const token = await authService.registerUser(username, email, "new_test_password")
      expect(token).toEqual(0)
    })
  })
})

describe('Login user', () => {
  describe('given a valid email and password', () => {
    it('should return a token', async () => {
      const token = await authService.loginUser(email, password)
      expect(token).toBeTruthy()
    })
  })

  describe('given an invalid password', () => {
    it('should return null', async () => {
      const token = await authService.loginUser(email, 'invalid_password')
      expect(token).toBeFalsy()
    })
  })

  describe('given an invalid email', () => {
    it('should return null', async () => {
      db.findUserByEmail.mockResolvedValueOnce(null)
      const token = await authService.loginUser('invalid@gmail.com', password)
      expect(token).toBeFalsy()
    })
  })
})

describe('Verify token', () => {
  describe('given a valid token for a particular uid', () => {
    it('should return the same uid', async () => {
      const uid = 2
      const token = authService.generateToken(uid)
      const result = await authService.verifyToken(token)
      expect(result).toEqual(uid)
    })
  })

  describe('given an invalid token', () => {
    it('should return null', async () => {
      const token = 'gibberish'
      const result = await authService.verifyToken(token)
      expect(result).toBeNull()
    })
  })
})

