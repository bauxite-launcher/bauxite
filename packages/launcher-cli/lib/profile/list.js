const { listProfiles } = require('@bauxite/launcher-api/lib/profiles')
const { noProfilesMessage, profileTable } = require('./utils')

exports.command = 'list'
exports.aliases = 'p'
exports.describe = 'List all currently logged-in Mojang accounts'
exports.handler = async argv => {
  const arg0 = 'bauxite'
  const profiles = await listProfiles()
  if (!profiles.length) {
    noProfilesMessage(argv['$0'])
  } else {
    profileTable(profiles)
  }
}
