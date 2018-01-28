module.exports = {
  Query: {
    minecraftVersions: async (
      root,
      { releaseTypes = [] },
      { getMinecraftVersions }
    ) => {
      const { versions } = await getMinecraftVersions()
      if (!releaseTypes.length) return versions
      return versions.filter(({ type }) => releaseTypes.includes(type))
    },
    minecraftVersion: async (root, { ID }, { getMinecraftVersions }) => {
      const { versions } = await getMinecraftVersions()
      return versions.find(({ ID: thisID }) => thisID === ID)
    },
    latestMinecraftVersion: async (
      root,
      { releaseType } = {},
      { getMinecraftVersions }
    ) => {
      const { latest } = await getMinecraftVersions()
      return latest[releaseType]
    }
  },
  MinecraftVersion: {
    libraries: async ({ ID }, { OS, OSVersion }, { getVersionManifest }) => {
      const { libraries } = await getVersionManifest(ID)
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
    client: async ({ ID }, _, { getVersionManifest }) => {
      const { client } = await getVersionManifest(ID)
      return client
    },
    server: async ({ ID }, _, { getVersionManifest }) => {
      const { server } = await getVersionManifest(ID)
      return server
    },
    assets: async ({ ID }, _, { getVersionManifest }) => {
      const { assetManifest } = await getVersionManifest(ID)
      return { ...assetManifest, ID }
    }
  },
  MinecraftDownload: {
    ID: ({ sha1 }) => sha1
  },
  MinecraftVersionAssets: {
    downloads: async (
      { assetsIndex, manifestUrl },
      _,
      { getAssetManifest }
    ) => {
      return await getAssetManifest({ manifestUrl, assetsIndex })
    }
  }
}
