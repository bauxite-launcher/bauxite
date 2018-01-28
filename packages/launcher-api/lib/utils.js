const os = require('os')
const optionalRequire = require('optional-require')(require)

const getOperatingSystem = (platform = os.platform()) =>
  platform === 'win32' ? 'Windows' : platform === 'darwin' ? 'OSX' : 'Linux'

const knownPlugins = ['forge']
const installedPlugins = knownPlugins.reduce((plugins, name) => {
  const plugin = optionalRequire(`@bauxite/launcher-api-${name}`)
  if (plugin) {
    plugins[name] = plugin
  }
  return plugins
}, {})

const getInstalledPlugins = () => installedPlugins

module.exports = { getOperatingSystem, getInstalledPlugins }
