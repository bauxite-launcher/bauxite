const path = require('path')
const os = require('os')
const { getForgeLibraries } = require('./libraries')

// TODO: This is copied from launcher-api; make a shared utils package
const getOperatingSystem = (platform = os.platform()) =>
  platform === 'win32' ? 'Windows' : platform === 'darwin' ? 'OSX' : 'Linux'

const getForgeJarPath = ({ versionID, forgeVersionID }) =>
  `forge-${versionID}-${forgeVersionID}-universal.jar`

const generateForgeLaunchArguments = async ({ instance, profile, version }) => {
  const jarPath = getForgeJarPath(instance)
  const {
    libraries: forgeLibraries,
    clientArguments,
    clientMainClass
  } = await getForgeLibraries(path.join(instance.directory, jarPath))

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
  const baseJarArgs = clientArguments.replace(
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

  const vanillaLibraries = version.libraries[getOperatingSystem()].reduce(
    (files, { downloads }) => files.concat(downloads),
    []
  )
  const libraryFiles = [...vanillaLibraries, ...forgeLibraries].map(
    ({ fallbackPath, path }) => `libraries/${fallbackPath || path}`
  )

  const vanillaJarPath = 'client.jar'
  const classPaths = [jarPath, vanillaJarPath, ...libraryFiles].map(
    relativeDirectory
  )

  return [
    '-Xmx4G', // TODO: Make configurable
    `-Djava.library.path=${relativeDirectory('natives')}`,
    '-cp',
    classPaths.join(path.delimiter),
    clientMainClass,
    ...jarArgs
  ]
}

module.exports = {
  generateForgeLaunchArguments
}
