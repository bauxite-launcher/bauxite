const {
  getMinecraftVersions,
  getVersionManifest,
  getAssetManifest
} = require('../')
const { debounce } = require('lodash')

const getMinecraftVersionsDebounced = debounce(getMinecraftVersions, 60000)
const getVersionManifestDebounced = debounce(getVersionManifest, 60000)
const getAssetManifestDebounced = debounce(getAssetManifest, 60000)

module.exports = {
  Query: {
    async minecraftVersions(root, { releaseTypes = [] }, { fetch }) {
      const { versions } = await getMinecraftVersionsDebounced({ fetch })
      if (!releaseTypes.length) return versions
      return versions.filter(({ type }) => releaseTypes.includes(type))
    },
    async latestMinecraftVersion(root, { releaseType }, { fetch }) {
      const { latest } = await getMinecraftVersionsDebounced({ fetch })
      return latest[releaseType]
    }
  },
  MinecraftVersion: {
    async libraries({ manifestUrl }, { OS }, { fetch }) {
      const { libraries } = await getVersionManifestDebounced({
        manifestUrl,
        fetch
      })
      return libraries[OS]
    },
    async client({ manifestUrl }, _, { fetch }) {
      const { client } = await getMinecraftVersionsDebounced({
        manifestUrl,
        fetch
      })
      return client
    },
    async server({ manifestUrl }, _, { fetch }) {
      const { server } = await getMinecraftVersionsDebounced({
        manifestUrl,
        fetch
      })
      return server
    }
  },
  MinecraftDownload: {
    ID: ({ sha1 }) => sha1
  },
  MinecraftVersionAssets: {
    async downloads({ manifestUrl }, _, { fetch }) {
      return await getAssetManifest({ manifestUrl, fetch })
    }
  }
}
