const path = require('path')
const {
  readJson,
  writeJson,
  createReadStream,
  createWriteStream,
  remove
} = require('fs-extra')
const Listr = require('listr')
const { Observable } = require('rxjs')
const { Decompressor: LzmaDecompressor } = require('xz')
const {
  downloadToFile,
  downloadManyFiles,
  downloadPreflightCheck,
  streamCompleted
} = require('@bauxite/minecraft-installer/lib/download.utils')
const { getForgeVersionByID } = require('./versions')
const { getForgeClientLibraries } = require('./libraries')

// TODO: onProgress callback
const installForge = ({ silent = true } = {}) =>
  new Listr(
    [
      {
        title: 'Get instance configuration',
        task: async context => {
          context.instanceConfigPath = path.join(
            context.directory,
            'bauxite.json'
          )
          context.instanceID = path.basename(context.directory)
          context.instance = await readJson(context.instanceConfigPath)
        }
      },
      {
        title: 'Get Forge version information',
        task: async context => {
          context.forgeVersion = await getForgeVersionByID(
            context.forgeVersionID
          )
          if (!context.forgeVersion) {
            throw new Error(
              `Cannot install invalid Forge version "${context.forgeVersionID}"`
            )
          }
          if (
            context.forgeVersion.minecraftVersionID !==
            context.instance.versionID
          ) {
            throw new Error(
              `Forge version ${forgeVersionID} is not compatible with Minecraft ${versionID}`
            )
          }
        }
      },
      {
        title: 'Download Forge bundle',
        task: context =>
          new Observable(async observer => {
            context.forgeJarPath = await downloadForge(
              context.directory,
              context.forgeVersion,
              {
                onProgress: ({ percentage }) =>
                  observer.next(`Downloading (${percentage.toFixed(2)}%)`)
              }
            )
            observer.complete()
          })
      },
      {
        title: 'Extract Forge depenedency list',
        task: async context => {
          context.libraries = await getForgeClientLibraries(
            context.forgeJarPath
          )
        }
      },
      {
        title: 'Check availability of Forge dependencies',
        task: context =>
          new Observable(async observer => {
            const preflightResults = await Promise.all(
              context.libraries.map(async ({ name, url }) => {
                observer.next(`Checking availability of: ${name}`)
                return await downloadPreflightCheck(url)
              })
            )
            context.libraries = await Promise.all(
              preflightResults.map(async (success, index) => {
                const library = context.libraries[index]
                if (success || !library.compressed) {
                  return library
                }
                observer.next(`Finding fallback for: ${library.ID}`)
                if (!await downloadPreflightCheck(library.fallbackUrl)) {
                  return observer.error(
                    new Error(
                      `Could not find a valid download URL for Forge dependency "${
                        library.name
                      }"`
                    )
                  )
                }
                return {
                  ...library,
                  fellBack: true,
                  compressed: false,
                  path: library.fallbackPath,
                  url: library.fallbackUrl
                }
              })
            )
            observer.complete()
          })
      },
      {
        title: 'Download Forge dependencies',
        task: context => {
          context.librariesDirectory = path.join(context.directory, 'libraries')
          return downloadManyFiles(
            context.librariesDirectory,
            context.libraries
          )
        }
      },
      {
        // TODO: Add progress
        title: 'Extract compressed dependencies',
        task: async context => {
          const compressedLibraries = context.libraries.filter(
            ({ compressed }) => compressed
          )
          await extractCompressedLibraries(
            context.librariesDirectory,
            compressedLibraries
          )
        }
      },
      {
        title: 'Update instance configuration',
        task: async context => {
          context.instance = {
            ...context.instance,
            forgeVersionID: context.forgeVersionID
          }
          await writeJson(context.instanceConfigPath, context.instance)
        }
      }
    ],
    { renderer: silent ? 'silent' : 'default' }
  )

const downloadForge = async (directory, { ID, downloads }) => {
  const download = downloads.find(({ name }) => name === 'universal')
  if (!download) {
    throw new Error(`No universal bundle for forge version ${ID} listed`)
  }

  const jarFilePath = path.join(directory, path.basename(download.url))
  await downloadToFile(download.url, jarFilePath).toPromise()
  return jarFilePath
}

const extractCompressedLibraries = async (directory, libraries) =>
  await Promise.all(
    libraries.map(async library => await extractLibrary(directory, library))
  )

const extractLibrary = async (
  directory,
  { path: libraryPath, fallbackPath },
  { deleteAfter = true } = {}
) => {
  const decompression = new LzmaDecompressor()
  const compressedPath = path.join(directory, libraryPath)
  const extractedPath = path.join(directory, fallbackPath)
  const compressedFile = createReadStream(compressedPath)
  const extractedFile = createWriteStream(extractedPath)
  compressedFile.pipe(decompression).pipe(extractedFile)
  await streamCompleted(extractedFile)
  if (deleteAfter) {
    await remove(compressedPath)
  }
}

module.exports = { installForge }
