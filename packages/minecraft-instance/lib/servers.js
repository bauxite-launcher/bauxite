const path = require('path')
const { readNBT } = require('./utils')

const readServerListing = async instanceDirectory => {
  const serverListingPath = path.join(instanceDirectory, 'servers.dat')
  const serverListing = await readNBT(serverListingPath)
  return serverListing.servers.map(({ acceptTextures, ip, ...rest }) => ({
    ...rest,
    host: ip,
    acceptServerResources: !!acceptTextures
  }))
}

module.exports = { readServerListing }
