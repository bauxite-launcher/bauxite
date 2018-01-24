const path = require('path')
const { readdir, pathExists, readJSON, remove, rename } = require('fs-extra')
const { getConfiguration } = require('./config')

const getInstancesDir = async () => {
  const { directory } = await getConfiguration()
  return path.join(directory, 'instances')
}

const getInstanceDir = async instanceID => {
  return path.join(await getInstancesDir(), instanceID)
}

const listInstances = async () => {
  const directory = await getInstancesDir()
  if (!await pathExists(directory)) {
    return []
  }

  const possibleInstanceIDs = await readdir(directory)
  const possibleInstances = await Promise.all(
    possibleInstanceIDs.map(getInstance)
  )
  return possibleInstances.filter(x => x)
}

const getInstance = async instanceID => {
  const directory = await getInstancesDir()
  const instanceDir = path.join(directory, instanceID)
  if (!await pathExists(instanceDir)) {
    return null
  }

  const instanceConfigPath = path.join(instanceDir, 'bauxite.json')
  if (!await pathExists(instanceConfigPath)) {
    return null
  }

  const instanceConfig = await readJSON(instanceConfigPath)
  return {
    ID: instanceID,
    directory: instanceDir,
    ...instanceConfig
  }
}

// TODO: Inconsistent behaviour (should throw error if instance does not exist)
const deleteInstance = async instanceID => {
  const instance = await getInstance(instanceID)
  if (!instance) return false
  await remove(await getInstanceDir(instanceID))
  return true
}

const renameInstance = async (oldInstanceID, newInstanceID) => {
  const instance = await getInstance(oldInstanceID)
  if (!instance) throw new Error(`Instance "${oldInstanceID}" does not exist.`)
  if (oldInstanceID === newInstanceID) return instance

  const existingInstance = await getInstance(newInstanceID)
  if (existingInstance) {
    throw new Error(`The instance "${newInstanceID}" already exists`)
  }

  const newDirectory = await getInstanceDir(newInstanceID)
  // TODO: Validate new instance name as a pathname
  await rename(instance.directory, newDirectory)
  return await getInstance(newInstanceID)
}

module.exports = {
  listInstances,
  getInstance,
  deleteInstance,
  renameInstance
}
