const defaultFetch = require('make-fetch-happen')
const { ensureDir, createWriteStream } = require('fs-extra')
const { dirname, join: joinPath } = require('path')
const progressStream = require('progress-stream')
const { Observable } = require('rxjs')
const Listr = require('listr')
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

const downloadToFile = (url, path, { createDirs = true, ...options } = {}) => {
  return new Observable(observer => {
    const dirCreated = createDirs ? ensureDir(dirname(path)) : Promise.resolve()
    dirCreated
      .then(() => createDownloadStream(url, options))
      .then(({ stream: downloadStream, size }) => {
        const fileWriteStream = createWriteStream(path)
        const progress = progressStream({ length: size, time: 100 })
        progress.on('progress', ({ transferred, length, percentage }) =>
          observer.next(
            `Downloading ${(transferred / Math.pow(2, 20)).toFixed(1)}/${(
              length / Math.pow(2, 20)
            ).toFixed(1)}MB (${percentage.toFixed(2)}%)`
          )
        )
        const piped = downloadStream.pipe(progress).pipe(fileWriteStream)
        return streamCompleted(fileWriteStream)
      })
      .then(() => observer.complete(), error => observer.error(error))
  })
}

const streamCompleted = async stream =>
  new Promise((resolve, reject) =>
    stream.on('error', reject).on('finish', resolve)
  )

// TODO: Smarter observer with more detail (percent total filesize)
const downloadManyFiles = async (
  targetDirectory,
  files = [],
  { onProgress = noop, fetchOptions, silent = true } = {}
) => {
  return new Observable(async observer => {
    const total = files.length
    let done = 0
    observer.next(`Downloaded 0/${total} files`)
    await Promise.all(
      files.map(file => {
        const downloadPath = joinPath(targetDirectory, file.path)
        return downloadToFile(file.url, downloadPath, fetchOptions)
          .toPromise()
          .then(
            () => observer.next(`Downloaded ${++done}/${total} files`),
            error => observer.error(error)
          )
      })
    )
    observer.complete()
  })
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
