const { typeNameResolverFromPlugins } = require('./utils')

module.exports = {
  Query: {
    instances: async (root, args, { listInstances }) => await listInstances(),
    instance: async (root, { ID }, { getInstance }) => await getInstance(ID)
  },
  Mutation: {
    cloneInstance: async (root, { ID, newID }, { cloneInstance }) =>
      await cloneInstance(ID, newID),
    backupInstance: async (root, { ID }, { backupInstance }) =>
      await backupInstance(ID),
    deleteInstance: async (root, { ID }, { deleteInstance }) =>
      await deleteInstance(ID),
    renameInstance: async (root, { oldID, newID }, { renameInstance }) =>
      await renameInstance(oldID, newID)
  },
  MinecraftInstance: {
    __resolveType: typeNameResolverFromPlugins(
      'MinecraftInstance',
      'VanillaMinecraftInstance'
    ),
  },
  VanillaMinecraftInstance: {
    version: async ({ versionID }, args, { getMinecraftVersions }) => {
      const { versions } = await getMinecraftVersions()
      return versions.find(({ ID }) => ID === versionID)
    }
  }
}
