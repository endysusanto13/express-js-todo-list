const express = require('express')
const List = require('../models/list')

module.exports = (db) => {
  const router = express.Router()
  
  /**
   * @openapi
   * components:
   *  schemas:
   *    Lists:
   *      type: object
   *      required:
   *        - title
   *      properties:
   *        title:
   *          type: string
   *  securitySchemes:
   *    bearerAuth:
   *      type: http
   *      scheme: bearer
   *      bearerFormat: JWT
   */

  /**
   * @openapi
   * /list:
   *  get:
   *    security:
   *    - bearerAuth: []
   *    tags:
   *    - lists
   *    description: Get all lists that a user has access to
   *    responses:
   *      200:
   *        description: OK
   *        content:
   *          application/json:
   *            schema:
   *              type: array
   *              lists:
   *                $ref: '#/components/schemas/List'
   *      401:
   *        description: Invalid login credentials
   */
  
  router.get('/', async (req, res, next) => {
    const reqUserId = req.userId
    const user = await db.findUserByID(reqUserId)

    // allCreatedLists and allSharedLists include those that are soft deleted
    const allCreatedLists = await db.getAllLists(reqUserId)
    const allSharedLists = await db.getListSharedWith(user.email)
    
    let createdLists = []
    let sharedLists = []
    allCreatedLists.map((list)=> {
      if (!list.is_deleted) {
        createdLists.push(list)
      }
    })
    allSharedLists.map((list)=> {
      if (!list.is_deleted) {
        sharedLists.push(list)
      }
    })

    if (createdLists.length === 0 && sharedLists.length === 0) {
      errorMsg = `You do not have any lists.`
      res.status(404).send(errorMsg)
    }
    else {
      const lists = {
        created_lists:createdLists,
        shared_list:sharedLists
      }
      res.status(200).send(lists)
    }
  })

  /**
   * @openapi
   * /list:
   *  post:
   *    security:
   *    - bearerAuth: []
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
    const list = await db.findListByTitle(userId, title)
    if (list && !list.is_deleted) {
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
   *    security:
   *    - bearerAuth: []
   *    tags:
   *    - lists
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

    if (!list || list.is_deleted) {
      res.status(404).send(`List id ${listId} is not found.`)
    }
    else if (list.create_user_id !== reqUserId && !list.is_shared) {
      res.status(403).send(`You are not authorized to edit this TODO list.`) 
    }
    // if list is shared and you are part of the user that is shared
    else {
      const user = await db.findUserByID(reqUserId)
      const reqEmail = user.email

      let hasAccess = list.create_user_id === reqUserId

      const sharedListArr = await db.getSharedList(listId)
      if (sharedListArr.length > 0 && !hasAccess) {
        sharedListArr.map((sharedList) => {
          if (sharedList.shared_with_email === reqEmail) { hasAccess = true }
        })
      }
      if (!hasAccess) {
        res.status(403).send(`You are not authorized to edit this TODO list.`) 
      }
      else if (title === list.title) {
        res.status(400).send(`There is no change to ${list.title}.`) 
      }
      else {
        const updatedList = await db.updateList(reqUserId, title, listId)
        res.send(updatedList)
      }
    }
  })

  /**
   * @openapi
   * /list/{listId}:
   *  delete:
   *    security:
   *    - bearerAuth: []
   *    tags:
   *    - lists
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

    if (!list || list.is_deleted) {
      res.status(404).send(`List id ${listId} is not found.`)
    }
    else if (list.create_user_id !== reqUserId && !list.is_shared) {
      res.status(403).send(`You are not authorized to delete this TODO list.`)
    }
    // if list is shared and you are part of the user that is shared
    else {
      const user = await db.findUserByID(reqUserId)
      const reqEmail = user.email

      let hasAccess = list.create_user_id === reqUserId

      const sharedListArr = await db.getSharedList(listId)
      if (sharedListArr.length > 0 && !hasAccess) {
        sharedListArr.map((sharedList) => {
          if (sharedList.shared_with_email === reqEmail) { hasAccess = true }
        })
      }
      if (!hasAccess) {
        res.status(403).send(`You are not authorized to delete this TODO list.`) 
      }
      else {
        const deletedList = await db.deleteList(reqUserId, listId)
        res.send(deletedList)
      }
    }
  })

  return router
}