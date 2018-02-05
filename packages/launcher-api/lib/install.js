const path = require('path')
const { debounce } = require('lodash')
const { writeJSON, ensureDir, copy } = require('fs-extra')
const fetch = require('make-fetch-happen')
const Listr = require('listr')
const { Observable } = require('rxjs')
const {
  getMinecraftVersions,
  getVersionManifest,
  getAssetManifest
} = require('./versions')
const {
  createMinecraftInstance
} = require('@bauxite/minecraft-installer/lib/install')
const { generateInstanceName } = require('./instanceName')
const { getInstance } = require('./instances')
const { getConfiguration } = require('./config')
const { getOperatingSystem } = require('./utils')

const installInstance = ({ silent = true } = {}) =>
  new Listr(
    [
      {
        title: 'Get Bauxite configuration',
        task: async context => {
          const { directory: baseDirectory } = await getConfiguration()
          context.baseDirectory = baseDirectory
        }
      },
      {
        title: 'Prepare new instance',
        task: () =>
          new Listr([
            {
              title: 'Check for existing instances',
              enabled: ({ instanceID }) => instanceID,
              task: async (context, task) => {
                const existingInstance = await getInstance(context.instanceID)
                if (existingInstance && !context.overwrite) {
                  throw new Error(
                    `Instance "${context.instanceID}" already exists`
                  )
                }
                if (!existingInstance && context.overwrite) {
                  throw new Error(
                    `Instance "${context.instanceID}" does not exist`
                  )
                }
                if (existingInstance) {
                  task.title = 'Found existing instance'
                }
                context.existingInstance = existingInstance
              }
            },
            {
              title: 'Generate random instance name',
              enabled: ({ instanceID }) => !instanceID,
              task: async (context, task) => {
                let instanceID
                do {
                  instanceID = generateInstanceName()
                } while (await getInstance(instanceID))
                context.instanceID = instanceID
                task.title = `${task.title} (${instanceID})`
              }
            },
            {
              title: 'Create cache directory',
              enabled: ({ cache = true }) => cache,
              task: async context => {
                const { baseDirectory, cache = true } = context
                const cacheDirectory = path.join(baseDirectory, 'cache')
                const cachedFetch = fetch.defaults({
                  cacheManager: cache ? cacheDirectory : 'no-cache'
                })
                if (cache) {
                  await ensureDir(cacheDirectory)
                }
                context.cachedFetch = cachedFetch
              }
            },
            {
              title: 'Get Minecraft version information',
              task: (context, task) =>
                new Observable(async observer => {
                  if (!context.versionID) {
                    observer.next('Fetching latest version of Minecraft')
                    const { latest } = await getMinecraftVersions()
                    context.versionID = latest.Release.ID
                  }
                  task.title = `${task.title} for ${context.versionID}`
                  observer.next(
                    `Looking up libraries for Minecraft ${context.versionID}`
                  )
                  context.versionManifest = await getVersionManifest(
                    context.versionID
                  )
                  observer.next(
                    `Looking up assets for Minecraft ${context.versionID}`
                  )
                  context.assetManifest = await getAssetManifest(
                    context.versionManifest.assetManifest
                  )
                  observer.complete()
                })
            }
          ])
      },
      {
        title: 'Install Minecraft',
        task: context => {
          context.OS = getOperatingSystem()
          context.instanceDir = context.existingInstance
            ? context.existingInstance.directory
            : path.join(context.baseDirectory, 'instances', context.instanceID)
          return createMinecraftInstance({ silent: false })
        }
      },
      {
        title: 'Update configuration file',
        task: async context => {
          const instanceConfigPath = path.join(
            context.instanceDir,
            'bauxite.json'
          )
          await writeJSON(instanceConfigPath, { versionID: context.versionID })
          context.instance = {
            ID: context.instanceID,
            directory: context.instanceDir,
            versionID: context.versionID
          }
        }
      }
    ],
    { renderer: silent ? 'silent' : 'default' }
  )

const upgradeInstance = ({ silent = true } = {}) =>
  new Listr(
    [
      {
        title: 'Check for existing instance',
        task: async context => {
          const existingInstance = await getInstance(context.instanceID)
          if (!existingInstance) {
            throw new Error(`Instance "${context.instanceID}" does not exist`)
          }
          context.instance = existingInstance
        }
      },
      {
        title: 'Backup existing instance',
        skip: ({ backupFirst = true }) => backupFirst,
        task: async ({ instance }) => await backupInstance(instance.ID)
      },
      {
        title: 'Update Minecraft',
        task: context => installInstance({ silent })
      }
    ],
    { renderer: silent ? 'silent' : 'default' }
  )

const cloneInstance = async (instanceID, cloneInstanceID) => {
  const existingInstance = await getInstance(instanceID)
  if (!existingInstance) {
    throw new Error(`Instance "${instanceID}" does not exist`)
  }
  const existingTargetInstance = await getInstance(cloneInstanceID)
  if (existingTargetInstance) {
    throw new Error(`Instance "${cloneInstanceID}" already exists`)
  }

  const { directory: baseDirectory } = await getConfiguration()
  const clonedInstanceDirectory = path.join(
    baseDirectory,
    'instances',
    cloneInstanceID
  )
  await ensureDir(clonedInstanceDirectory)
  await copy(existingInstance.directory, clonedInstanceDirectory)
  return await getInstance(cloneInstanceID)
}

const renameInstance = async (instanceID, newInstanceID) => {
  const newInstance = await cloneInstance(instanceID, newInstanceID)
  await deleteInstance(instanceID)
  return newInstance
}

const backupInstance = async instanceID => {
  const existingInstance = await getInstance(instanceID)
  if (!existingInstance) {
    throw new Error(`Instance "${instanceID}" does not exist`)
  }
  const backupInstanceID = [
    instanceID,
    'backup',
    existingInstance.versionID,
    new Date().toISOString()
  ].join('-')
  return await cloneInstance(instanceID, backupInstanceID)
}

module.exports = {
  installInstance,
  upgradeInstance,
  cloneInstance,
  backupInstance
}
