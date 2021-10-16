require('dotenv').config()
const App = require('./app')
const Router = require('./routes')

const router = Router()
const app = App(router)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`)
})