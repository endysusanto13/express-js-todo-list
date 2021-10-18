// For future middleware

// module.exports = (db) => {
//   const service = {}

//   service.verifyList = async (listId, reqUserId, res) => {
//     const list = await db.findListByListId(listId)

//     if (!list) {
//       res.status(404).send(`List id ${listId} is not found`)
//     }
//     else if (list.is_deleted) {
//       res.status(404).send(`List id ${listId} is not found`)
//     }
//     else if (list.create_user_id !== reqUserId) {
//       res.status(403).send(`You are not authorized to delete this TODO list.`)
//     }
//     else {
//       return list
//     }
//     return false
//   }

//   return service
// }






// const ListService = require('./list')
// const { getMockRes } = require('@jest-mock/express')

// const listId = 1
// const reqUserId = 1

// const db = {
//   findListByListId: jest.fn(async () => {
//     return {
//       id:listId,
//       title:'test_todo_list',
//       is_shared:false,
//       is_deleted:false,
//       create_user_id:reqUserId,
//       update_user_id:null
//     }
//   })
// }

// const listService = ListService(db)

// describe('Given a list id', () => {
//   const { res } = getMockRes()
//   describe('that does not exist', () => {
//     it('should return 404', async () => {
//       db.findListByListId.mockReturnValue(null)
//       const list = listService.verifyList(listId, reqUserId, res)
//       expect(list).toBeFalsy()
//     })
//   })
// })