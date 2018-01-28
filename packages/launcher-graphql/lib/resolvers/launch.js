module.exports = {
  Mutation: {
    startInstance: async (
      root,
      { ID, username },
      { startInstance, getInstance }
    ) => {
      await startInstance(ID, username)
      return await getInstance(ID)
    },
    stopInstance: async (root, { ID }, { stopInstance, getInstance }) => {
      await stopInstance(ID)
      return await getInstance(ID)
    }
  },
  MinecraftInstance: {
    processID: async ({ ID }, args, { getCurrentProcessIDForInstance }) =>
      await getCurrentProcessIDForInstance(ID)
  }
}
