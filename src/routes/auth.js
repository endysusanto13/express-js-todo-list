const express = require('express')

module.exports = (service) => {
  const router = express.Router()

  /**
   * @openapi
   * components:
   *  schemas:
   *    User:
   *      type: object
   *      required:
   *        - username
   *        - email
   *        - password
   *      properties:
   *        username:
   *          type: string
   *        email:
   *          type: string
   *        password:
   *          type: string
   */

  /**
   * @openapi
   * /register:
   *  post:
   *    tags:
   *    - auth
   *    description: Register a user
   *    requestBody:
   *      required: true
   *      content:
   *        application/json:
   *          schema:
   *            $ref: '#/components/schemas/User'
   *    responses:
   *      201:
   *        description: Created
   *      400:
   *        description: Invalid login credentials
   */
  router.post('/register', async (req, res, next) => {
    const { username, email, password } = req.body
    const token = await service.registerUser(username, email, password)
    if (token !== 0 && token !== 1) {
      res.status(201).send({ token: token })
    } else if (token === 0) {
      res.status(400).send(`Email ${email} is already registered`)
    } else if (token === 1) {
      res.status(400).send(`Username ${username} is already used.`)
    } else {
      res.status(400).send(`Unknown error has occurred.`)
    }
  })

  /**
   * @openapi
   * /login:
   *  post:
   *    tags:
   *    - auth
   *    description: Login a user
   *    requestBody:
   *      required: true
   *      content:
   *        application/json:
   *          schema:
   *            $ref: '#/components/schemas/User'
   *    responses:
   *      200:
   *        description: OK
   *      401:
   *        description: Invalid login credentials
   */
  router.post('/login', async (req, res, next) => {
    const { email , password } = req.body
    const token = await service.loginUser(email, password)
    if (token) {
      res.send({ token: token })
    } else {
      res.status(401).send('Invalid login credentials.')
    }
  })

  return router
}