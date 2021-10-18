const request = require('supertest')
const utils = require('./utils')
const List = require('../src/models/list');
const Users_Share_Lists = require('../src/models/share');

const app = utils.app
const db = utils.db

const tokens = ['','','']

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
const testUser3 = {
  username:'3test_user', 
  email: '3test@gmail.com', 
  password: '3test_password'
}
const testUsers = [testUser1, testUser2, testUser3]

const list1 = new List({ 
  title:'first_todo_list',
})
const list2 = new List({ 
  title:'second_todo_list',
})
const list3 = new List({ 
  title:'third_todo_list',
})
const lists = [list1, list2, list3]

const sharedList1 = new Users_Share_Lists({
  list_id:1,
  shared_by_email:'1test@gmail.com',
  shared_with_email:'2test@gmail.com',
  is_deleted:false,
})
const sharedList2 = new Users_Share_Lists({
  list_id:1,
  shared_by_email:'2test@gmail.com',
  shared_with_email:'3test@gmail.com',
  is_deleted:false,
})

beforeAll(async () => {
  await utils.setup()
})

afterAll(async () => {
  await db.clearUsersTable()
  await db.clearListsTable()
  await db.clearUsersShareListsTable()
  await utils.teardown()
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

  lists.map(async (list, index) => {
    describe(`create list ${index+1}`, () => {
      it('should return 201 and list title as the response', async () => {
        return await request(app)
          .post('/list')
          .set('Authorization', tokens[index])
          .send(list)
          .expect(201)
          .then(response => {
            expect(response.body)
              .toMatchObject({ 
                id:index+1,
                title:lists[index].title,
                is_shared:false,
                is_deleted:false,
                create_user_id:index+1,
                update_user_id:null
              })
          })
      })
    })
  })
})

describe('POST /list/:listId', () => {

  describe('sharing a list', () => {
    describe('that is valid', () => {
      it('should return 200', async () => {
        return await request(app)
          .post(`/share/list/${1}`)
          .set('Authorization', tokens[0])
          .send({ email:testUser2.email })
          .expect(200)  
          .then(response => {
            expect(response.body).toMatchObject(sharedList1)
          })
      })
    })

    describe('to an unregistered email', () => {
      it('should return 404', async () => {
        return await request(app)
          .post(`/share/list/${1}`)
          .set('Authorization', tokens[0])
          .send({ email:"unregistered@gmail.com" })
          .expect(404)  
          .then(response => {
            expect(response.text).toEqual(`Email 'unregistered@gmail.com' is not found.`)
          })
      })
    })        

    describe('by unauthorized user', () => {
      it('should return 403', async () => {
        return await request(app)
          .post(`/share/list/${1}`)
          .set('Authorization', tokens[2])
          .send({ email:testUser3.email })
          .expect(403)  
          .then(response => {
            expect(response.text).toEqual(`You are not authorized to access this TODO list.`)
          })
      })
    })

    describe('that does not exist', () => {
      it('should return 404', async () => {
        return await request(app)
          .post(`/share/list/${13}`)
          .set('Authorization', tokens[0])
          .send({ email:testUser2.email })
          .expect(404)  
          .then(response => {
            expect(response.text).toEqual(`List id ${13} is not found.`)
          })
      })
    })

    describe('that has been shared before', () => {
      it('should return 400', async () => {
        return await request(app)
          .post(`/share/list/${1}`)
          .set('Authorization', tokens[0])
          .send({ email:testUser2.email })
          .expect(400)  
          .then(response => {
            expect(response.text).toEqual(`${list1.title} is already shared to ${testUser2.email}.`)
          })
      })
    })
  
  })
})

