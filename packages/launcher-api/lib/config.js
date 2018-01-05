const { homedir } = require('os')
const path = require('path')
const { memoize } = require('lodash')
const { readJSON, writeJSON, ensureDir } = require('fs-extra')
const pkg = require('../package.json')

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

const getConfigurationFile = async directory =>
  await readJSON(path.join(directory, 'config.json'))

const setConfigurationFile = async (directory, config) => {
  await ensureDir(directory)
  await writeJSON(path.join(directory, 'config.json'), config)
}

const defaultConfig = () => {}
const managedBy = { name: pkg.name, version: pkg.version }

const getConfiguration = async () => {
  const directory = getBaseDirectory()
  const baseConfig = {
    directory,
    ...defaultConfig(),
    managedBy
  }
  try {
    const config = await getConfigurationFile(directory)
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
    managedBy
  }

  await setConfigurationFile(currentConfiguration.directory, newConfiguration)
  return newConfiguration
}

module.exports = { getConfiguration, setConfiguration }
