const path = require('path')
const { ensureDir } = require('fs-extra')
const { noop, sumBy } = require('lodash')
const { downloadAssets, downloadLibraries } = require('./download')
const { downloadToFile } = require('./download.utils')

// TODO: Rewrite all of this using orchestrator, maybe.
const createMinecraftInstance = async (
  instanceDir,
  versionMetadata,
  options = {}
) => {
  await ensureDir(instanceDir)
  const {
    downloadType = 'client',
    installLibraries = true,
    installAssets = true,
    onProgress = noop,
    fetchOptions
  } = options
  const { client, server, libraries, assets, assetsIndex } = versionMetadata
  const entryPoint = getEntryPoint({ client, server }, downloadType)
  const progress = {
    total: 0,
    progress: 0,
    percent: 0
  }
  const progressTick =
    onProgress === noop
      ? noop
      : ({ delta = 0 } = {}) => {
          progress.progress += delta
          progress.percent = progress.progress / progress.total * 100
          onProgress({ ...progress, delta })
        }
  const tasks = []
  const entryPointPath = path.join(instanceDir, `${downloadType}.jar`)
  if (entryPoint) {
    progress.total += entryPoint.size
    tasks.push(
      downloadToFile(entryPoint.url, entryPointPath, {
        onProgress: progressTick,
        fetchOptions
      })
    )
  }
  if (installLibraries) {
    const libraryPath = path.join(instanceDir, 'libraries')
    progress.total += sumBy(libraries, ({ downloads }) =>
      sumBy(downloads, 'size')
    )
    tasks.push(
      downloadLibraries(libraryPath, libraries, {
        onProgress: progressTick,
        fetchOptions
      })
    )
  }
  if (installAssets) {
    const assetsPath = path.join(instanceDir, 'assets', assetsIndex)
    progress.total += sumBy(assets, 'size')
    tasks.push(
      downloadAssets(assetsPath, assets, {
        onProgress: progressTick,
        fetchOptions
      })
    )
  }

  await Promise.all(tasks)

  progress.progress = progress.total
  progressTick()

  return { entryPoint, type: downloadType }
}

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
