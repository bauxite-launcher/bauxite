const {
  listProfiles,
  getDefaultProfile,
  setDefaultProfile
} = require('@bauxite/launcher-api/lib/profiles')
const { noProfilesMessage, profileTable } = require('./utils')

exports.command = 'default [profile]'
exports.describe = 'Gets (or sets) the default profile to use'

exports.builder = yargs =>
  yargs.positional('profile', {
    describe: 'The name of the profile to use by default'
  })

exports.handler = ({ profile }) => {
  if (profile) {
    setProfile(profile)
  } else {
    getProfile()
  }
}

const setProfile = async name => {
  await setDefaultProfile(name)
  const profiles = await listProfiles()
  profileTable(profiles)
}

const getProfile = async () => {
  const profile = await getDefaultProfile()
  profileTable([profile])
}
