const defaultFetch = require('make-fetch-happen')

const getVersionManifest = async ({
  manifestUrl,
  fetch = defaultFetch,
  ...fetchOptions
}) => {
  const result = await fetch(manifestUrl, fetchOptions)
  const assetManifest = await result.json()
  return formatVersionManifest(assetManifest)
}

const formatVersionManifest = ({ id, assetIndex, libraries, downloads }) => {
  return {
    ID: id,
    assets: {
      manifestUrl: assetIndex.url,
      sha1: assetIndex.sha1,
      manifestSize: assetIndex.size,
      totalSize: assetIndex.totalSize
    },
    libraries: resolveLibrariesByOs(libraries),
    client: downloads.client,
    server: downloads.server
  }
}

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
const formatLibrary = ({ name, downloads, natives, extract }, os) => {
  const formattedDownloads = []
  if (downloads.artifact) {
    formattedDownloads.push(formatDownload(downloads.artifact))
  }
  if (natives && natives[os]) {
    formattedDownloads.push(formatDownload(downloads.classifiers[natives[os]]))
  }
  return { ID: name, extract, downloads: formattedDownloads }
}
const formatDownload = ({ sha1, ...rest }) => ({ ID: sha1, sha1, ...rest })

module.exports = {
  getVersionManifest,
  formatVersionManifest
}
