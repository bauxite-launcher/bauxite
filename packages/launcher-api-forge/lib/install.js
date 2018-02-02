const path = require('path')
const {
  readJson,
  writeJson,
  createReadStream,
  createWriteStream
} = require('fs-extra')
const {
  downloadToFile,
  downloadManyFiles,
  downloadPreflightCheck,
  streamCompleted
} = require('@bauxite/minecraft-installer/lib/download.utils')
const { getForgeVersionByID } = require('./versions')
const { getForgeClientLibraries } = require('./libraries')
const { Decompressor: LzmaDecompressor } = require('xz')

//TODO: remove
const logProgress = ({ percent, percentage }) =>
  process.stdout.write(
    `\rDownloading ${(percent || percentage || 0).toFixed(1)}%`
  )

// TODO: onProgress callback
const installForge = async (directory, forgeVersionID) => {
  const instanceConfigPath = path.join(directory, 'bauxite.json')
  const instanceID = path.basename(directory)
  const { versionID, ...oldConfig } = await readJson(instanceConfigPath)

  console.log('Instance name:', instanceID)
  console.log('Minecraft version:', versionID)
  console.log('Forge version ID:', forgeVersionID)

  const forgeVersion = await getForgeVersionByID(forgeVersionID)
  if (!forgeVersion) {
    throw new Error(`Cannot install invalid Forge version "${forgeVersionID}"`)
  }
  if (forgeVersion.minecraftVersionID !== versionID) {
    throw new Error(
      `Forge version ${forgeVersionID} is not compatible with Minecraft ${versionID}`
    )
  }

  console.log('Downloading Forge universal bundle...\n')
  const jarFile = await downloadForge(directory, forgeVersion, {
    onProgress: logProgress
  })

  console.log('\nInspecting Forge bundle for required libraries...')
  const libraries = await getForgeClientLibraries(jarFile)

  console.log('Checking remote availability of required libraries...')
  const preflightResults = await Promise.all(
    libraries.map(async ({ url }) => await downloadPreflightCheck(url))
  )
  const checkedLibraries = await Promise.all(
    preflightResults.map(async (success, index) => {
      const library = libraries[index]
      if (success || !library.compressed) {
        return library
      }
      if (!await downloadPreflightCheck(library.fallbackUrl)) {
        throw new Error(
          `Could not find a valid download URL for Forge library "${
            library.name
          }"`
        )
      }
      console.info(
        `Could not find compressed version of forge library "${
          library.name
        }". Falling back to uncompressed version.`
      )
      return {
        ...library,
        fellBack: true,
        compressed: false,
        path: library.fallbackPath,
        url: library.fallbackUrl
      }
    })
  )

  console.log('Downloading Forge required libraries...\n')
  const librariesDirectory = path.join(directory, 'libraries')
  await downloadManyFiles(librariesDirectory, checkedLibraries, {
    onProgress: logProgress
  })

  console.log('\nExtracting packed libraries...')
  const compressedLibraries = checkedLibraries.filter(
    ({ compressed }) => compressed
  )
  await extractCompressedLibraries(librariesDirectory, compressedLibraries)

  console.log('\nUpdating instance config...')
  const newConfig = {
    ...oldConfig,
    versionID,
    forgeVersionID
  }

  await writeJson(instanceConfigPath, newConfig)

  console.log('Updated!', newConfig)

  return {
    ID: instanceID,
    directory,
    ...newConfig
  }
}

const downloadForge = async (
  directory,
  { ID, downloads },
  { onProgress } = {}
) => {
  const download = downloads.find(({ name }) => name === 'universal')
  if (!download) {
    throw new Error(`No universal bundle for forge version ${ID} listed`)
  }

  const jarFilePath = path.join(directory, path.basename(download.url))
  await downloadToFile(download.url, jarFilePath, { onProgress })
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
