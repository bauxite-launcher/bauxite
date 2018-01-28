const path = require('path')
const { pathExists, ensureDir, writeJSON, readJSON } = require('fs-extra')
const { getConfiguration } = require('./config')
const {
  getMinecraftVersions: fetchMinecraftVersions
} = require('@bauxite/minecraft-assets/lib/versions')
const {
  getVersionManifest: fetchVersionManifest
} = require('@bauxite/minecraft-assets/lib/version')
const {
  getAssetManifest: fetchAssetManifest
} = require('@bauxite/minecraft-assets/lib/assets')

// TODO: In-memory cache as well, maybe?
const cachedFetcher = ({ fetch, makePath }) => async (...args) => {
  const { directory: baseDirectory } = await getConfiguration()
  const cachePath = path.join(baseDirectory, 'cache', await makePath(...args))
  const cachedData =
    (await pathExists(cachePath)) && (await readJSON(cachePath))

  if (cachedData) {
    return cachedData
  }

  const freshData = await fetch(...args)
  await ensureDir(path.dirname(cachePath))
  await writeJSON(cachePath, freshData)
  return freshData
}

const getMinecraftVersions = cachedFetcher({
  fetch: fetchMinecraftVersions,
  makePath: () => `minecraft-versions.json`
})

const getVersionManifest = cachedFetcher({
  fetch: async versionID => {
    const { versions } = await getMinecraftVersions()
    const version = versions.find(({ ID }) => ID === versionID)
    if (!version) {
      throw new Error(
        `Cannot fetch manifest for invalid Minecraft version ${versionID}`
      )
    }
    return await fetchVersionManifest({ manifestUrl: version.manifestUrl })
  },
  makePath: versionID => `minecraft-${versionID}.json`
})

const getAssetManifest = cachedFetcher({
  fetch: async ({ manifestUrl }) => await fetchAssetManifest({ manifestUrl }),
  makePath: ({ ID }) => `minecraft-assets-${ID}.json`
})

module.exports = {
  getMinecraftVersions,
  getVersionManifest,
  getAssetManifest
}
