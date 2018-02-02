module.exports = {
  Query: {
    configuration: async (root, args, { getConfiguration }) =>
      await getConfiguration()
  },
  Mutation: {
    updateConfiguration: async (root, newConfig, { setConfiguration }) => {
      await setConfiguration(newConfig)
      return await getConfiguration()
    }
  }
}
