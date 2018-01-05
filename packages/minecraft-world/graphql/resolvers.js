const path = require('path')
const throttle = require('lodash.throttle')
const get = require('lodash.get')
const { GraphQLDateTime } = require('graphql-iso-date')
const GraphQLInt64 = require('./int64Resolver')
const readWorldID = require('../lib/worldID')
const readLevel = require('../lib/level')
const { readPlayers, readPlayerByUuid } = require('../lib/players')
const { readPlayerStats } = require('../lib/playerStats')
const { readDimensions } = require('../lib/dimensions')
const { readPlayerAdvancements } = require('../lib/playerAdvancements')

const testWorldDirectory = path.resolve(
  __dirname,
  '..',
  'lib',
  'fixtures',
  'world'
)

const throttledReadWorldID = throttle(readWorldID, 30000)
const throttledReadLevel = throttle(readLevel, 30000)
const throttledReadPlayers = throttle(readPlayers, 30000)
const throttledReadPlayerStats = throttle(readPlayerStats, 30000)

const withLevelData = key => async saveGame => {
  const level = await throttledReadLevel(saveGame.directory)
  const out = get(level, key, null)
  if (Array.isArray(out)) return out.map(obj => ({ ...obj, saveGame }))
  if (typeof out === 'object') return { ...out, saveGame }
  return out
}

const withPlayerDataByUuid = key => async({ directory })

module.exports = {
  Query: {
    testSaveGame: () => ({ directory: testWorldDirectory })
  },
  SaveGame: {
    ID: ({ directory }) => throttledReadWorldID(directory),
    gameVersionID: withLevelData('gameVersionID'),
    difficulty: withLevelData('difficulty'),
    difficultyLocked: withLevelData('difficultyLocked'),
    gameMode: withLevelData('gameMode'),
    hardcore: withLevelData('hardcore'),
    time: withLevelData('time'),
    timeOfDay: withLevelData('timeOfDay'),
    weather: withLevelData('weather'),
    world: withLevelData('world'),
    rules: withLevelData('rules'),
    players: async saveGame => {
      const players = await throttledReadPlayers(saveGame.directory)
      return players.map(player => ({ ...player, saveGame }))
    }
  },
  Weather: {
    type: ({ raining, thundering }) => {
      if (thundering) return 'Thunder'
      if (raining) return 'Rain'
      return 'Clear'
    },
    forecast: ({ rainTime, thunderTime, clearTime }) => ({
      rainTime,
      thunderTime,
      clearTime,
      changeTime: Math.min(...[rainTime, thunderTime, clearTime].filter(x => x))
    })
  },
  WeatherForecast: {
    nextType: ({ changeTime, rainTime, thunderTime, clearTime }) => {
      switch (changeTime) {
        case rainTime:
          return 'Rain'
        case thunderTime:
          return 'Thunder'
        case clearTime:
          return 'Clear'
      }
      return null
    }
  },
  PlayerSave: {
    itemStatistics: async ({ saveGame, uuid }, { action }) => {
      const { item } = await throttledReadPlayerStats(saveGame.directory, uuid)
      return action
        ? item.filter(({ action: itemAction }) => action === itemAction)
        : item
    },
    advancements: async ({ saveGame, uuid }, { done, mod, typePrefix }) => {
      let advancements = await readPlayerAdvancements(saveGame.directory, uuid)
      if (typeof done !== 'undefined') {
        advancements = advancements.filter(
          ({ done: isDone }) => isDone === done
        )
      }
      if (mod) {
        advancements = advancements.filter(({ modID }) => mod === modID)
      }
      if (typePrefix) {
        advancements = advancements.filter(({ type }) =>
          type.split(/\//g).includes(typePrefix)
        )
      }
      return advancements
    }
  },
  World: {
    dimensions: async ({ rawDimensions, saveGame }) => {
      const dimensions = await readDimensions(saveGame.directory)
      return dimensions
    }
  },
  DateTime: GraphQLDateTime,
  Int64: GraphQLInt64
}
