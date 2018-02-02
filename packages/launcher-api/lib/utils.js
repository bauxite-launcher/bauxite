const os = require('os')
const optionalRequire = require('optional-require')(require)

const getOperatingSystem = (platform = os.platform()) =>
  platform === 'win32' ? 'Windows' : platform === 'darwin' ? 'OSX' : 'Linux'

const knownPlugins = ['forge']
const installedPlugins = knownPlugins.reduce((installed, name) => {
  const plugin = optionalRequire(`@bauxite/launcher-api-${name}`)
  if (plugin) {
    Object.assign(installed.plugins, plugin)
    installed.names.push(name)
  }
  return installed
}, { plugins: {}, names: []})

const getInstalledPlugins = () => installedPlugins

module.exports = { getOperatingSystem, getInstalledPlugins }
