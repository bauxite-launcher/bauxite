const { getConfiguration, setConfiguration } = require('./config');
const {
  listProfiles,
  createProfile,
  deleteProfile,
  getAccessToken,
  getProfileByUsername,
  getProfileByUUID,
  getProfileByName,
  getDefaultProfile,
  setDefaultProfile
} = require('./profiles');
const {
  listInstances,
  getInstance,
  deleteInstance,
  renameInstance
} = require('./instances');
const { installInstance } = require('./install');
const {
  startInstance,
  stopInstance,
  getCurrentProcessIDForInstance
} = require('./launch');
const { getOperatingSystem } = require('./utils');
const { generateInstanceName } = require('./instanceName');

module.exports = {
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
  listInstances,
  getInstance,
  deleteInstance,
  renameInstance,
  installInstance,
  startInstance,
  stopInstance,
  getCurrentProcessIDForInstance,
  getOperatingSystem,
  generateInstanceName
};
