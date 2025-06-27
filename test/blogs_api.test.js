const { test, after, beforeEach, before, describe } = require('node:test')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const assert = require('node:assert')
const Blog = require('../models/blog')
const { insertTestUser } = require('./../utils/test_helper')

const api = supertest(app)

const INIT_BLOGS = [
  {
    title: 'React patterns',
    author: 'Michael Chan',
    url: 'https://reactpatterns.com/',
    likes: 7
  },
  {
    title: 'Go To Statement Considered Harmful',
    author: 'Edsger W. Dijkstra',
    url: 'http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html',
    likes: 5
  },
  {
    title: 'Canonical string reduction',
    author: 'Edsger W. Dijkstra',
    url: 'http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html',
    likes: 12
  },
  {
    title: 'First class tests',
    author: 'Robert C. Martin',
    url: 'http://blog.cleancoder.com/uncle-bob/2017/05/05/TestDefinitions.htmll',
    likes: 10
  },
  {
    title: 'TDD harms architecture',
    author: 'Robert C. Martin',
    url: 'http://blog.cleancoder.com/uncle-bob/2017/03/03/TDD-Harms-Architecture.html',
    likes: 0
  },
  {
    title: 'Type wars',
    author: 'Robert C. Martin',
    url: 'http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html',
    likes: 2
  }
]
let AUTH_TOKEN

before(async () => {
  await Blog.deleteMany({})
  await Blog.insertMany(INIT_BLOGS)
  await insertTestUser()
})

describe('when there is initially some notes saved', () => {

  test('blogs are returned as json', async () => {
    await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('all blogs are returned', async () => {
    const response = await api.get('/api/blogs')

    assert.strictEqual(response.body.length, INIT_BLOGS.length)
  })

  test('a specific note is within the returned notes', async () => {
    const response = await api.get('/api/blogs')

    const contents = response.body.map(e => e.title)
    assert(contents.includes('Type wars'))
  })

  test('blogs returned contains id property in the json', async () => {
    const response = await api.get('/api/blogs')
    assert.equal(Object.keys(response.body[0]).includes('id'), true)
  })

  describe('addition of a new blog', () => {

    beforeEach(async () => {
      const loginResponse = await api.post('/api/login').send({ username: 'testuser', password: 'sekret' })
      AUTH_TOKEN = `Bearer ${loginResponse.body.token}`
    })

    test('post a new blog with all properties succeed', async () => {
      const newPost = {
        title: 'World Wide War',
        author: 'Robert C. Martin',
        url: 'http://blog.cleancoder.com/uncle-bob/2016/05/01/WorldWideWars.html',
        likes: 2
      }

      await api.post('/api/blogs')
        .set('Authorization', AUTH_TOKEN)
        .send(newPost)
        .expect(201)
        .expect('Content-Type', /application\/json/)


      const getResponse = await api.get('/api/blogs')
      assert.strictEqual(getResponse.body.length, INIT_BLOGS.length + 1)

      const titles = getResponse.body.map(blog => blog.title)
      assert(titles.includes('World Wide War'))
    })

    test('Blog without likes would default to 0', async () => {
      const newNote = {
        title: 'Test test test until the end of the test',
        author: 'Robert C. Martin',
        url: 'http://blog.cleancoder.com/uncle-bob/2016/05/01/testestest.html',
      }

      const response = await api
        .post('/api/blogs')
        .set('Authorization', AUTH_TOKEN)
        .send(newNote)
        .expect(201)

      assert.strictEqual(response.body.likes, 0)
    })

    test('Blog without name would fail', async () => {
      const blogsFirst = await api.get('/api/blogs')
      const newNote = {
        author: 'Robert C. Martin',
        url: 'http://blog.cleancoder.com/uncle-bob/2016/05/01/testestest.html',
      }

      await api.post('/api/blogs')
        .set('Authorization', AUTH_TOKEN)
        .send(newNote)
        .expect(400)

      const blogsThen = await api.get('/api/blogs')

      assert.strictEqual(blogsFirst.body.length, blogsThen.body.length)
    })

    test('Blog without name would fail', async () => {
      const blogsFirst = await api.get('/api/blogs')
      const newNote = {
        title: 'Test test test until the end of the test',
        author: 'Robert C. Martin',
      }

      await api.post('/api/blogs')
        .set('Authorization', AUTH_TOKEN)
        .send(newNote)
        .expect(400)

      const blogsThen = await api.get('/api/blogs')

      assert.strictEqual(blogsFirst.body.length, blogsThen.body.length)
    })

  })

  describe('deletion of a Blog', () => {
    test('succeeds with status code 204 if id is valid', async () => {
      const blogsFirst = await api.get('/api/blogs')
      const blogToDelete = blogsFirst.body.filter(blog => blog.user)[0]

      await api.delete(`/api/blogs/${blogToDelete.id}`)
        .set('Authorization', AUTH_TOKEN)
        .expect(204)

      const blogsAtEnd = await api.get('/api/blogs')
      const titles = blogsAtEnd.body.map(n => n.title)

      assert(!titles.includes(blogToDelete.title))
      assert.strictEqual(blogsAtEnd.body.length, blogsFirst.body.length - 1)
    })

    test('Fails with status code 404 if id is not found', async () => {
      const blogsFirst = await api.get('/api/blogs')

      await api.delete('/api/blogs/685521de13b143f66ddc3430')
        .set('Authorization', AUTH_TOKEN)
        .expect(404)

      const blogsAtEnd = await api.get('/api/blogs')

      assert.strictEqual(blogsAtEnd.length, blogsFirst.length)
    })

    test('Fails with status code 400 if id is not valid', async () => {
      await api.delete('/api/blogs/685521de13b143f66ddc34302')
        .set('Authorization', AUTH_TOKEN)
        .expect(400)
    })
  })

  describe('editing a blog', () => {
    test('edit blog succeed when editing likes', async () => {
      const blogsFirst = await api.get('/api/blogs')
      const blogEdit = blogsFirst.body[0]
      const editBlogContent = {
        likes: blogEdit.likes + 1
      }

      await api.put(`/api/blogs/${blogEdit.id}`).send(editBlogContent).expect(200)

      const blogsThen = await api.get('/api/blogs')
      const blogEdited = blogsThen.body.find(blog => blog.id === blogEdit.id)

      assert.strictEqual(blogsFirst.body.length, blogsThen.body.length)
      assert.strictEqual(blogEdited.likes, blogEdit.likes + 1)
    })

    test('edit blog succeed when editing title and author', async () => {
      const blogsFirst = await api.get('/api/blogs')
      const blogEdit = blogsFirst.body[0]
      const editBlogContent = {
        title: 'Completed Invented test Title',
        author: 'the one to ruing your movie'
      }

      await api.put(`/api/blogs/${blogEdit.id}`).send(editBlogContent).expect(200)

      const blogsThen = await api.get('/api/blogs')
      const blogEdited = blogsThen.body.find(blog => blog.id === blogEdit.id)

      assert.strictEqual(blogsFirst.body.length, blogsThen.body.length)
      assert.strictEqual(blogEdited.title,'Completed Invented test Title')
      assert.strictEqual(blogEdited.author,'the one to ruing your movie')
    })

    test('edit blog returns 404 when editing unexistent blog', async () => {
      const editBlogContent = {
        title: 'Completed Invented test Title',
        author: 'the one to ruing your movie'
      }

      await api.put('/api/blogs/685521de13b143f66ddc3430').send(editBlogContent).expect(404)
    })

  })
})

after(async () => {
  await mongoose.connection.close()
})




