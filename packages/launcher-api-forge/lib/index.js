const {
  getForgeVersions,
  getForgeVersionByID,
  getForgeVersionsForMinecraftVersion
} = require('./versions')
const { getForgeInstanceManifest } = require('./libraries')
const { installForge } = require('./install')

module.exports = {
  getForgeVersions,
  getForgeVersionByID,
  getForgeVersionsForMinecraftVersion,
  getForgeInstanceManifest,
  installForge
}
