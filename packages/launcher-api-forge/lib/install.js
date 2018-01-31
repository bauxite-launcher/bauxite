const path = require('path')
const { readJson, writeJson } = require('fs-extra')
const {
  downloadToFile,
  downloadManyFiles,
  downloadPreflightCheck
} = require('@bauxite/minecraft-installer/lib/download.utils')
const { getForgeVersionByID } = require('./versions')
const { getForgeClientLibraries } = require('./libraries')

//TODO: remove
const logProgress = ({ percent, percentage }) =>
  process.stdout.write(
    `\rDownloading ${(percent || percentage || 0).toFixed(1)}%`
  )

// TODO: onProgress callback
const installForge = async (directory, forgeVersionID) => {
  const instanceConfigPath = path.join(directory, 'bauxite.json')
  const instanceID = path.basename(directory)
  const { versionID } = await readJson(instanceConfigPath)

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

  console.log('\nChecking Forge bundle dependencies...')
  const libraries = await getForgeClientLibraries(jarFile)

  console.log('Performing preflight checks...')
  const preflightResults = await Promise.all(
    libraries.map(async ({ url }) => await downloadPreflightCheck(url))
  )
  await Promise.all(
    preflightResults.map(async (success, index) => {
      if (success) return

      const library = libraries[index]
      if (library.compressed) {
        console.info(
          `Could not find compressed version of forge dependency "${
            library.name
          }". Falling back to non-packed version.`
        )
        if (!await downloadPreflightCheck(library.fallbackUrl)) {
          throw new Error(
            `Could not find a valid download URL for Forge dependency "${
              library.name
            }"`
          )
        }
        libraries[index] = Object.assign(library, {
          fellBack: true,
          compressed: false,
          url: library.fallbackUrl
        })
      }
    })
  )

  console.log('Downloading Forge bundle dependencies...\n')
  await downloadManyFiles(directory, libraries, { onProgress: logProgress })

  console.log('\nUpdating instance config...')
  const newConfig = {
    versionID,
    forgeVersionID: forgeVersionID
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

module.exports = { downloadForge, installForge }
