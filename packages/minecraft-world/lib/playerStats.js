const { readJSON } = require('fs-extra')
const path = require('path')

const itemActionMap = {
  mineBlock: 'MineBlock',
  craftItem: 'CraftItem',
  drop: 'DropItem',
  pickup: 'PickupItem'
}

const readPlayerStats = async (workingDirectory, playerUuid) => {
  const statsPath = path.join(workingDirectory, 'stats', `${playerUuid}.json`)
  const rawStats = await readJSON(statsPath)
  return Object.entries(rawStats).reduce(
    (out, [key, value]) => {
      const [type, action, ...rest] = key.split('.')
      if (type !== 'stat') {
        console.warn('Unknown stat type for', key)
        return out
      }
      if (itemActionMap[action]) {
        out.item.push({
          action: itemActionMap[action],
          itemID: rest.join('.'),
          count: value
        })
      } else {
        out.other.push({
          action,
          path: rest.join('.'),
          value
        })
      }
      return out
    },
    { item: [], other: [] }
  )
}

module.exports = { readPlayerStats }
