const request = require('supertest')
const utils = require('./utils')
const List = require('../src/models/list')
const Users_Share_Lists = require('../src/models/share');
const lists = require('../src/db/lists');

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
  
  describe('create a list', () => {
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

  describe('create a list with existing title', () => {
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

  const updatedRefList = { 
    ...refList, 
    title:updatedList.title, 
    update_user_id:userId 
  }

  describe('create a list for test purpose', () => {
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
    describe('by users that create the list', () => {
      it('should return List object', async () => {
        return await request(app)
          .patch(`/list/${listId}`)
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
          .patch(`/list/${listId}`)
          .set('Authorization', anotherToken)
          .send({ title: 'unauthorised_todo_list' })
          .expect(403)
          .then(response => {
            expect(response.text).toEqual(`You are not authorized to edit this TODO list.`)
          })
      })
      it('should return empty object', async () => {
        return await request(app)
          .patch(`/list/${listId}`)
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
          .patch(`/list/${invalidListId}`)
          .set('Authorization', token)
          .send({ title: 'invisible_todo_list' })
          .expect(404)
          .then(response => {
            expect(response.text).toEqual(`List id ${invalidListId} is not found.`)
          })
      })
    })
    
    describe('without any change in title', () => {
      it('should return 400', async () => {
        return await request(app)
          .patch(`/list/${listId}`)
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
  
  describe('create a list for test purpose', () => {
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
          .delete(`/list/${listId}`)
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
            expect(response.text).toEqual(`List id ${invalidListId} is not found.`)
          })
      })
    })

    describe('by users with access', () => {
      const deletedList = { 
        ...refList, 
        is_deleted:true,
        update_user_id:userId
      }
      it('should return 200 and success text', async () => {
        return await request(app)
          .delete(`/list/${listId}`)
          .set('Authorization', token)
          .expect(200)
          .then(response => {
            expect(response.body).toMatchObject(deletedList)
          })
      })
    })

    describe('that has been deleted', () => {
      it('should return 404', async () => {
        return await request(app)
          .delete(`/list/${listId}`)
          .set('Authorization', token)
          .expect(404)
          .then(response => {
            expect(response.text).toEqual(`List id ${listId} is not found.`)
          })
      })
    })
  })

  describe('updating list that is deleted', () => {
    const updatedList = {
      title: 'modified_todo_list'
    }
    it('should return 404', async () => {
      return await request(app)
        .patch(`/list/${listId}`)
        .set('Authorization', token)
        .send(updatedList)
        .expect(404)
        .then(response => {
          expect(response.text).toEqual(`List id ${listId} is not found.`)
        })
    })
  })
})

describe('Test features of sharing tasks', () => {
  let tokens = ['','','']

  const testUser1 = {
    username:'1test_user', 
    email: '1test@gmail.com', 
    password: '1test_password'
  }
  const testUser2 = {
    username:'2test_user', 
    email: '2test@gmail.com', 
    password: '2test_password'
  }
  const testUsers = [testUser1, testUser2]
  
  const list = new List({ 
    title:'brand_new_todo_list',
  })

  const sharedList1 = new Users_Share_Lists({
    list_id:1,
    shared_by_email:'1test@gmail.com',
    shared_with_email:'2test@gmail.com',
    is_deleted:false,
  })

  const updatedSharedList = {
    title: 'modified_shared_todo_list'
  }

  const updatedRefList = { 
    id:sharedList1.list_id,
    title:updatedSharedList.title,
    is_shared: true,
    is_deleted:false,
    create_user_id:1,
    update_user_id:2
  }
  const deletedRefList = { 
    ...updatedRefList,
    is_deleted:true
  }

  beforeAll(async () => {
    await db.clearUsersTable()
    await db.clearListsTable()
  })

  describe('prepare list for test', () => {
    testUsers.map( async (testUser, index) => {
      describe(`create user ${index+1}`, () => {
        it('should return 201 and token', async () => {
          const token  = await utils.registerUser(testUser.username, testUser.email, testUser.password)
          tokens[index] = token
        })
      })
    })
  
    describe(`create list`, () => {
      it('should return 201 and list title as the response', async () => {
        return await request(app)
          .post('/list')
          .set('Authorization', tokens[0])
          .send(list)
          .expect(201)
          .then(response => {
            expect(response.body)
              .toMatchObject({ 
                id:1,
                title:list.title,
                is_shared:false,
                is_deleted:false,
                create_user_id:1,
                update_user_id:null
              })
          })
      })
    })
    
    describe('sharing a list', () => {
        it('should return 200', async () => {
          return await request(app)
            .post(`/share/list/${sharedList1.list_id}`)
            .set('Authorization', tokens[0])
            .send({ email:testUser2.email })
            .expect(200)  
            .then(response => {
              expect(response.body).toMatchObject(sharedList1)
            })
        })
    })
  })

  describe('users that do not create the list but has access should be able to', () => {
    describe('update the list', () => {
      it('should return 200', async () => {

        return await request(app)
          .patch(`/list/${sharedList1.list_id}`)
          .set('Authorization', tokens[1])
          .send(updatedSharedList)
          .expect(200)
          .then(response => {
            expect(response.body).toMatchObject(updatedRefList)
          })
      })
    })

    describe('delete the list', () => {
      it('should return 200', async () => {
        return await request(app)
          .delete(`/list/${sharedList1.list_id}`)
          .set('Authorization', tokens[1])
          .expect(200)
          .then(response => {
            expect(response.body).toMatchObject(deletedRefList)
          })
      })
    })
  })
})
    