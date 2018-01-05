const path = require('path')
const { GraphQLDateTime } = require('graphql-iso-date')
const { getConfiguration } = require('../lib/config')
const {
  listInstances,
  getInstance,
  deleteInstance,
  renameInstance
} = require('../lib/instances')
const {
  startInstance,
  stopInstance,
  getCurrentProcessIDForInstance
} = require('../lib/launch')
const {
  listProfiles,
  createProfile,
  deleteProfile
} = require('../lib/profiles')
const { installInstance } = require('../lib/install')

module.exports = {
  Query: {
    configuration: getConfiguration,
    instances: listInstances,
    instance: (root, { ID }) => getInstance(ID),
    profiles: listProfiles
  },
  Mutation: {
    installInstance: async (root, { ID, version }) => {
      return await installInstance(ID, version)
    },
    upgradeInstance: async (root, { ID, newVersion }) => {
      throw new Error('Not yet implemented')
    },
    deleteInstance: async (root, { ID }) => await deleteInstance(ID),
    renameInstance: async (root, { oldID, newID }) =>
      await renameInstance(oldID, newID),
    startInstance: async (root, { ID, username }) => {
      await startInstance(ID, username)
      return await getInstance(ID)
    },
    stopInstance: async (root, { ID }) => {
      await stopInstance(ID)
      return await getInstance(ID)
    },
    createProfile: async (root, { username, password }) =>
      await createProfile(username, password),
    deleteProfile: async (root, { username }) => await deleteProfile(username)
  },
  MinecraftInstallation: {
    processID: async ({ ID }) => await getCurrentProcessIDForInstance(ID)
  },
  DateTime: GraphQLDateTime
}
