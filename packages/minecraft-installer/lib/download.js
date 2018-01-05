const path = require('path')
const { ensureDir } = require('fs-extra')
const { noop, sumBy } = require('lodash')
const decompress = require('decompress')
const { downloadToFile } = require('./download.utils')

// TODO: Better error handling
const downloadManyFiles = async (
  targetDirectory,
  files = [],
  { onProgress = noop, fetchOptions } = {}
) => {
  const totalSize = sumBy(files, 'size')
  let progressState = {
    totalSize: sumBy(files, 'size'),
    totalFiles: files.length,
    completedSize: 0,
    completedFiles: 0,
    active: []
  }

  const progressTick =
    onProgress === noop
      ? noop
      : (delta = 0, fileComplete = 0) => {
          const completedSize = progressState.completedSize + delta
          progressState = {
            ...progressState,
            completedSize,
            completedFiles: progressState.completedFiles + fileComplete,
            percent: completedSize / progressState.totalSize * 100,
            delta
          }
          onProgress(progressState)
        }
  progressTick()

  return await Promise.all(
    files.map(async file => {
      progressState.active.push(file.ID)
      const downloadPath = path.join(targetDirectory, file.path)
      await ensureDir(path.dirname(downloadPath))
      const result = await downloadToFile(file.url, downloadPath, {
        onProgress: ({ delta, percentage }) => {
          if (percentage === 100) {
            progressState.active = progressState.active.filter(
              ID => ID !== file.ID
            )
          }
          progressTick(delta)
        },
        ...fetchOptions
      })
      progressTick(0, 1)
      return { ...file, ...result }
    })
  )
}

const extractLibraries = async (targetDirectory, libraries) => {
  const extractable = libraries.filter(
    ({ extract }) => typeof extract !== 'undefined'
  )
  const nativesPath = path.resolve(targetDirectory, '..', 'natives')
  return await Promise.all(
    extractable.map(
      async ({ extract = {}, downloads }) =>
        await Promise.all(
          downloads.filter(({ native }) => native).map(async download => {
            const thisLibPath = path.join(targetDirectory, download.path)
            const files = await decompress(thisLibPath, nativesPath, {
              filter:
                extract.exclude &&
                (file =>
                  !extract.exclude.every(not => file.path.startsWith(not)))
            })
          })
        )
    )
  )
}

const downloadLibraries = async (
  targetDirectory,
  libraries = [],
  downloadOptions
) => {
  const files = libraries.reduce(
    (files, { downloads }) => files.concat(downloads),
    []
  )
  await downloadManyFiles(targetDirectory, files, downloadOptions)
  return await extractLibraries(targetDirectory, libraries)
}

const downloadAssets = async (
  targetDirectory,
  assets = [],
  downloadOptions
) => {
  return downloadManyFiles(targetDirectory, assets, downloadOptions)
}

module.exports = { downloadLibraries, downloadAssets }
