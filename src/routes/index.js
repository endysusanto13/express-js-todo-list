const express = require('express')
const swaggerUi = require('swagger-ui-express')
const swaggerJsdoc = require('swagger-jsdoc')

module.exports = (authMiddleware, authService, db) => {
  const router = express.Router()

  /**
   * @openapi
   * /:
   *  get:
   *    description: Default route
   *    responses:
   *      200:
   *        description: OK
   */
  router.get('/', (req, res, next) => {
    res.send('Welcome to Express JS TODO List! - Endy Susanto')
  })

  // Auth
  router.use('/', require('./auth') (authService))

  // Swagger Docs
  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Express JS TODO List',
        version: '1.0.0',
      },
    },
    apis: ['./src/routes/*.js'],
  }
  const swaggerSpec = swaggerJsdoc(options)
  router.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

  // All routes from this point will use the auth middleware
  router.use(authMiddleware)

  router.use('/share', require('./share')(db))
  router.use('/list', require('./lists')(db))
  router.use('/list', require('./tasks')(db))
  router.use('/', (req, res, next) => {
    res.status(404).send(
      "<h1>Page not found on the server</h1>")
})
  return router
}