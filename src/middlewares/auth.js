module.exports = (service) => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]
    if (token) {
      const userId = service.verifyToken(token)
      if (userId !== null) {
        req.userId = userId
        return next()
      }
    }
    res.status(401).send('Unauthorized')
  }
}