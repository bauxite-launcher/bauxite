const path = require('path')
const { defaultsDeep } = require('lodash')
const { GraphQLDateTime } = require('graphql-iso-date')
const configResolvers = require('./config')
const installResolvers = require('./install')
const profilesResolvers = require('./profiles')
const instancesResolvers = require('./instances')
const launchResolvers = require('./launch')
const versionsResolvers = require('./versions')
const forgeResolvers = require('./forge')
const pkg = require('../../package.json')
const apiPkg = require('@bauxite/launcher-api/package.json')

const baseResolvers = {
  Query: {
    version: () => pkg.version,
    apiVersion: () => apiPkg.version
  },
  Mutation: {
    ping: () => 'pong!'
  },
  DateTime: GraphQLDateTime
}

module.exports = defaultsDeep(
  {},
  baseResolvers,
  configResolvers,
  installResolvers,
  profilesResolvers,
  instancesResolvers,
  versionsResolvers,
  forgeResolvers
)
