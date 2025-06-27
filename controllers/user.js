const userRouter = require('express').Router()
const User = require('./../models/user')
const bcrypt = require('bcrypt')

userRouter.post('/', async (request, response) => {
  const { name, username, password } = request.body

  if (!password || password.length < 3) {
    response.status(400).json({ error: password ? 'password must be at least 3 characters' : 'password is required to create the user' })
  }

  const saltRounds = 10
  const hashPassword = await bcrypt.hash(password, saltRounds)

  const newUser = User({
    name: name,
    username: username,
    password: hashPassword
  })

  const savedUser = await newUser.save()

  response.status(201).json(savedUser)
})

userRouter.get('/', async (request, response) => {
  const allUsers = await User.find({}).populate('blogs')
  response.status(200).json(allUsers)
})

module.exports = userRouter