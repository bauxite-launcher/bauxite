const path = require('path')
const { readJSON } = require('fs-extra')
const parseDate = require('date-fns/parse')

const readPlayerAdvancements = async (worldDirectory, playerUuid) => {
  const advancementsPath = path.join(
    worldDirectory,
    'advancements',
    `${playerUuid}.json`
  )
  const advancements = await readJSON(advancementsPath)
  return Object.entries(advancements).map(
    ([id, { criteria, done = false }]) => {
      const [mod, type, path = ''] = id.split(/\:/g)
      return {
        ID: id,
        modID: mod,
        type,
        done,
        criteria: Object.entries(criteria).map(([name, completedAt]) => {
          const [date, time, tz] = completedAt.split(/\s+/g)
          return {
            name,
            completedAt: parseDate(`${date}T${time}Z${tz}`)
          }
        })
      }
    }
  )
}

module.exports = { readPlayerAdvancements }
