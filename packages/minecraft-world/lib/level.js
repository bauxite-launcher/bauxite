const path = require('path')
const Int64 = require('node-int64')
const { readNBT } = require('./utils')
const { difficulties, gameModes, generatorTypeMap } = require('./common')

const levelFilename = 'level.dat'

const readLevelData = async worldDirectory => {
  const levelFilePath = path.join(worldDirectory, levelFilename)
  return await readNBT(levelFilePath)
}

const parseRules = (rules, types) => {
  return Object.entries(types).reduce(
    (
      out,
      [key, { type, key: ruleKey = key, default: defaultValue, parse }]
    ) => {
      const value = rules[ruleKey]
      const hasValue = typeof value !== 'undefined'

      if (!hasValue) {
        out[key] = defaultValue
      } else if (parse) {
        out[key] = parse(value)
      } else {
        switch (type) {
          case Boolean:
            out[key] = value === 'true'
            break
          case String:
            out[key] = value
            break
          case 'Integer':
            out[key] = parseInt(value, 10)
            break
        }
      }
      return out
    },
    {}
  )
}

// TODO: Data.Player (single-player, use same parser as players.dat)
const parseLevelData = ({ Data }) => {
  return {
    world: {
      rawDimensions: parseDimensions(Data.DimensionData),
      seed: new Int64(...Data.RandomSeed),
      generator: {
        type: generatorTypeMap[Data.generatorName],
        version: Data.generatorVersion,
        options: Data.generatorOptions || null,
        features: !!Data.MapFeatures
      },
      border: {
        size: Data.BorderSize,
        sizeLerpTarget: Data.BorderSizeLerpTarget,
        sizeLerpTime: new Int64(...Data.BorderSizeLerpTime),
        safeZone: Data.BorderSafeZone,
        warningBlocks: Data.BorderWarningBlocks,
        warningTime: Data.BorderWarningTime,
        damagePerBlock: Data.BorderDamagePerBlock,
        center: { x: Data.BorderCenterX, z: Data.BorderCenterZ }
      },
      spawn: {
        x: Data.SpawnX,
        y: Data.SpawnY,
        z: Data.SpawnZ
      }
    },
    lastPlayed: new Date(new Int64(...Data.LastPlayed).valueOf()),
    gameVersionID: Data.Version.Name,
    difficulty: difficulties[Data.Difficulty],
    difficultyLocked: !!Data.DifficultyLocked,
    gameMode: gameModes[Data.GameType],
    hardcore: !!Data.hardcore,
    time: new Int64(...Data.Time),
    timeOfDay: Data.DayTime[1] % 24000,
    weather: {
      raining: !!Data.raining,
      rainTime: Data.rainTime,
      thundering: !!Data.thundering,
      thunderTime: Data.thunderTime,
      clearTime: Data.clearWeatherTime
    },

    dataVersion: Data.DataVersion,
    nbtVersion: Data.version,
    rules: parseRules(Data.GameRules, {
      announceAdvancements: { type: Boolean, default: true },
      commandBlockOutput: { type: Boolean, default: true },
      elytraMovementCheck: {
        type: Boolean,
        key: 'disableElytraMovementCheck',
        default: true,
        parse: val => val !== 'true'
      },
      doDaylightCycle: { type: Boolean, default: true },
      doEntityDrops: { type: Boolean, default: true },
      doFireTick: { type: Boolean, default: true },
      doLimitedCrafting: { type: Boolean, default: false },
      doMobLoot: { type: Boolean, default: true },
      doMobSpawning: { type: Boolean, default: true },
      doTileDrops: { type: Boolean, default: true },
      doWeatherCycle: { type: Boolean, default: true },
      gameLoopFunction: {
        type: String,
        default: null,
        parse: val => (!val || val === '-' ? null : val)
      },
      keepInventory: { type: Boolean, default: false },
      logAdminCommands: { type: Boolean, default: true },
      maxCommandChainLength: { type: 'Integer', default: 65536 },
      maxEntityCramming: { type: 'Integer', default: 24 },
      mobGriefing: { type: Boolean, default: true },
      randomTickSpeed: { type: 'Integer', default: 3 },
      reducedDebugInfo: { type: Boolean, default: false },
      sendCommandFeedback: { type: Boolean, default: true },
      showDeathMessages: { type: Boolean, default: true },
      spawnRadius: { type: 'Integer', default: 10 },
      spectatorsGenerateChunks: { type: Boolean, default: true }
    })
  }
}

const dimensionParsers = {
  1: end => ({
    __typename: 'EndWorldDimension',
    type: 'End',
    dragon: end.DragonFight
      ? {
          uuid: Int64(
            end.DragonFight.DragonUUIDMost,
            end.DragonFight.DragonUUIDLeast
          ),
          alive: !end.DragonFight.DragonKilled,
          killed: !!end.DragonFight.PreviouslyKilled
        }
      : null,
    exitPortal: end.DragonFight
      ? {
          x: end.DragonFight.exitPortalLocation.X,
          y: end.DragonFight.exitPortalLocation.Y,
          z: end.DragonFight.exitPortalLocation.Z
        }
      : null
  }),
  0: overworld => ({
    type: 'Overworld'
  })
}
const parseDimensions = (dimensions = {}) => {
  return Object.entries(dimensions).map(([id, dimension]) => ({
    __typename: 'GenericWorldDimension',
    type: 'Unknown',
    dimensionID: id,
    ...((dimensionParsers[id] && dimensionParsers[id](data)) || {})
  }))
}

const getLevel = async worldDirectory => {
  const levelData = await readLevelData(worldDirectory)
  return parseLevelData(levelData)
}

module.exports = getLevel
