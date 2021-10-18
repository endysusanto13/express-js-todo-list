const express = require('express')
const Task = require('../models/task')

module.exports = (db) => {
  const router = express.Router()
  
  /**
   * @openapi
   * components:
   *  schemas:
   *    Task:
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
   * /list/{listId}:
   *  get:
   *    security:
   *    - bearerAuth: []
   *    tags:
   *    - lists
   *    description: Get a list with their respective subtasks
   *    parameters:
   *      - in: path
   *        name: listId
   *        schema:
   *          type: integer
   *        required: true
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
  
   router.get('/:listId', async (req, res, next) => {
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
        const sharedList = await db.getSharedList(listId)
        const sharedUsers = []

        sharedList.map((data) => {
          sharedUsers.push(data.shared_with_email)
        })

        const taskTitles = []
        const tasks = await db.findTaskByListId(listId)
        tasks.map((task) => {
          if (!task.is_deleted) {
            taskTitles.push(task.title)
          }
        })
        const searchedList = ({
          ...list,
          shared_user_id:sharedUsers,
          tasks:taskTitles
        })
        
        res.send(searchedList)
      }
    }
  })

  /**
   * @openapi
   * /list/{listId}/task:
   *  post:
   *    security:
   *    - bearerAuth: []
   *    tags:
   *    - tasks
   *    description: Create a new task within a TODO list
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
   *            $ref: '#/components/schemas/Task'
   *    responses:
   *      201:
   *        description: Created
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/Task'
   *      400:
   *        description: Task has been created before
   *      401:
   *        description: User is not logged in
   *      403:
   *        description: User does not have access
   */

  router.post('/:listId/task', async (req, res, next) => {
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
      else {
        const isCreated = await db.findTaskByTitle(listId, title)
        if (isCreated) {
          errorMsg = `'${title}' has already been created by you.`
          res.status(400).send(errorMsg)
        }
        else {
          const newTask = new Task({ title, is_deleted:false, create_user_id: reqUserId, update_user_id: null, list_id:listId })
          const task = await db.insertTask(newTask)
          res.status(201).send(task)
        }
      }
    }
  })

  /**
   * @openapi
   * /list/{listId}/task/{taskId}:
   *  patch:
   *    security:
   *    - bearerAuth: []
   *    tags:
   *    - tasks
   *    description: Update a task
   *    parameters:
   *      - in: path
   *        name: listId
   *        schema:
   *          type: integer
   *        required: true
   *      - in: path
   *        name: taskId
   *        schema:
   *          type: integer
   *        required: true
   *    requestBody:
   *      required: true
   *      content:
   *        application/json:
   *          schema:
   *            $ref: '#/components/schemas/Task'
   *    responses:
   *      200:
   *        description: OK
   *      401:
   *        description: User is not logged in
   *      403:
   *        description: User does not have access
   *      404:
   *        description: Task is not found
   */
  router.patch('/:listId/task/:taskId', async (req, res, next) => {
    const listId = req.params.listId
    const taskId = req.params.taskId
    const reqUserId = req.userId
    const { title } = req.body
    const list = await db.findListByListId(listId)
    const task = await db.findTaskByTaskId(taskId)
    if (!list || list.is_deleted) {
      res.status(404).send(`List id ${listId} is not found.`)
    }
    else if (list.create_user_id !== reqUserId && !list.is_shared) {
      res.status(403).send(`You are not authorized to edit this TODO list.`) 
    }
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
        if (!task || task.is_deleted) {
          res.status(404).send(`Task id ${taskId} is not found.`)
        }
        else if (title === task.title) {
          res.status(400).send(`There is no change to ${task.title}.`) 
        }
        else {
          const updatedTask = await db.updateTask(reqUserId, title, taskId)
          res.send(updatedTask)
        }
      }
    }

  })


  /**
   * @openapi
   * /list/{listId}/task/{taskId}:
   *  delete:
   *    security:
   *    - bearerAuth: []
   *    tags:
   *    - tasks
   *    description: Delete a task
   *    parameters:
   *      - in: path
   *        name: listId
   *        schema:
   *          type: integer
   *        required: true
   *      - in: path
   *        name: taskId
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
   *        description: Task is not found
   */
  router.delete('/:listId/task/:taskId', async (req, res, next) => {
    const listId = req.params.listId
    const taskId = req.params.taskId
    const reqUserId = req.userId
    const list = await db.findListByListId(listId)
    const task = await db.findTaskByTaskId(taskId)
    if (!list || list.is_deleted) {
      res.status(404).send(`List id ${listId} is not found.`)
    }
    else if (list.create_user_id !== reqUserId && !list.is_shared) {
      res.status(403).send(`You are not authorized to delete this TODO list.`) 
    }
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
      else if (!task || task.is_deleted) {
        res.status(404).send(`Task id ${taskId} is not found.`)
      }
      else {
        const deletedTask = await db.deleteTask(reqUserId, taskId)
        res.send(deletedTask)
      }
    }
  })

  return router
}