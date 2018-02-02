const path = require('path')
const { spawn } = require('child_process')
const { promisify } = require('util')
const { kill, lookup } = require('ps-node')
const { readFile, writeFile } = require('fs-extra')
const { getVersionManifest } = require('./versions')
const { getInstance } = require('./instances')
const { getProfileByUsername, getAccessToken } = require('./profiles')
const { getOperatingSystem, getInstalledPlugins } = require('./utils')

const killProcess = promisify(kill)
const lookupProcess = promisify(lookup)

// TODO: Plugin API refactor, register overrides from inside plugin code
const pluginMap = {
  forge: {
    generateLaunchArguments: 'generateForgeLaunchArguments',
    instanceSupported: ({ forgeVersionID }) => forgeVersionID
  }
}

const generateLaunchArguments = async ({ instance, ...rest }) => {
  const { plugins, names } = getInstalledPlugins()
  // TODO: Refactor into some `getPluginOverridesForMethod` thing
  const [supportedPlugin] = names
    .map(name => pluginMap[name])
    .filter(
      plugin =>
        plugin &&
        plugin.generateLaunchArguments &&
        plugins[plugin.generateLaunchArguments] &&
        plugin.instanceSupported(instance)
    )

  const generateArguments = supportedPlugin
    ? plugins[supportedPlugin.generateLaunchArguments]
    : generateVanillaLaunchArguments

  return await generateArguments({ instance, ...rest })
}

const generateVanillaLaunchArguments = ({ instance, profile, version }) => {
  const relativeDirectory = dir => path.join(instance.directory, dir)

  const jarArgMap = {
    assets_index_name: version.assetManifest.ID,
    assets_root: relativeDirectory('assets'),
    auth_access_token: profile.accessToken,
    auth_player_name: profile.username,
    auth_uuid: profile.uuid,
    game_directory: relativeDirectory('./'),
    user_type: 'mojang',
    version_name: instance.versionID,
    version_type: 'release'
  }
  const baseJarArgs = version.client.arguments.replace(
    /\$\{([^\}]+)\}/g,
    (match, token) => jarArgMap[token]
  )
  const userProperties = profile.properties.length
    ? JSON.stringify(
        profile.properties.reduce((obj, { name, value }) => {
          obj[name] = value
          return obj
        }, {})
      )
    : null
  const jarArgs = `${baseJarArgs}${
    userProperties ? ` --userProperties '${userProperties}'` : ''
  }`
    .trim()
    .split(' ')

  const libraryFiles = version.libraries[getOperatingSystem()].reduce(
    (files, { downloads }) =>
      files.concat(downloads.map(({ path }) => `libraries/${path}`)),
    []
  )
  const classPaths = ['client.jar', ...libraryFiles].map(relativeDirectory)

  return [
    '-Xmx1G', // TODO: Make configurable
    `-Djava.library.path=${relativeDirectory('natives')}`,
    '-cp',
    classPaths.join(':'),
    version.client.mainClass,
    ...jarArgs
  ]
}

const startInstance = async (instanceID, username) => {
  if (await getCurrentProcessIDForInstance(instanceID)) {
    throw new Error(`Instance "${instanceID}" is already running.`)
  }

  const instance = await getInstance(instanceID)
  const profile = await getProfileByUsername(username)
  const version = await getVersionManifest(instance.versionID)
  const args = await generateLaunchArguments({ instance, profile, version })

  const client = spawn('java', args, {
    cwd: instance.directory,
    stdio: 'ignore',
    detached: true
  })

  client.unref()

  await setProcessID(instance.directory, client.pid)
  return {
    ...instance,
    processID: client.pid
  }
}

const stopInstance = async instanceID => {
  const processID = await getCurrentProcessIDForInstance(instanceID)
  if (!processID) {
    throw new Error(`Instance "${instanceID}" is not running`)
  }
  killProcess(processID)
  return await getInstance(instanceID)
}

const getProcessID = async instanceDirectory => {
  try {
    return await readFile(path.join(instanceDirectory, '.pid'), 'utf8')
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null
    }
    throw error
  }
}

const setProcessID = async (instanceDirectory, processID) =>
  await writeFile(path.join(instanceDirectory, '.pid'), processID, 'utf8')

const getCurrentProcessIDForInstance = async instanceID => {
  const instance = await getInstance(instanceID)
  const processID = await getProcessID(instance.directory)
  if (!processID) return null
  const [{ pid } = {}] = await lookupProcess({ pid: processID })
  return pid || null
}

module.exports = { startInstance, stopInstance, getCurrentProcessIDForInstance }
