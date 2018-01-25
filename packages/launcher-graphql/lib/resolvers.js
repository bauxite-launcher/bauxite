const path = require('path');
const { GraphQLDateTime } = require('graphql-iso-date');
const {
  getConfiguration,
  listInstances,
  getInstance,
  deleteInstance,
  renameInstance,
  startInstance,
  stopInstance,
  getCurrentProcessIDForInstance,
  listProfiles,
  createProfile,
  deleteProfile,
  installInstance,
  upgradeInstance,
  cloneInstance,
  backupInstance
} = require('@bauxite/launcher-api');

module.exports = {
  Query: {
    configuration: getConfiguration,
    instances: listInstances,
    instance: (root, { ID }) => getInstance(ID),
    profiles: listProfiles
  },
  Mutation: {
    installInstance: async (root, { ID, version }) =>
      await installInstance(ID, version),
    upgradeInstance: async (root, { ID, newVersion, backupFirst }) =>
      await upgradeInstance(ID, newVersion, { backupFirst }),
    cloneInstance: async (root, { ID, newID }) =>
      await cloneInstance(ID, newID),
    backupInstance: async (root, { ID }) => await backupInstance(ID),
    deleteInstance: async (root, { ID }) => await deleteInstance(ID),
    renameInstance: async (root, { oldID, newID }) =>
      await renameInstance(oldID, newID),
    startInstance: async (root, { ID, username }) => {
      await startInstance(ID, username);
      return await getInstance(ID);
    },
    stopInstance: async (root, { ID }) => {
      await stopInstance(ID);
      return await getInstance(ID);
    },
    createProfile: async (root, { username, password }) =>
      await createProfile(username, password),
    deleteProfile: async (root, { username }) => await deleteProfile(username)
  },
  MinecraftInstallation: {
    processID: async ({ ID }) => await getCurrentProcessIDForInstance(ID)
  },
  DateTime: GraphQLDateTime
};
