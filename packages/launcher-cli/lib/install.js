exports.command = 'install [version]'
exports.aliases = 'i'
exports.describe = 'Install an instance of Minecraft'
exports.builder = {
  version: {
    default: 'latest'
  },
  server: {
    type: 'boolean',
    default: false
  }
}

