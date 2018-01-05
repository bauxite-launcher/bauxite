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
    async minecraftVersion(root, { ID }, { fetch }) {
      const { versions } = await getMinecraftVersionsThrottled({ fetch })
      return versions.find(({ ID: thisID }) => thisID === ID)
    },
    async latestMinecraftVersion(root, { releaseType } = {}, { fetch }) {
      const { latest } = await getMinecraftVersionsThrottled({ fetch })
      return latest[releaseType]
    }
  },
  MinecraftVersion: {
    async libraries({ manifestUrl }, { OS, OSVersion }, { fetch }) {
      const { libraries } = await getVersionManifestThrottled({
        manifestUrl,
        fetch
      })
      const targetLibs = libraries[OS]
      if (!OSVersion) return targetLibs
      return targetLibs.filter(
        ({ rules }) =>
          rules
            ? rules.reduce((allowed, { action, os }) => {
                const wouldBeAllowed = action === 'Allow'
                if (!os) return wouldBeAllowed
                const appliesToName = os.name === OS
                const appliesToVersion = os.version
                  ? !!new RegExp(os.version).match(OSVersion)
                  : true
                return appliesToName && appliesToVersion
                  ? wouldBeAllowed
                  : allowed
              }, false)
            : true
      )
    },
    async client({ manifestUrl }, _, { fetch }) {
      const { client } = await getVersionManifestThrottled({
        manifestUrl,
        fetch
      })
      return client
    },
    async server({ manifestUrl }, _, { fetch }) {
      const { server } = await getVersionManifestThrottled({
        manifestUrl,
        fetch
      })
      return server
    },
    async assets({ ID, manifestUrl }, _, { fetch }) {
      const { assetManifest } = await getVersionManifestThrottled({
        manifestUrl,
        fetch
      })
      return { ...assetManifest, ID }
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
