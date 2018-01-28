const {
  makeExecutableSchema,
  makeRemoteExecutableSchema
} = require('graphql-tools')
const { execute, parse } = require('graphql')
const resolvers = require('./resolvers')
const getSchema = require('./schema')

const makeSchema = async () => {
  const typeDefs = await getSchema()
  return makeExecutableSchema({ typeDefs, resolvers })
}

module.exports = { makeSchema }
