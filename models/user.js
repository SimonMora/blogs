const mongoose = require('mongoose')

const userSchema = mongoose.Schema({
  name: String,
  username: {
    type: String,
    minLength: [3, 'minimum length is 3 characters'],
    required: [true, 'username is required to create the user'],
    unique: true
  },
  password: {
    type: String,
    required: [true, 'password is required to create the user']
  },
  blogs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog'
  }]
})

userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
    delete returnedObject.password
  }
})

module.exports = mongoose.model('User', userSchema)