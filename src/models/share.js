class Users_Share_Lists {
  constructor({ list_id, shared_by_email, shared_with_email, is_deleted }) {
    this.list_id = list_id
    this.shared_by_email = shared_by_email
    this.shared_with_email = shared_with_email
    this.is_deleted = is_deleted
  }
}

module.exports = Users_Share_Lists