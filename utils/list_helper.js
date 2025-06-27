const lodash = require('lodash')

const dummy = () => {
  return 1
}

const totalLikes = (blogs) => {
  return blogs.reduce((sum, blog) => sum + blog.likes, 0)
}

const favoriteBlog = (blogs) => {
  return blogs.reduce((result, current) => {
    if (Object.keys(result).length === 0
          || Math.max(result?.likes, current.likes) === current.likes) {
      result = current
    }
    return result
  }, {})
}

const mostBlogs = (blogs) => {
  const listOfAuthors = lodash.groupBy(blogs, blog => blog.author)
  const mostBlogsAuthor = lodash.maxBy(Object.keys(listOfAuthors), autor => listOfAuthors[autor].length)
  return mostBlogsAuthor ? { author: mostBlogsAuthor, blogs: listOfAuthors[mostBlogsAuthor].length } : {}
}

const mostLikes = (blogs) => {
  if (Object.keys(blogs).length === 0) {
    return {}
  }
  const listOfAuthors = lodash.groupBy(blogs, blog => blog.author)
  const mappedAuthors = lodash.map(Object.keys(listOfAuthors), author => {
    return { author: author, likes: listOfAuthors[author].reduce((sum, current) => sum + current.likes, 0) }
  })

  return lodash.maxBy(mappedAuthors, author => author.likes)
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes
}