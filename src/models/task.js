class Task {
  constructor({ id, title, is_deleted, create_user_id, update_user_id, list_id }) {
    this.id = id
    this.title = title
    this.is_deleted = is_deleted
    this.create_user_id = create_user_id
    this.update_user_id = update_user_id
    this.list_id = list_id
  }
}

module.exports = Task