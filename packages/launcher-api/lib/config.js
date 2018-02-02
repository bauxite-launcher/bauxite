const { homedir } = require('os')
const path = require('path')
const { memoize } = require('lodash')
const { readJSON, writeJSON, ensureDir } = require('fs-extra')
const pkg = require('../package.json')

const CONFIG_FILE = 'config.json'

// Based on https://stackoverflow.com/a/26227660/801702
const getBaseDirectory = memoize(() => {
  if (process.env.APPDATA) {
    return path.join(process.env.APPDATA, 'Bauxite')
  }
  if (process.platform === 'darwin') {
    return path.join(
      process.env.HOME || homedir(),
      'Library',
      'Preferences',
      'Bauxite'
    )
  }
  return path.join(homedir(), '.bauxite')
})

const configFileCache = {
  dirty: false,
  cache: null
}

const getConfigurationFile = async directory =>
  configFileCache.cache || (await readJSON(path.join(directory, CONFIG_FILE)))

const setConfigurationFile = async (directory, config) => {
  if (configFileCache.dirty) {
    throw new Error('Attempt to write configuration file in parallel!')
  }
  configFileCache.cache = config
  configFileCache.dirty = true
  await ensureDir(directory)
  await writeJSON(path.join(directory, CONFIG_FILE), config)
  configFileCache.dirty = false
}

const defaultConfig = () => ({
  directory: getBaseDirectory(),
  managedBy: { name: pkg.name, version: pkg.version }
})

const getConfiguration = async () => {
  const baseConfig = defaultConfig()
  try {
    const config = await getConfigurationFile(baseConfig.directory)
    return {
      ...baseConfig,
      ...config
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      return baseConfig
    }
    throw error
  }
}

const setConfiguration = async ({ directory, ...configChanges } = {}) => {
  const currentConfiguration = await getConfiguration()

  if (directory && currentConfiguration.directory !== directory) {
    throw new Error('It is not possible to change the configuration directory.')
  }

  const newConfiguration = {
    ...defaultConfig(),
    ...currentConfiguration,
    ...configChanges,
    managedBy: { name: pkg.name, version: pkg.version }
  }

  await setConfigurationFile(currentConfiguration.directory, newConfiguration)
  return newConfiguration
}

module.exports = { getConfiguration, setConfiguration }
