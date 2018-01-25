const path = require('path');
const { debounce } = require('lodash');
const { writeJSON, ensureDir, copy } = require('fs-extra');
const fetch = require('make-fetch-happen');
const {
  createMinecraftInstance
} = require('@bauxite/minecraft-installer/lib/install');
const {
  getMinecraftVersions
} = require('@bauxite/minecraft-assets/lib/versions');
const { getVersionManifest } = require('@bauxite/minecraft-assets/lib/version');
const { getAssetManifest } = require('@bauxite/minecraft-assets/lib/assets');
const { generateInstanceName } = require('./instanceName');
const { getInstance } = require('./instances');
const { getConfiguration } = require('./config');
const { getOperatingSystem } = require('./utils');

const installInstance = async (
  inputInstanceID,
  versionID,
  { onProgress, cache = true, overwrite = false } = {}
) => {
  let instanceID;
  let existingInstance;
  if (inputInstanceID) {
    existingInstance = await getInstance(inputInstanceID);
    if (existingInstance && !overwrite) {
      throw new Error(`Instance "${inputInstanceID}" already exists`);
    } else {
      instanceID = inputInstanceID;
    }
  } else {
    do {
      instanceID = generateInstanceName();
    } while (await getInstance(instanceID));
  }

  const { directory: baseDirectory } = await getConfiguration();
  const cacheDirectory = path.join(baseDirectory, 'cache');
  const cachedFetch = fetch.defaults({
    cacheManager: cache ? cacheDirectory : 'no-cache'
  });
  if (cache) {
    await ensureDir(cacheDirectory);
  }

  const { versions = [] } = await getMinecraftVersions();
  const version = versions.find(({ ID }) => ID === versionID);
  if (!version)
    throw new Error(`Minecraft version ${versionID} does not exist`);
  const versionManifest = await getVersionManifest({
    manifestUrl: version.manifestUrl
  });
  const assetManifest = await getAssetManifest({
    manifestUrl: versionManifest.assetManifest.manifestUrl
  });

  const instanceDir = existingInstance
    ? existingInstance.directory
    : path.join(baseDirectory, 'instances', instanceID);
  const OS = getOperatingSystem();
  const instance = await createMinecraftInstance(
    instanceDir,
    {
      client: versionManifest.client,
      libraries: versionManifest.libraries[OS],
      assets: assetManifest,
      assetsIndex: versionManifest.assetManifest.ID
    },
    { onProgress, fetchOptions: { fetch: cachedFetch } }
  );

  const instanceConfigPath = path.join(instanceDir, 'bauxite.json');
  await writeJSON(instanceConfigPath, { versionID });

  return {
    ID: instanceID,
    directory: instanceDir,
    versionID
  };
};

const upgradeInstance = async (
  instanceID,
  versionID,
  { backupFirst = true, ...installConfig } = {}
) => {
  const existingInstance = await getInstance(instanceID);
  if (!existingInstance) {
    throw new Error(`Instance "${instanceID}" does not exist`);
  }

  if (backupFirst) {
    await backupInstance(instanceID);
  }

  return await installInstance(instanceID, versionID, {
    ...installConfig,
    overwrite: true
  });
};

const cloneInstance = async (instanceID, cloneInstanceID) => {
  const existingInstance = await getInstance(instanceID);
  if (!existingInstance) {
    throw new Error(`Instance "${instanceID}" does not exist`);
  }
  const existingTargetInstance = await getInstance(cloneInstanceID);
  if (existingTargetInstance) {
    throw new Error(`Instance "${cloneInstanceID}" already exists`);
  }

  const { directory: baseDirectory } = await getConfiguration();
  const clonedInstanceDirectory = path.join(
    baseDirectory,
    'instances',
    cloneInstanceID
  );
  await ensureDir(clonedInstanceDirectory);
  await copy(existingInstance.directory, clonedInstanceDirectory);
  return await getInstance(cloneInstanceID);
};

const backupInstance = async instanceID => {
  const existingInstance = await getInstance(instanceID)
  if (!existingInstance) {
    throw new Error(`Instance "${instanceID}" does not exist`);
  }
  const backupInstanceID = [
    instanceID,
    'backup',
    existingInstance.versionID,
    new Date().toISOString()
  ].join('-');
  return await cloneInstance(instanceID, backupInstanceID);
};

module.exports = {
  installInstance,
  upgradeInstance,
  cloneInstance,
  backupInstance
};
