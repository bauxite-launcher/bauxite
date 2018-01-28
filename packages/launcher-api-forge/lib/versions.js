const fetch = require('make-fetch-happen')
const { memoize, orderBy } = require('lodash')
const parseDate = require('date-fns/parse')

const FORGE_MAVEN_URL =
  'http://files.minecraftforge.net/maven/net/minecraftforge/forge'
const FORGE_MANIFEST_URL = `${FORGE_MAVEN_URL}/json`

const getForgeVersionManifest = async () => {
  const result = await fetch(FORGE_MANIFEST_URL)
  return await result.json()
}

// TODO: Use common HTTP or file cache provided by launcher-api
const getForgeVersions = memoize(async () => {
  const { number: versions, promos } = await getForgeVersionManifest()
  const formattedVersions = Object.entries(versions).map(
    ([_, { branch, build, files, mcversion, version, modified }]) => ({
      ID: version,
      build,
      minecraftVersionID: mcversion,
      branch,
      releasedAt: parseDate(modified * 1000),
      files: files.map(([extension, name, hash]) => {
        const filePath = `${mcversion}-${version}-${name}.${extension}`
        return {
          ID: `${build}-${name}`,
          name,
          path: filePath,
          sha1: hash,
          url: `${FORGE_MAVEN_URL}/${mcversion}-${version}/${filePath}`
        }
      }),
      latest: promos[`${mcversion}-latest`] === build,
      recommended: promos[`${mcversion}-recommended`] === build
    })
  )
  return orderBy(formattedVersions, ['releasedAt'], ['desc'])
})

const getForgeVersionByID = async ID => {
  const versions = await getForgeVersions()
  return versions.find(({ ID: thisID }) => thisID === ID)
}

const getForgeVersionsForMinecraftVersion = async versionID => {
  const versions = await getForgeVersions()
  return versions.filter(
    ({ minecraftVersionID }) => minecraftVersionID === versionID
  )
}

module.exports = {
  getForgeVersions,
  getForgeVersionByID,
  getForgeVersionsForMinecraftVersion
}
