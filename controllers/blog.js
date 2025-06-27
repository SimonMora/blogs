const blogRouter = require('express').Router()
const Blog = require('./../models/blog')
const User = require('./../models/user')
const { userExtractor } = require('./../utils/middleware')


blogRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({}).populate('user', { name: 1, username: 1, id: 1 })
  response.json(blogs)
})

blogRouter.post('/', userExtractor, async (request, response) => {
  const body = request.body
  const user = await User.findById(request.user)

  if (!user) {
    return response.status(400).json({ error: 'User ID not exists' })
  }

  const blog = new Blog({ ...body, user: user._id })


  const savedBlog = await blog.save()
  user.blogs = user.blogs.concat(savedBlog._id)
  await user.save()

  return response.status(201).json(savedBlog)
})

blogRouter.delete('/:id', userExtractor, async (request, response) => {
  const id = request.params.id
  const savedBlog = await Blog.findById(id)

  if (!savedBlog) {
    return response.status(404).end()
  }
  if (savedBlog.user.toString() !== request.user) {
    return response.status(400).json('User must be the owner to delete a blog.')
  }

  await savedBlog.deleteOne()

  return response.status(204).end()

})

blogRouter.put('/:id', async (request, response) => {
  const body = request.body
  const id = request.params.id
  const record = await Blog.findByIdAndUpdate(id, { ...body })

  if (record) {
    response.status(200).json(record)
  } else {
    response.status(404).json({ error : 'No record to update.' })
  }
})

module.exports = blogRouter