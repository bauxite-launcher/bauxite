const defaultFetch = require('make-fetch-happen')
const { ensureDir, createWriteStream } = require('fs-extra')
const { dirname, join: joinPath } = require('path')
const progressStream = require('progress-stream')
const { get, noop, sumBy } = require('lodash')

const createDownloadStream = async (
  url,
  { fetch = defaultFetch, ...fetchOptions } = {}
) => {
  const res = await fetch(url, fetchOptions)
  if (!res.ok && res.status !== 304) {
    throw new Error(`HTTP Error ${res.status} (${res.statusText}) on ${url}`)
  }
  return {
    stream: res.body,
    size: parseInt(res.headers.get('content-length'), 10)
  }
}

const downloadToFile = async (
  url,
  path,
  { onProgress = noop, createDirs = true, ...options } = {}
) => {
  if (createDirs) {
    await ensureDir(dirname(path))
  }
  const fileWriteStream = createWriteStream(path)
  const { stream: downloadStream, size } = await createDownloadStream(
    url,
    options
  )
  const progress = progressStream({ length: size, time: 100 })
  progress.on('progress', onProgress)
  const piped = downloadStream.pipe(progress).pipe(fileWriteStream)
  await streamCompleted(fileWriteStream)
  return { url, path, size }
}

const streamCompleted = async stream =>
  new Promise((resolve, reject) =>
    stream.on('error', reject).on('finish', resolve)
  )

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
          const completedFiles = progressState.completedFiles + fileComplete
          progressState = {
            ...progressState,
            completedSize,
            completedFiles,
            percent: completedSize / progressState.totalSize * 100,
            percentFiles: completedFiles / progressState.totalFiles * 100,
            delta
          }
          onProgress(progressState)
        }
  progressTick()

  return await Promise.all(
    files.map(async file => {
      progressState.active.push(file.ID)
      const downloadPath = joinPath(targetDirectory, file.path)
      await ensureDir(dirname(downloadPath))
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

const downloadPreflightCheck = async (url, { fetch = defaultFetch } = {}) => {
  const res = await fetch(url, { method: 'HEAD' })
  return res.ok
}

module.exports = {
  createDownloadStream,
  downloadToFile,
  downloadManyFiles,
  downloadPreflightCheck,
  streamCompleted
}
