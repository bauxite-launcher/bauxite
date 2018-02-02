module.exports = {
  Mutation: {
    installInstance: async (root, { ID, version }, { installInstance }) =>
      await installInstance(ID, version),
    upgradeInstance: async (
      root,
      { ID, newVersion, backupFirst },
      { upgradeInstance }
    ) => await upgradeInstance(ID, newVersion, { backupFirst })
  }
}
