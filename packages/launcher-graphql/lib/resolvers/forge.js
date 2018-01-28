module.exports = {
  Query: {
    forgeVersions: async (
      root,
      { minecraftVersionID },
      { getForgeVersions, getForgeVersionsForMinecraftVersion }
    ) =>
      minecraftVersionID
        ? await getForgeVersionsForMinecraftVersion(minecraftVersionID)
        : await getForgeVersions()
  }
}
