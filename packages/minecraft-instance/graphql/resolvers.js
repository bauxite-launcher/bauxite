const path = require('path')
const throttle = require('lodash.throttle')
const get = require('lodash.get')
const { GraphQLDateTime } = require('graphql-iso-date')
const GraphQLInt64 = require('./int64Resolver')
const { readServerListing } = require('../lib/servers')
const { findClient } = require('../lib/client')

const testInstanceDirectory = path.resolve(__dirname, '..', 'lib', 'fixtures')

module.exports = {
  Query: {
    testInstance: () => ({ directory: testInstanceDirectory })
  },
  LocalInstance: {
    servers: async ({ directory }) => await readServerListing(directory),
    client: async ({ directory }) => await findClient(directory)
  },
  DateTime: GraphQLDateTime,
  Int64: GraphQLInt64
}
