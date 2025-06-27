const loginRouter = require('express').Router()
const bcrypt = require('bcrypt')
const User = require('./../models/user')
const jwt = require('jsonwebtoken')

loginRouter.post('/', async (request, response) => {
  const { username, password } = request.body
  const user = await User.findOne({ username })

  if (!user) {
    return response.status(400).json({ error: 'user not found' })
  }

  const passwordVerify = await bcrypt.compare(password, user.password)

  if (!passwordVerify) {
    return response.status(401).json({ error: 'Unauthorized, password and username don\'t match' })
  }

  const userForToken = {
    username: user.username,
    id: user._id
  }

  const token = jwt.sign(userForToken, process.env.SECRET, { expiresIn: 3600 })

  response.status(200).json({
    ...userForToken,
    token
  })
})

module.exports = loginRouter