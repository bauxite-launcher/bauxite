const { GraphQLDateTime } = require('graphql-iso-date')
const { throttle } = require('lodash')
const {
  getMinecraftVersions,
  getVersionManifest,
  getAssetManifest
} = require('../')

const getMinecraftVersionsThrottled = throttle(getMinecraftVersions, 60000, {
  trailing: false
})
const getVersionManifestThrottled = throttle(getVersionManifest, 60000, {
  trailing: false
})
const getAssetManifestThrottled = throttle(getAssetManifest, 60000, {
  trailing: false
})

module.exports = {
  Query: {
    async minecraftVersions(root, { releaseTypes = [] }, { fetch }) {
      const { versions } = await getMinecraftVersionsThrottled({ fetch })
      if (!releaseTypes.length) return versions
      return versions.filter(({ type }) => releaseTypes.includes(type))
    },
    async latestMinecraftVersion(root, { releaseType } = {}, { fetch }) {
      const { latest } = await getMinecraftVersionsThrottled({ fetch })
      return latest[releaseType]
    }
  },
  MinecraftVersion: {
    async libraries({ manifestUrl }, { OS }, { fetch }) {
      const { libraries } = await getVersionManifestThrottled({
        manifestUrl,
        fetch
      })
      return libraries[OS]
    },
    async client({ manifestUrl }, _, { fetch }) {
      const { client } = await getMinecraftVersionsThrottled({
        manifestUrl,
        fetch
      })
      return client
    },
    async server({ manifestUrl }, _, { fetch }) {
      const { server } = await getMinecraftVersionsThrottled({
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
      return await getAssetManifestThrottled({ manifestUrl, fetch })
    }
  },
  DateTime: GraphQLDateTime
}
