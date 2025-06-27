const { beforeEach, after, describe, test } = require('node:test')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app') // Your Express app
const User = require('../models/user')
const assert = require('node:assert')
const { insertTestUser } = require('../utils/test_helper')

const api = supertest(app)

beforeEach(async () => {
  await insertTestUser()
})

describe('User API', () => {
  test('creation succeeds with a fresh username and valid password', async () => {
    const usersAtStart = await User.find({})
    const newUser = {
      name: 'New User',
      username: 'newuser',
      password: 'password123'
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await User.find({})
    assert.equal(usersAtEnd.length, usersAtStart.length + 1)
    const usernames = usersAtEnd.map(u => u.username)
    assert.ok(usernames.includes(newUser.username))
  })

  test('creation fails with proper status and message if username already taken', async () => {
    const newUser = {
      name: 'Another User',
      username: 'testuser',
      password: 'password123'
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)

    assert.ok(result.body.error)
    assert.equal(result.body.error, 'expected `username` to be unique')
  })

  test('creation fails if password is missing', async () => {
    const newUser = {
      name: 'No Password',
      username: 'nopassword'
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)

    assert.equal(result.body.error, 'password is required to create the user')
  })

  test('creation fails if password is too short', async () => {
    const newUser = {
      name: 'Short Password',
      username: 'shortpass',
      password: '12'
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)

    assert.equal(result.body.error, 'password must be at least 3 characters')
  })

  test('get all users returns users as json', async () => {
    const response = await api
      .get('/api/users')
      .expect(200)
      .expect('Content-Type', /application\/json/)

    assert.ok(Array.isArray(response.body))
    assert.ok(response.body[0].username)
  })

  test('creation fails if username is missing', async () => {
    const newUser = {
      name: 'No Username',
      password: '12343'
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)

    assert.deepEqual(result.body.error.includes('username is required to create the user'), true)
  })

  test('creation fails if username is shorter than 3 characters', async () => {
    const newUser = {
      name: 'No Username',
      username: 'sa',
      password: '12343'
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)

    assert.deepEqual(result.body.error.includes('minimum length is 3 characters'), true)
  })
})

after(async () => {
  await mongoose.connection.close()
})