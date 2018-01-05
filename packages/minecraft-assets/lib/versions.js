const defaultFetch = require('make-fetch-happen')

const defaultManifestUrl =
  'https://launchermeta.mojang.com/mc/game/version_manifest.json'

const getMinecraftVersions = async ({
  fetch = defaultFetch,
  manifestUrl = defaultManifestUrl,
  ...fetchOptions
} = {}) => {
  const result = await fetch(manifestUrl, fetchOptions)
  const manifest = await result.json()
  return formatMinecraftVersions(manifest)
}

const typeMap = {
  snapshot: 'Snapshot',
  release: 'Release',
  old_beta: 'Beta',
  old_alpha: 'Alpha'
}

const formatMinecraftVersions = ({ latest, versions }) => {
  const formattedVersions = versions.map(
    ({ id, type, time, releaseTime, url }) => ({
      ID: id,
      type: typeMap[type],
      uploadedAt: new Date(time),
      releasedAt: new Date(releaseTime),
      manifestUrl: url
    })
  )

  const resolvedLatest = Object.entries(latest).reduce(
    (obj, [type, versionID]) => {
      obj[typeMap[type]] = formattedVersions.find(({ ID }) => versionID === ID)
      return obj
    },
    {}
  )

  return { versions: formattedVersions, latest: resolvedLatest }
}

const getMinecraftVersionByID = async versionID => {
  const { versions } = await getMinecraftVersions()
  return versions.find(({ ID }) => ID === versionID)
}

const getLatestMinecraftVersionByType = async (type = 'Release') => {
  const { latest } = await getMinecraftVersions()
  return latest[type]
}

module.exports = {
  getMinecraftVersions,
  formatMinecraftVersions,
  getMinecraftVersionByID,
  getLatestMinecraftVersionByType
}
