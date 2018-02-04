const decompress = require('decompress')

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

module.exports = { getFilesFromArchive }
