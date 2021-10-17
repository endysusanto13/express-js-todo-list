require('dotenv').config()
const db = require('../src/db')

db.deleteAllTables().then(() => {
  console.log('All tables have been deleted.')
  process.exit()
}).catch((err) => {
  console.log(err)
  console.log('Database tables deletion failed')
  process.exit(1)
})