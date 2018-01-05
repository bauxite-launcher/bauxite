const defaultFetch = require('make-fetch-happen')
const { ensureDir, createWriteStream } = require('fs-extra')
const { dirname } = require('path')
const progressStream = require('progress-stream')
const { get, noop } = require('lodash')

const createDownloadStream = async (
  url,
  { fetch = defaultFetch, ...fetchOptions } = {}
) => {
  const res = await fetch(url, fetchOptions)
  if (!res.ok && res.status !== 304) {
    throw new Error(`HTTP Error ${res.status} (${res.statusText})`)
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

module.exports = {
  createDownloadStream,
  downloadToFile
}
