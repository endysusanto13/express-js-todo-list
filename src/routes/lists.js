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
    const userId = req.userId
    const { title } = req.body
    const isCreated = await db.findListByTitle(userId, title)
    if (isCreated) {
      errorMsg = `'${title}' has already been created by you.`
      res.status(400).send(errorMsg)
    }
    else {
      const newList = new List({ title, is_shared:false, is_deleted:false, create_user_id: userId, update_user_id: null })
      const list = await db.insertList(newList)
      res.status(201).send(list)
    }
  })

  return router
}