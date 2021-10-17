const express = require('express')
const List = require('../models/list')

module.exports = (db) => {
  const router = express.Router()
  
  /**
   * @openapi
   * components:
   *  schemas:
   *    List:
   *      type: object
   *      required:
   *        - title
   *      properties:
   *        title:
   *          type: string
   */

  /**
   * @openapi
   * /list:
   *  post:
   *    tags:
   *    - lists
   *    description: Create a new TODO list
   *    requestBody:
   *      required: true
   *      content:
   *        application/json:
   *          schema:
   *            $ref: '#/components/schemas/List'
   *    responses:
   *      201:
   *        description: Created
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/List'
   */
  router.post('/', async (req, res, next) => {
    const { title } = req.body
    const isCreated = await db.findListByTitle(title)
    if (isCreated) {
      errorMsg = `'${title}' has already been created by you.`
      res.status(400).send(errorMsg)
    }
    else {
      const userId = req.userId
      const newList = new List({ title, is_shared:false, is_deleted:false, user_id: userId })
      const list = await db.insertList(newList)
      res.status(201).send(list)
    }
  })

  return router
}