const decompress = require('decompress')

const MINECRAFT_MAVEN_URL = 'https://libraries.minecraft.net/'

// TODO: Move to utils
const getFilesFromArchive = async (archivePath, targetFiles) => {
  try {
    return await decompress(archivePath, {
      filter: targetFiles && (({ path }) => targetFiles.includes(path))
    })
  } catch (error) {
    console.error(error.stack)
    throw new Error(`Could not extract files from "${archivePath}"`)
  }
}

const getForgeInstanceManifest = async forgeJar => {
  const [manifestFile] = await getFilesFromArchive(forgeJar, ['version.json'])

  if (!manifestFile) {
    throw new Error(`Could not find version.json inside ${forgeJar}`)
  }

  try {
    return JSON.parse(manifestFile.data.toString('utf8'))
  } catch (error) {
    throw new Error(`Could not parse version data from ${forgeJar}`)
  }

  return manifestFile
}

const getForgeLibraries = async forgeJar => {
  const { libraries } = await getForgeInstanceManifest(forgeJar)
  return libraries.map(
    ({
      name,
      url: baseUrl = MINECRAFT_MAVEN_URL,
      serverreq = false,
      clientreq = true,
      checksums: [sha1, md5] // TODO: verify that these are the right way round
    }) => {
      const [packageRoot, packageName, version] = name.split(/:/g)
      return {
        ID: name,
        name: `${packageRoot}.${packageName}`,
        version: packageVersion,
        client: clientreq,
        server: serverreq,
        url: formatMavenUrl(baseUrl, packageRoot, packageName, version),
        hash: sha1
      }
    }
  )
}

const getForgeClientLibraries = async forgeJar => {
  const { libraries } = await getForgeLibraries(forgeJar)
  return libraries.filter(({ client }) => client)
}

const getForgeServerLibraries = async forgeJar => {
  const { libraries } = await getForgeLibraries(forgeJar)
  return libraries.filter(({ server }) => server)
}

const formatMavenUrl = (repo, owner, name, version) =>
  [repo, owner, name, version, `${name}-${version}.jar`].join('/')

module.exports = { getForgeInstanceManifest }
