const path = require('path')
const { debounce } = require('lodash')
const { writeJSON, ensureDir } = require('fs-extra')
const fetch = require('make-fetch-happen')
const {
  createMinecraftInstance
} = require('@bauxite/minecraft-installer/lib/install')
const {
  getMinecraftVersions
} = require('@bauxite/minecraft-assets/lib/versions')
const { getVersionManifest } = require('@bauxite/minecraft-assets/lib/version')
const { getAssetManifest } = require('@bauxite/minecraft-assets/lib/assets')
const { generateInstanceName } = require('./instanceName')
const { getInstance } = require('./instances')
const { getConfiguration } = require('./config')
const { getOperatingSystem } = require('./utils')

const installInstance = async (
  inputInstanceID,
  versionID,
  { onProgress, cache = true } = {}
) => {
  let instanceID
  if (inputInstanceID) {
    if (await getInstance(inputInstanceID)) {
      throw new Error(`Instance "${inputInstanceID}" already exists`)
    } else {
      instanceID = inputInstanceID
    }
  } else {
    do {
      instanceID = generateInstanceName()
    } while (await getInstance(instanceID))
  }

  const { directory: baseDirectory } = await getConfiguration()
  const cacheDirectory = path.join(baseDirectory, 'cache')
  const cachedFetch = fetch.defaults({
    cacheManager: cache ? cacheDirectory : 'no-cache'
  })
  if (cache) {
    await ensureDir(cacheDirectory)
  }

  const { versions = [] } = await getMinecraftVersions()
  const version = versions.find(({ ID }) => ID === versionID)
  if (!version) throw new Error(`Minecraft version ${versionID} does not exist`)
  const versionManifest = await getVersionManifest({
    manifestUrl: version.manifestUrl
  })
  const assetManifest = await getAssetManifest({
    manifestUrl: versionManifest.assetManifest.manifestUrl
  })

  const instanceDir = path.join(baseDirectory, 'instances', instanceID)
  const OS = getOperatingSystem()
  const instance = await createMinecraftInstance(
    instanceDir,
    {
      client: versionManifest.client,
      libraries: versionManifest.libraries[OS],
      assets: assetManifest,
      assetsIndex: versionManifest.assetManifest.ID
    },
    {
      onProgress: onProgress && progressWithSpeed(onProgress),
      fetchOptions: { fetch: cachedFetch }
    }
  )

  await writeJSON(path.join(instanceDir, 'bauxite.json'), { versionID })

  return {
    ID: instanceID,
    directory: instanceDir,
    versionID
  }
}

const progressWithSpeed = onProgress => {
  let lastUpdateTime = Date.now()
  return ({ delta = 0, ...rest }) => {
    const now = Date.now()
    const secondsSinceLastUpdate = (now - lastUpdateTime) / 1000
    const speed = delta ? delta / secondsSinceLastUpdate : 0
    onProgress({ delta, speed, ...rest })
    lastUpdateTime = now
  }
}

module.exports = { installInstance }
