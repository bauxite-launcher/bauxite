const path = require('path')
const { readdir } = require('fs-extra')
const { readNBT } = require('./utils')
const { readVillages } = require('./world')

const readDimensionsFromDirectories = async worldDirectory => {
  const worldDirContents = await readdir(worldDirectory)
  return worldDirContents
    .filter(name => name.match(/^DIM(-?[\d]+)$/))
    .map(([match, id]) => ({ dimensionID: parseInt(id, 10) }))
}

const staticDimensions = [
  { ID: 0, type: 'Overworld' },
  { ID: -1, type: 'Nether' },
  { ID: 1, type: 'End', __typename: 'EndWorldDimension' }
]

const readDimensions = async worldDirectory => {
  const fromDirectories = await readDimensionsFromDirectories(worldDirectory)
  const static = staticDimensions.map(dim => {
    const found = fromDirectories.find(
      ({ dimensionID }) => dimensionID === dim.ID
    )
    const dimension = found ? { ID: found.dimensionID, type: 'Unknown' } : dim
    if (!dimension.__typename) {
      dimension.__typename = 'GenericWorldDimension'
    }
    return dimension
  })
  const other = fromDirectories.filter(
    ({ dimensionID }) => Math.abs(dimensionID) <= 1
  )
  return [...static, ...other]
}

module.exports = { readDimensions }
