const User = require('../models/user')
const bcrypt = require('bcrypt')


const insertTestUser = async () => {
  await User.deleteMany({})
  const passwordHash = await bcrypt.hash('sekret', 10)
  const user = new User({ name: 'Test User', username: 'testuser', password: passwordHash })
  await user.save()
}

module.exports = {
  insertTestUser
}