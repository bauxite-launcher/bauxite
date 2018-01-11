const path = require('path')
exports.command = 'profile'
exports.aliases = 'p'
exports.describe = 'Manage Mojang accounts used to play Minecraft'
exports.builder = yargs =>
  yargs
    .commandDir(path.resolve(__dirname, 'profile'))
    .demandCommand()
    .help()
