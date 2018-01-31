const path = require('path')
const { ensureDir } = require('fs-extra')
const { noop } = require('lodash')
const decompress = require('decompress')
const { downloadManyFiles } = require('./download.utils')

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
