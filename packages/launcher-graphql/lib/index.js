const { makeExecutableSchema } = require('graphql-tools')
const { execute, parse } = require('graphql')
const resolvers = require('./resolvers')
const getSchema = require('./schema')

const makeSchema = async () =>
  makeExecutableSchema({ typeDefs: await getSchema(), resolvers })

module.exports = { makeSchema }
