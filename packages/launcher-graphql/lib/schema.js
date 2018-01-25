const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const {
  makeExecutableSchema,
  makeRemoteExecutableSchema
} = require('graphql-tools')
const { execute, parse } = require('graphql')
const resolvers = require('./resolvers')
const readFile = promisify(fs.readFile)

const getTypeDefs = async () =>
  await readFile(path.join(__dirname, 'types.graphql'), 'utf8')

const makeSchema = async () => {
  const typeDefs = await getTypeDefs()
  return makeExecutableSchema({ typeDefs, resolvers })
}

const makeRemoteSchema = async ({ root = {} }) => {
  const schema = await makeSchema()
  const fetcher = async ({ query, variables, operationName, context }) => {
    return await execute(
      schema,
      parse(query),
      root,
      context,
      variables,
      operationName
    )
  }
  return makeRemoteExecutableSchema({ schema, fetcher })
}

module.exports = { getTypeDefs, makeSchema, makeRemoteSchema }
