const {
  getForgeVersions,
  getForgeVersionByID,
  getForgeVersionsForMinecraftVersion
} = require('./versions')
const { getForgeInstanceManifest } = require('./libraries')
const {
  installForge,
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
  generateForgeLaunchArguments
}
