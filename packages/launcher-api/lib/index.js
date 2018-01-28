const { getConfiguration, setConfiguration } = require('./config')
const {
  listProfiles,
  createProfile,
  deleteProfile,
  getAccessToken,
  getProfileByUsername,
  getProfileByUUID,
  getProfileByName,
  getDefaultProfile,
  setDefaultProfile,
  getAvatarByUuid
} = require('./profiles')
const {
  listInstances,
  getInstance,
  deleteInstance,
  renameInstance
} = require('./instances')
const {
  installInstance,
  upgradeInstance,
  cloneInstance,
  backupInstance
} = require('./install')
const {
  startInstance,
  stopInstance,
  getCurrentProcessIDForInstance
} = require('./launch')
const { getOperatingSystem, getInstalledPlugins } = require('./utils')
const { generateInstanceName } = require('./instanceName')

const coreModules = {
  getConfiguration,
  setConfiguration,
  listProfiles,
  createProfile,
  deleteProfile,
  getAccessToken,
  getProfileByUsername,
  getProfileByUUID,
  getProfileByName,
  getDefaultProfile,
  setDefaultProfile,
  getAvatarByUuid,
  listInstances,
  getInstance,
  deleteInstance,
  renameInstance,
  installInstance,
  upgradeInstance,
  cloneInstance,
  backupInstance,
  startInstance,
  stopInstance,
  getCurrentProcessIDForInstance,
  getOperatingSystem,
  generateInstanceName,
  getInstalledPlugins
};

const plugins = getInstalledPlugins()

module.exports = { ...coreModules, ...plugins }
