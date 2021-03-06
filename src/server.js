require('dotenv').config()
const App = require('./app')
const Router = require('./routes')
const AuthMiddleware = require('./middlewares/auth')
const AuthService = require('./services/auth')
const AmqpService = require('./services/amqp')
const db = require('./db')

const authService = AuthService(db)
const amqpService = AmqpService()
const authMiddleware = AuthMiddleware(authService)
const router = Router(authMiddleware, authService, amqpService, db)
const app = App(router)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`)
})