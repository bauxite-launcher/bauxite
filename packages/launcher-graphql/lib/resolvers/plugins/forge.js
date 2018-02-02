module.exports = {
  Query: {
    forgeVersions: async (
      root,
      { minecraftVersionID },
      { getForgeVersions, getForgeVersionsForMinecraftVersion }
    ) =>
      minecraftVersionID
        ? await getForgeVersionsForMinecraftVersion(minecraftVersionID)
        : await getForgeVersions(),
    forgeVersion: async (root, { ID }, { getForgeVersionByID }) =>
      await getForgeVersionByID(ID)
  },
  Mutation: {
    installForge: async (
      root,
      { instanceID, forgeVersionID },
      { getInstance, installForge }
    ) => {
      const instance = await getInstance(instanceID)
      if (!instance) {
        throw new Error(`Instance "${instanceID}" does not exist`)
      }
      return await installForge(instance.directory, forgeVersionID)
    }
  },
  ForgeVersion: {
    minecraftVersion: async (
      { minecraftVersionID },
      args,
      { getMinecraftVersions }
    ) => {
      const { versions } = await getMinecraftVersions()
      return versions.find(({ ID }) => ID === minecraftVersionID)
    },
    download: ({ downloads }, { name: nameFilter }) =>
      downloads.find(({ name }) => name === nameFilter)
  },
  MinecraftVersion: {
    forgeVersions: async (
      { ID },
      args,
      { getForgeVersionsForMinecraftVersion }
    ) => await getForgeVersionsForMinecraftVersion(ID),
    latestForgeVersion: async (
      { ID },
      args,
      { getForgeVersionsForMinecraftVersion }
    ) => {
      const versions = await getForgeVersionsForMinecraftVersion(ID)
      return versions.find(({ latest }) => latest)
    },
    recommendedForgeVersion: async (
      { ID },
      args,
      { getForgeVersionsForMinecraftVersion }
    ) => {
      const versions = await getForgeVersionsForMinecraftVersion(ID)
      return versions.find(({ recommended }) => recommended)
    }
  },
  MinecraftInstance: {
    ___pluginResolveType: ({ forgeVersionID }) =>
      forgeVersionID ? 'ForgeMinecraftInstance' : null
  },
  ForgeMinecraftInstance: {
    forgeVersion: async ({ forgeVersionID }, args, { getForgeVersionByID }) =>
      await getForgeVersionByID(forgeVersionID),
    version: async ({ versionID }, args, { getMinecraftVersions }) => {
      const { versions } = await getMinecraftVersions()
      return versions.find(({ ID }) => ID === versionID)
    }
  }
}
