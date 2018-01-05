const { readdir } = require('fs-extra')
const path = require('path')
const decompress = require('decompress')

const findClientJar = async directory => {
  console.log('Scanning directory', directory, 'for Java archives')
  const dirListing = await readdir(directory)
  const jarFiles = dirListing.filter(name => name.match(/\.jar$/i))
  console.log('Found', jarFiles.length, ' potential Java archive(s):')
  jarFiles.forEach(name => console.log('-', name))

  const checked = await Promise.all(
    jarFiles.map(isMinecraftClientJar(directory))
  )
  const [{ jarFile }] = checked.filter(({ isMinecraft }) => isMinecraft)
  return jarFile
}

const isMinecraftClientJar = directory => async file => {
  const jarFile = path.join(directory, file)
  console.log('Inspecting Java archive', file, '...')
  const [manifest] = await decompress(jarFile, undefined, {
    filter: ({ path }) => path === 'META-INF/MANIFEST.MF'
  })
  if (!manifest) {
    return { isMinecraft: false, jarFile: file }
  }
  const manifestProps = manifest.data
    .toString('utf8')
    .split(/\r?\n/g)
    .map(line => line.split(': '))
    .filter(([key]) => key)
    .reduce(
      (out, [key, value = '']) => ((out[key.trim()] = value.trim()), out),
      {}
    )
  const manifestVersion = manifestProps['Manifest-Version']
  if (!manifestVersion) {
    return { isMinecraft: false, jarFile: file }
  }
  return {
    isMinecraft:
      manifestProps['Main-Class'] === 'net.minecraft.server.MinecraftServer',
    jarFile: file
  }
}

const findClient = async directory => {
  return {
    versionID: 'unknown',
    jarFile: await findClientJar(directory)
  }
}

module.exports = { findClient }
