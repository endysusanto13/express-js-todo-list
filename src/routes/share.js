const express = require('express');
const share = require('../db/share');
const Users_Share_Lists = require('../models/share')

module.exports = (db, amqpService) => {
  const router = express.Router()
  
  /**
   * @openapi
   * components:
   *  schemas:
   *    Users_Share_Lists:
   *      type: object
   *      required:
   *        - email
   *      properties:
   *        email:
   *          type: string
   *  securitySchemes:
   *    bearerAuth:
   *      type: http
   *      scheme: bearer
   *      bearerFormat: JWT
   */

  /**
   * @openapi
   * /share/list/{listId}:
   *  post:
   *    security:
   *    - bearerAuth: []
   *    tags:
   *    - share
   *    description: Give list access to other user
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
   *            $ref: '#/components/schemas/Users_Share_Lists'
   *    responses:
   *      200:
   *        description: OK
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/Users_Share_Lists'
   *      400:
   *        description: List has been shared before
   *      401:
   *        description: User is not logged in
   *      403:
   *        description: User does not have access
   *      404:
   *        description: List/email is not found
   */
  router.post('/list/:listId', async (req, res, next) => {
    const listId = req.params.listId
    const reqUserId = req.userId
    const { email } = req.body

    // Define variables outside to reduce unnecessary queries
    let sharedListArr = []
    let hasAccess = false
    let alreadyShared = false
    
    const user = await db.findUserByID(reqUserId)
    const sharedByEmail = user.email

    const recipient = await db.findUserByEmail(email)
    const sharedWithEmail = recipient ? recipient.email : null

    const list = await db.findListByListId(listId)
    
    // Grant access if the requester is the creator of the list
    if (list && list.create_user_id === reqUserId) {
      hasAccess = true
    } 

    // Do not query if list has never been shared
    if(list && list.is_shared) {
      sharedListArr = await db.getSharedList(listId)

      // Grant access if the list has been shared to the requester before
      if (sharedListArr.length > 0) {
      sharedListArr.map((sharedList) => {
        if (sharedList.shared_with_email === sharedByEmail) { hasAccess = true }
        // Flag it if this list has been shared to the recipient before
        if (sharedList.shared_with_email === email) { alreadyShared = true }
      })
      }
    }

    if (!sharedWithEmail) {
      res.status(404).send(`Email '${email}' is not found.`)
    } 
    // One potential drawback of placing 404 error before 403 is that unauthorized user can check whether list exists.
    // However, if 403 error is placed before, user might not know if the list does not exist
    else if (!list || list.is_deleted) {
      res.status(404).send(`List id ${listId} is not found.`)
    } else if (!hasAccess) {
      res.status(403).send(`You are not authorized to access this TODO list.`) 
    } else if (alreadyShared) {
      res.status(400).send(`${list.title} is already shared to ${email}.`) 
    } else {
      const sharedList = await db.shareList(new Users_Share_Lists({ list_id:listId, shared_by_email:sharedByEmail, shared_with_email:sharedWithEmail, is_deleted:false }))
      if(!list.is_shared) { await db.updateShareStatusList(listId) }
      await amqpService.publishRegistration({ email, task:list.title })
      res.status(200).send(sharedList)
    }
  })

  return router
}