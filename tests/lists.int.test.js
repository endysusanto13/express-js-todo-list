const request = require('supertest')
const utils = require('./utils')
const List = require('../src/models/list')

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

beforeAll(async () => {
  await utils.setup()
  token = await utils.registerUser()
})

afterAll(async () => {
  await utils.teardown()
})

describe('POST /list', () => {
  beforeAll(async () => {
    await db.clearListsTable()
  })
  
  describe('create an item', () => {
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

  describe('create an item with existing title', () => {
    it('should return 400', async () => {
      return await request(app)
        .post('/list')
        .set('Authorization', token)
        .send(testList)
        .expect(400)
        .then(response => {
          expect(response.text).toEqual(`'${testList.title}' has already been created by you.`)
        })
    })
  })

  describe('given that users are not logged in', () => {
    it('should return 401', async () => {
      return await request(app)
        .post('/list')
        .set('Authorization', null)
        .send(testList)
        .expect(401)
    })
  })

  describe('given that token is invalid', () => {
    it('should return 401', async () => {
      let wrongToken = "invalid_token"
      return await request(app)
        .post('/list')
        .set('Authorization', wrongToken)
        .send(testList)
        .expect(401)
    })
  })
})

describe('PATCH /list/:listId', () => {
  beforeAll(async () => {
    await db.clearListsTable()
    anotherToken = await utils.registerUser('another_test_user', 'another_test@gmail.com', 'another_test_password')
  })
  
  const updatedList = {
    title: 'modified_todo_list'
  }

  const updatedRefList = { ...refList, title:updatedList.title, update_user_id:userId }

  describe('create an item for test purpose', () => {
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

  describe('update list', () => {
    describe('by users with access', () => {
      it('should return List object', async () => {
        return await request(app)
          .patch('/list/' + listId)
          .set('Authorization', token)
          .send(updatedList)
          .expect(200)
          .then(response => {
            expect(response.body).toMatchObject(updatedRefList)
          })
      })
    })
    
    describe('by users without access', () => {
      it('should return 403', async () => {
        return await request(app)
          .patch('/list/' + listId)
          .set('Authorization', anotherToken)
          .send({ title: 'unauthorised_todo_list' })
          .expect(403)
          .then(response => {
            expect(response.text).toEqual(`You are not authorized to edit this TODO list.`)
          })
      })
      it('should return empty object', async () => {
        return await request(app)
          .patch('/list/' + listId)
          .set('Authorization', anotherToken)
          .send({ title: 'unauthorised_todo_list' })
          .expect(403)
          .then(response => {
            expect(response.body).toMatchObject({})
          })
      })
    })
    describe('with invalid list id', () => {
      let invalidListId = 4
      it('should return 404', async () => {
        return await request(app)
          .patch('/list/' + invalidListId)
          .set('Authorization', token)
          .send({ title: 'invisible_todo_list' })
          .expect(404)
          .then(response => {
            expect(response.text).toEqual(`List id ${invalidListId} is not found`)
          })
      })
    })
    
    describe('without any change in title', () => {
      it('should return 400', async () => {
        return await request(app)
          .patch('/list/' + listId)
          .set('Authorization', token)
          .send(updatedList)
          .expect(400)
          .then(response => {
            expect(response.text).toEqual(`There is no change to ${updatedList.title}.`)
          })
      })
    })
  })
})

describe('DELETE /list/:listId', () => {
  beforeAll(async () => {
    await db.clearListsTable()
  })
  
  describe('create an item for test purpose', () => {
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

  describe('delete list', () => {
    describe('by users without access', () => {
      it('should return 403', async () => {
        return await request(app)
          .delete('/list/' + listId)
          .set('Authorization', anotherToken)
          .expect(403)
          .then(response => {
            expect(response.text).toEqual(`You are not authorized to delete this TODO list.`)
          })
      })
    })
    describe('with invalid list id', () => {
      let invalidListId = 4
      it('should return 404', async () => {
        return await request(app)
          .delete('/list/' + invalidListId)
          .set('Authorization', token)
          .expect(404)
          .then(response => {
            expect(response.text).toEqual(`List id ${invalidListId} is not found`)
          })
      })
    })

    describe('by users with access', () => {
      it('should return 200 and success text', async () => {
        return await request(app)
          .delete('/list/' + listId)
          .set('Authorization', token)
          .expect(200)
          .then(response => {
            expect(response.text).toEqual(`TODO list '${testList.title}' with id ${listId} has been deleted successfully`)
          })
      })
    })
    
  })
})