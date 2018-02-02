const path = require('path')
const { defaultsDeep } = require('lodash')
const { GraphQLDateTime } = require('graphql-iso-date')
const configResolvers = require('./config')
const installResolvers = require('./install')
const profilesResolvers = require('./profiles')
const instancesResolvers = require('./instances')
const launchResolvers = require('./launch')
const versionsResolvers = require('./versions')
const pkg = require('../../package.json')
const { getInstalledPlugins } = require('@bauxite/launcher-api')
const apiPkg = require('@bauxite/launcher-api/package.json')

const installedPlugins = getInstalledPlugins()

const baseResolvers = {
  Query: {
    version: () => pkg.version,
    apiVersion: () => apiPkg.version,
    plugins: () => installedPlugins.names
  },
  Mutation: {
    ping: () => 'pong!'
  },
  DateTime: GraphQLDateTime
}

const pluginResolvers = installedPlugins.names.map(plugin =>
  require(`./plugins/${plugin}`)
)

module.exports = defaultsDeep(
  {},
  baseResolvers,
  configResolvers,
  installResolvers,
  profilesResolvers,
  instancesResolvers,
  versionsResolvers,
  launchResolvers,
  ...pluginResolvers
)
