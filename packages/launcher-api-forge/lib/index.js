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
const {
  generateForgeLaunchArguments
} = require('./launch')

module.exports = {
  getForgeVersions,
  getForgeVersionByID,
  getForgeVersionsForMinecraftVersion,
  getForgeInstanceManifest,
  installForge,
  downloadForge,
  installForgeLibraries,
  generateForgeLaunchArguments
}
