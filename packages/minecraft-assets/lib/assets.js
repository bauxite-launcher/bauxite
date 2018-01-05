const defaultFetch = require('make-fetch-happen')
const { getVersionManifestForVersion } = require('./version')

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
  return Object.entries(objects).map(([path, { hash, size, url }]) => ({
    path,
    sha1: hash,
    size,
    url: formatAssetUrl(hash)
  }))
}

const formatAssetUrl = hash =>
  `http://resources.download.minecraft.net/${hash.slice(0, 2)}/${hash}`

const getAssetsForVersion = async versionID => {
  const { assetManifest: { manifestUrl } } = await getVersionManifestForVersion(
    versionID
  )
  return await getAssetManifest({ manifestUrl })
}

module.exports = {
  getAssetManifest,
  getAssetsForVersion,
  formatAssetManifest
}
