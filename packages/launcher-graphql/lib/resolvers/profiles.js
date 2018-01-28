module.exports = {
  Query: {
    profiles: async (root, args, { listProfiles }) => await listProfiles()
  },
  Mutation: {
    createProfile: async (root, { username, password }, { createProfile }) =>
      await createProfile(username, password),
    deleteProfile: async (root, { username }, { deleteProfile }) =>
      await deleteProfile(username)
  }
}
