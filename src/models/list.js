class List {
  constructor({ id, title, is_shared, is_deleted, create_user_id, update_user_id }) {
    this.id = id
    this.title = title
    this.is_shared = is_shared
    this.is_deleted = is_deleted
    this.create_user_id = create_user_id
    this.update_user_id = update_user_id
  }
}

module.exports = List