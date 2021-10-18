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
   *      400:
   *        description: List has been created before
   *      401:
   *        description: User is not logged in
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

  /**
   * @openapi
   * /list/{listId}:
   *  patch:
   *    tags:
   *    - list
   *    description: Update a list
   *    parameters:
   *      - in: path
   *        name: listId
   *        schema:
   *          type: integer
   *        required: true
   *    requestBody:
   *      required: true
   *      content:
   *        application/json:
   *          schema:
   *            $ref: '#/components/schemas/List'
   *    responses:
   *      200:
   *        description: OK
   *      401:
   *        description: User is not logged in
   *      403:
   *        description: User does not have access
   *      404:
   *        description: List is not found
   */
  router.patch('/:listId', async (req, res, next) => {
    const listId = req.params.listId
    const reqUserId = req.userId
    const { title } = req.body
    const list = await db.findListByListId(listId)
    // #TODO - Check list in shared list later on
    if (!list || list.is_deleted) {
      res.status(404).send(`List id ${listId} is not found.`)
    }
    else if (list.create_user_id !== reqUserId) {
      res.status(403).send(`You are not authorized to edit this TODO list.`) 
    }
    else if (title === list.title) {
      res.status(400).send(`There is no change to ${list.title}.`) 
    }
    else {
      const updatedList = await db.updateList(reqUserId, title, listId)
      res.send(updatedList)
    }
  })


  /**
   * @openapi
   * /list/{listId}:
   *  delete:
   *    tags:
   *    - list
   *    description: Delete a list
   *    parameters:
   *      - in: path
   *        name: listId
   *        schema:
   *          type: integer
   *        required: true
   *    responses:
   *      200:
   *        description: OK
   *      401:
   *        description: User is not logged in
   *      403:
   *        description: User does not have access
   *      404:
   *        description: List is not found
   */
  router.delete('/:listId', async (req, res, next) => {
    const listId = req.params.listId
    const reqUserId = req.userId
    const list = await db.findListByListId(listId)

    // #TODO - Check list in shared list later on
    if (!list || list.is_deleted) {
      res.status(404).send(`List id ${listId} is not found.`)
    }
    else if (list.create_user_id !== reqUserId) {
      res.status(403).send(`You are not authorized to delete this TODO list.`)
    }
    else {
      const deletedList = await db.deleteList(reqUserId, listId)
      res.send(deletedList)
    }
  })

  return router
}