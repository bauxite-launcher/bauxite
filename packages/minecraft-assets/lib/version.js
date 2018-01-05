const defaultFetch = require('make-fetch-happen')
const { getMinecraftVersionByID } = require('./versions')

const getVersionManifest = async ({
  manifestUrl,
  fetch = defaultFetch,
  ...fetchOptions
}) => {
  const result = await fetch(manifestUrl, fetchOptions)
  const assetManifest = await result.json()
  return formatVersionManifest(assetManifest)
}

const getVersionManifestForVersion = async versionID => {
  const version = await getMinecraftVersionByID(versionID)
  if (!version) {
    throw new Error(`Minecraft version "${versionID}" does not exist`)
  }
  const { manifestUrl } = version
  return await getVersionManifest({ manifestUrl })
}

const formatVersionManifest = ({
  id,
  assetIndex,
  libraries,
  downloads,
  ...rest
}) => {
  return {
    ID: id,
    assetManifest: {
      ID: assetIndex.id,
      manifestUrl: assetIndex.url,
      sha1: assetIndex.sha1,
      manifestSize: assetIndex.size,
      totalSize: assetIndex.totalSize
    },
    libraries: resolveLibrariesByOs(libraries),
    client: formatClient(downloads.client, rest),
    server: downloads.server
  }
}

const formatClient = (
  download,
  { minimumLauncherVersion, mainClass, minecraftArguments, logging }
) => ({
  minimumLauncherVersion,
  mainClass,
  download,
  arguments: minecraftArguments,
  logging: formatLoggingConfig(logging.client)
})

const formatLoggingConfig = ({ argument, file, type }) => ({
  argument,
  download: {
    ...file,
    path: file.id
  },
  type
})

const allOs = ['Windows', 'OSX', 'Linux']
const baseLibrariesByOs = () =>
  allOs.reduce((obj, os) => {
    obj[os] = []
    return obj
  }, {})
const resolveLibrariesByOs = libraries => {
  return libraries.reduce((byOs, library) => {
    allOs
      .filter(libraryPermitsOs(library))
      .forEach(os => byOs[os].push(formatLibrary(library, os.toLowerCase())))
    return byOs
  }, baseLibrariesByOs())
}
const libraryPermitsOs = ({ rules }) => os => {
  if (!rules || !rules.length) return true
  const lcOs = os.toLowerCase()
  return rules.reduce((allowed, rule) => {
    const ruleApplies = rule.os ? rule.os.name === lcOs : true
    return ruleApplies ? rule.action === 'allow' : allowed
  }, false)
}
const formatLibrary = ({ name, downloads, natives, extract, rules }, os) => {
  const formattedDownloads = []

  if (natives && natives[os]) {
    formattedDownloads.push(
      formatDownload(downloads.classifiers[natives[os]], { native: true })
    )
  } else if (downloads.artifact) {
    formattedDownloads.push(formatDownload(downloads.artifact))
  }
  const formattedRules = rules ? rules.map(formatRule) : null
  return {
    ID: name,
    extract,
    rules: formattedRules,
    downloads: formattedDownloads
  }
}
const formatDownload = ({ sha1, ...rest }, extra = {}) => ({
  ID: sha1,
  sha1,
  ...rest,
  ...extra
})
const formatRule = ({ action, os }) => ({
  action: action === 'allow' ? 'Allow' : 'Deny',
  os: os
    ? {
        name: allOs.find(thisOs => thisOs.toLowerCase() === os.name),
        version: os.version
      }
    : null
})

module.exports = {
  getVersionManifest,
  formatVersionManifest,
  getVersionManifestForVersion
}
