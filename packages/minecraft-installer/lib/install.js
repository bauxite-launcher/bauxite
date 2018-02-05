const path = require('path')
const { ensureDir } = require('fs-extra')
const { noop, sumBy } = require('lodash')
const Listr = require('listr')
const { Observable } = require('rxjs')
const { downloadAssets, downloadLibraries } = require('./download')
const { downloadToFile } = require('./download.utils')

const createMinecraftInstance = ({ silent = true } = {}) =>
  new Listr(
    [
      {
        title: 'Create instance directory',
        task: async context => {
          const {
            instanceDir,
            versionManifest: { client, server, assetManifest },
            downloadType = 'client'
          } = context
          context.entryPoint = getEntryPoint({ client, server }, downloadType)
          context.entryPointPath = path.join(
            instanceDir,
            context.entryPoint.path
          )
          await ensureDir(instanceDir)
          await ensureDir(path.join(instanceDir, 'libraries'))
          await ensureDir(path.join(instanceDir, 'assets', assetManifest.ID))
        }
      },
      {
        title: 'Download',
        task: ({
          entryPoint,
          entryPointPath,
          cachedFetch,
          instanceDir,
          versionManifest,
          assetsManifest,
          installLibraries = true,
          installAssets = true,
          OS
        }) =>
          new Listr(
            [
              {
                title: 'Minecraft bundle',
                skip: () => !entryPoint,
                task: () =>
                  downloadToFile(entryPoint.url, entryPointPath, {
                    fetchOptions: { fetch: cachedFetch },
                    silent: false
                  })
              },
              {
                title: 'Libraries',
                skip: () => !installLibraries,
                task: () => {
                  const libraryPath = path.join(instanceDir, 'libraries')
                  return downloadLibraries(
                    libraryPath,
                    versionManifest.libraries[OS],
                    {
                      fetchOptions: { fetch: cachedFetch },
                      silent: false
                    }
                  )
                }
              },
              {
                title: `Assets`,
                skip: () => !installAssets,
                task: () => {
                  const assetsPath = path.join(
                    instanceDir,
                    'assets',
                    versionManifest.assetManifest.ID
                  )
                  return downloadAssets(assetsPath, assetsManifest, {
                    fetchOptions: { fetch: cachedFetch },
                    silent: false
                  })
                }
              }
            ],
            { renderer: silent ? 'silent' : 'default', concurrent: true }
          )
      }
    ],
    { renderer: silent ? 'silent' : 'default' }
  )

const getEntryPoint = ({ client, server }, downloadType) => {
  switch (downloadType) {
    case 'client':
      return { ...client.download, path: 'client.jar' }
    case 'server':
      return { ...server, path: 'server.jar' }
    case 'none':
      return null
    default:
      throw new Error(
        `Unknown downloadType: expected 'client', 'server' or 'none', but received '${downloadType}'`
      )
  }
}

module.exports = { createMinecraftInstance }
