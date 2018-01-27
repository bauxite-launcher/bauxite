const path = require('path')
const {
  readJSON,
  writeJSON,
  ensureDir,
  readFile,
  writeFile,
  pathExists
} = require('fs-extra')
const {
  authenticateUser,
  invalidateAccessToken,
  validateAccessToken,
  refreshAccessToken
} = require('@bauxite/minecraft-auth')
const fetch = require('node-fetch')
const { getConfiguration, setConfiguration } = require('./config')

const getProfilePath = async () => {
  const { directory } = await getConfiguration()
  return path.join(directory, 'profiles.json')
}

const listProfiles = async () => {
  try {
    return await readJSON(await getProfilePath())
  } catch (error) {
    if (error.code === 'ENOENT') {
      return []
    }
    throw error
  }
}

const getProfileByKey = key => async value => {
  const profiles = await listProfiles()
  return profiles.find(profile => profile[key] === value)
}

const getProfileByUsername = getProfileByKey('username')
const getProfileByUUID = getProfileByKey('uuid')
const getProfileByName = getProfileByKey('name')

const writeProfiles = async profiles =>
  await writeJSON(await getProfilePath(), profiles)

const createProfile = async (username, password) => {
  const profiles = await listProfiles()
  const existingProfile = profiles.find(
    ({ username: thisUsername }) => username === thisUsername
  )
  if (existingProfile)
    throw new Error(`The profile "${username}" already exists`)

  const { clientToken } = await getConfiguration()
  const authResponse = await authenticateUser({
    username: username,
    password,
    clientToken,
    requestUser: true
  })

  if (authResponse.clientToken && authResponse.clientToken !== clientToken) {
    await setConfiguration({ clientToken: authResponse.clientToken })
  }

  if (authResponse.error) {
    throw new Error(authResponse.errorMessage)
  }
  if (!authResponse.selectedProfile) {
    console.warn(
      'Auth response did not contain a selected profile:\n\n',
      JSON.stringify(authResponse, null, 2),
      '\n'
    )
  }

  const account = {
    accessToken: authResponse.accessToken,
    username,
    name: authResponse.selectedProfile.name,
    uuid: authResponse.selectedProfile.id,
    properties: authResponse.user.properties || [],
    isDefault: profiles.length === 0
  }

  profiles.push(account)
  await writeProfiles(profiles)
  return account
}

const getDefaultProfile = async () => {
  const profiles = await listProfiles()
  return profiles.find(({ isDefault }) => isDefault)
}

const setDefaultProfile = async name => {
  const profiles = await listProfiles()
  const profile = profiles.find(({ name: thisName }) => thisName === name)
  if (!profile) {
    throw new Error(`Profile "${name}" has not been added`)
  }
  profiles.forEach(profile => {
    profile.isDefault = profile.name === name
  })
  await writeProfiles(profiles)
}

const deleteProfile = async username => {
  const { clientToken } = await getConfiguration()
  const profiles = await listProfiles()
  const existingIndex = profiles.findIndex(
    ({ username: thisUsername }) => thisUsername === username
  )

  if (existingIndex === -1) {
    throw new Error(`Profile "${username}" has not been added`)
  }

  const profilesAfterDeletion = [
    ...profiles.slice(0, existingIndex),
    ...profiles.slice(existingIndex + 1)
  ]

  await writeProfiles(profilesAfterDeletion)

  const profile = profiles[existingIndex]
  if (profile.accessToken && clientToken) {
    await invalidateAccessToken({
      accessToken: profile.accessToken,
      clientToken
    })
  }
  return profile
}

const getAccessToken = async username => {
  const { clientToken } = await getConfiguration()
  const profiles = await listProfiles()
  const profile = profiles.find(
    ({ username: thisUsername }) => thisUsername === username
  )
  if (!profile) {
    throw new Error(`Profile "${username}" has not been added`)
  }

  const accessTokenStillValid = await validateAccessToken({
    accessToken: profile.accessToken,
    clientToken
  })
  if (accessTokenStillValid) {
    return profile.accessToken
  }

  const { accessToken } = await refreshAccessToken({
    accessToken: profile.accessToken,
    clientToken,
    requestUser: false
  })
  profile.accessToken = accessToken
  await writeProfiles(profiles)
  return accessToken
}

const getAvatarByUuid = async (uuid, { cache = true } = {}) => {
  if (!uuid) {
    throw new Error('')
  }
  const { directory: baseDirectory } = await getConfiguration()
  const avatarDirectory = path.join(baseDirectory, 'avatars')
  const avatarCachePath = path.join(avatarDirectory, `${uuid}.png`)
  if (cache) {
    await ensureDir(avatarDirectory)
    if (await pathExists(avatarCachePath)) {
      return await readFile(avatarCachePath)
    }
  }
  const request = await fetch(
    `https://crafatar.com/avatars/${uuid}?size=8&overlay`
  )
  const image = await request.buffer()

  if (cache) {
    await writeFile(avatarCachePath, image)
  }
  return image
}

module.exports = {
  listProfiles,
  createProfile,
  deleteProfile,
  getAccessToken,
  getProfileByUsername,
  getProfileByUUID,
  getProfileByName,
  getDefaultProfile,
  setDefaultProfile,
  getAvatarByUuid
}
