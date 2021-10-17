require('dotenv').config({ path: '.env.test' })
const App = require('../src/app')
const Router = require('../src/routes')
const AuthMiddleware = require('../src/middlewares/auth')
const AuthService = require('../src/services/auth')
const db = require('../src/db')

const utils = {}

const authService = AuthService(db)
const authMiddleware = AuthMiddleware(authService)
const router = Router(authMiddleware, authService, db)
const app = App(router)

utils.app = app
utils.db = db

utils.setup = async () => {
  await db.initialise()
  await db.clearUsersTable()
  await db.clearListsTable()
  await db.clearTasksTable()
  await db.clearUsersShareListsTable()
}

utils.teardown = async () => {
  await db.end()
}

utils.registerUser = async (username = 'test_user', email = 'test@gmail.com', password = 'test_password') => {
  const token = await authService.registerUser(username, email, password)
  return `Bearer ${token}`
}

module.exports = utils