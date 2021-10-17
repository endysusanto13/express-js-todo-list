class List {
  constructor({ id, title, is_shared, is_deleted, user_id }) {
    this.id = id
    this.title = title
    this.is_shared = is_shared
    this.is_deleted = is_deleted
    this.user_id = user_id
  }
}

module.exports = List