const { readJSON } = require('./utils')
const path = require('path')

const metadataFilename = 'world_data.json'

const getWorldID = async worldPath => {
  const metadataPath = path.join(worldPath, metadataFilename)
  const worldMetadata = await readJSON(metadataPath)
  if (!worldMetadata.world_id) {
    throw new Error(
      `JSON Metadata in ${metadataPath} does not contain a 'world_id' property`
    )
  }
  return worldMetadata.world_id
}

module.exports = getWorldID
