const request = require('supertest')
const utils = require('./utils')
const List = require('../src/models/list')
const Task = require('../src/models/task')

const app = utils.app
const db = utils.db

let token = undefined
let userId = 1

const listId = 1

const testList = {
  title: 'new_todo_list'
}

const refList = new List({ 
  id:listId,
  title:testList.title,
  is_shared: false,
  is_deleted:false,
  create_user_id:userId,
  update_user_id:null
})

const taskId = 1

const testTask = {
  title: 'new_todo_task'
}

const refTask = new Task({ 
  id:taskId,
  title:testTask.title,
  is_deleted:false,
  create_user_id:userId,
  update_user_id:null,
  list_id:listId

})

beforeAll(async () => {
  await utils.setup()
  token = await utils.registerUser()
  anotherToken = await utils.registerUser('another_test_user', 'another_test@gmail.com', 'another_test_password')
})

afterAll(async () => {
  await utils.teardown()
})

describe('create a list to contain tasks', () => {
  it('should return 201 and list title as the response', async () => {
    return await request(app)
      .post('/list')
      .set('Authorization', token)
      .send(testList)
      .expect(201)  
      .then(response => {
        expect(response.body).toMatchObject(refList)
      })
  })
})

describe('POST /task', () => {
  beforeAll(async () => {
    await db.clearTasksTable()
  })
  
  describe('create a task', () => {
    it('should return 201 and task title as the response', async () => {
      return await request(app)
        .post(`/list/${listId}/task`)
        .set('Authorization', token)
        .send(testTask)
        .expect(201)
        .then(response => {
          expect(response.body).toMatchObject(refTask)
        })
    })
  })

  describe('create a task with existing title', () => {
    it('should return 400', async () => {
      return await request(app)
        .post(`/list/${listId}/task`)
        .set('Authorization', token)
        .send(testTask)
        .expect(400)
        .then(response => {
          expect(response.text).toEqual(`'${testTask.title}' has already been created by you.`)
        })
    })
  })

  describe('given that users are not logged in', () => {
    it('should return 401', async () => {
      return await request(app)
        .post(`/list/${listId}/task`)
        .set('Authorization', null)
        .send(testTask)
        .expect(401)
    })
  })

  describe('given that token is invalid', () => {
    it('should return 401', async () => {
      let wrongToken = "invalid_token"
      return await request(app)
        .post(`/list/${listId}/task`)
        .set('Authorization', wrongToken)
        .send(testTask)
        .expect(401)
    })
  })

  describe('given that users has no access', () => {
    it('should return 403', async () => {
      return await request(app)
        .post(`/list/${listId}/task`)
        .set('Authorization', anotherToken)
        .send(testTask)
        .expect(403)
    })
  })
})

describe('PATCH /list/:listId/task/:taskId', () => {
  beforeAll(async () => {
    await db.clearTasksTable()
  })
  
  const updatedTask = {
    title: 'modified_todo_task'
  }

  const updatedRefTask = { 
    ...refTask, 
    title:updatedTask.title, 
    update_user_id:userId 
  }

  describe('create a task for test purpose', () => {
    it('should return 201 and task title as the response', async () => {
      return await request(app)
        .post(`/list/${listId}/task/`)
        .set('Authorization', token)
        .send(testTask)
        .expect(201)  
        .then(response => {
          expect(response.body).toMatchObject(refTask)
        })
    })
  })

  describe('update task', () => {
    describe('by users with access', () => {
      it('should return Task object', async () => {
        return await request(app)
          .patch(`/list/${listId}/task/${taskId}`)
          .set('Authorization', token)
          .send(updatedTask)
          .expect(200)
          .then(response => {
            expect(response.body).toMatchObject(updatedRefTask)
          })
      })
    })
    
    describe('by users without access', () => {
      it('should return 403', async () => {
        return await request(app)
          .patch(`/list/${listId}/task/${taskId}`)
          .set('Authorization', anotherToken)
          .send({ title: 'unauthorised_todo_task' })
          .expect(403)
          .then(response => {
            expect(response.text).toEqual(`You are not authorized to edit this TODO list.`)
          })
      })
      it('should return empty object', async () => {
        return await request(app)
          .patch(`/list/${listId}/task/${taskId}`)
          .set('Authorization', anotherToken)
          .send({ title: 'unauthorised_todo_task' })
          .expect(403)
          .then(response => {
            expect(response.body).toMatchObject({})
          })
      })
    })
    describe('with invalid task id', () => {
      let invalidTaskId = 4
      it('should return 404', async () => {
        return await request(app)
          .patch(`/list/${listId}/task/${invalidTaskId}`)
          .set('Authorization', token)
          .send({ title: 'invisible_todo_task' })
          .expect(404)
          .then(response => {
            expect(response.text).toEqual(`Task id ${invalidTaskId} is not found.`)
          })
      })
    })
    
    describe('without any change in title', () => {
      it('should return 400', async () => {
        return await request(app)
          .patch(`/list/${listId}/task/${taskId}`)
          .set('Authorization', token)
          .send(updatedTask)
          .expect(400)
          .then(response => {
            expect(response.text).toEqual(`There is no change to ${updatedTask.title}.`)
          })
      })
    })
  })
})

describe('DELETE /:listId/task/:taskId', () => {
  beforeAll(async () => {
    await db.clearTasksTable()
  })
  
  describe('create a task for test purpose', () => {
    it('should return 201 and task title as the response', async () => {
      return await request(app)
        .post(`/list/${listId}/task/`)
        .set('Authorization', token)
        .send(testTask)
        .expect(201)
        .then(response => {
          expect(response.body).toMatchObject(refTask)
        })
    })
  })

  describe('delete task', () => {
    describe('by users without access', () => {
      it('should return 403', async () => {
        return await request(app)
          .delete(`/list/${listId}/task/${taskId}`)
          .set('Authorization', anotherToken)
          .expect(403)
          .then(response => {
            expect(response.text).toEqual(`You are not authorized to delete this TODO list.`)
          })
      })
    })
    describe('with invalid task id', () => {
      let invalidTaskId = 42
      it('should return 404', async () => {
        return await request(app)
          .delete(`/list/${listId}/task/${invalidTaskId}`)
          .set('Authorization', token)
          .expect(404)
          .then(response => {
            expect(response.text).toEqual(`Task id ${invalidTaskId} is not found.`)
          })
      })
    })

    describe('by users with access', () => {
      const deletedTask = { 
        ...refTask, 
        is_deleted:true,
        update_user_id:userId
      }
      it('should return 200 and success text', async () => {
        return await request(app)
          .delete(`/list/${listId}/task/${taskId}`)
          .set('Authorization', token)
          .expect(200)
          .then(response => {
            expect(response.body).toMatchObject(deletedTask)
          })
      })
    })

    describe('that has been deleted', () => {
      it('should return 404', async () => {
        return await request(app)
          .delete(`/list/${listId}/task/${taskId}`)
          .set('Authorization', token)
          .expect(404)
          .then(response => {
            expect(response.text).toEqual(`Task id ${taskId} is not found.`)
          })
      })
    })
  })

  describe('updating task that is deleted', () => {
    const updatedTask = {
      title: 'modified_todo_task'
    }
    it('should return 404', async () => {
      return await request(app)
        .patch(`/list/${listId}/task/${taskId}`)
        .set('Authorization', token)
        .send(updatedTask)
        .expect(404)
        .then(response => {
          expect(response.text).toEqual(`Task id ${taskId} is not found.`)
        })
    })
  })
})