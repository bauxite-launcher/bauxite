const defaultFetch = require('make-fetch-happen')

const getAssetManifest = async ({
  manifestUrl,
  fetch = defaultFetch,
  ...fetchOptions
}) => {
  const result = await fetch(manifestUrl, fetchOptions)
  const assetManifest = await result.json()
  return formatAssetManifest(assetManifest)
}

const formatAssetManifest = ({ objects }) => {
  return Object.entries(objects).map(([path, { hash, size }]) => ({
    path,
    sha1: hash,
    size
  }))
}

module.exports = {
  getAssetManifest,
  formatAssetManifest
}
