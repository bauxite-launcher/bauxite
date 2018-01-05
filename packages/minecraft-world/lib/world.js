const path = require('path')
const { readNBT } = require('./utils')

const readVillages = async (worldDirectory, dimension) => {
  const villagePath = path.join(
    worldDirectory,
    'data',
    dimension ? `villages-${dimension}.dat` : `villages.dat`
  )

  const village = await readNBT(villagePath)
}
