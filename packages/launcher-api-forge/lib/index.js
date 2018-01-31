const {
  getForgeVersions,
  getForgeVersionByID,
  getForgeVersionsForMinecraftVersion
} = require('./versions')
const { getForgeInstanceManifest } = require('./libraries')
const {
  installForge,
  downloadForge,
  installForgeLibraries
} = require('./install')

module.exports = {
  getForgeVersions,
  getForgeVersionByID,
  getForgeVersionsForMinecraftVersion,
  getForgeInstanceManifest,
  installForge,
  downloadForge,
  installForgeLibraries
}
