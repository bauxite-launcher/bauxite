const { readNBT } = require('./utils')
const { readdir } = require('fs-extra')
const path = require('path')
const { gameModes } = require('./common')

const playerDirName = 'playerdata'

const readPlayers = async worldDirectory => {
  const playerDirPath = path.join(worldDirectory, playerDirName)
  const playerDirContents = await readdir(playerDirPath)
  const playerUuids = playerDirContents
    .map(name =>
      name.match(/^([0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})\.dat$/)
    )
    .filter(matches => matches)
    .map(([name, uuid]) => uuid)

  return await Promise.all(
    playerUuids.map(uuid => readPlayerByUuid(worldDirectory, uuid))
  )
}

const readPlayerByUuid = async (worldDirectory, playerUuid) => {
  const playerDataPath = path.join(
    worldDirectory,
    playerDirName,
    `${playerUuid}.dat`
  )
  const player = await readNBT(playerDataPath)
  return {
    uuid: playerUuid,
    gameMode: gameModes[player.playerGameType],
    score: player.Score,
    experience: {
      total: player.XpTotal,
      level: player.XpLevel,
      progress: (player.XpP * 100).toFixed(2)
    },
    food: {
      level: player.foodLevel,
      exhaustion: player.foodExhaustionLevel.toFixed(2),
      saturation: player.foodSaturationLevel.toFixed(2)
    },
    inventory: (player.Inventory || []).map(
      ({ Slot, id, Count, Damage, tag }) => ({
        slot: Slot,
        item: {
          itemID: id,
          count: Count,
          damage: Damage,
          tag: tag
        }
      })
    ),
    selectedInventorySlot: player.SelectedItemSlot,
    enderChestInventory: (player.EnderItems || []).map(
      ({ Slot, id, Count, Damage, tag }) => ({
        slot: Slot,
        item: {
          itemID: id,
          count: Count,
          damage: Damage,
          tag: tag
        }
      })
    ),
    abilities: {
      walkSpeed: player.abilities.walkSpeed.toFixed(2),
      flySpeed: player.abilities.flySpeed.toFixed(2),
      canFly: !!player.abilities.mayfly,
      flying: !!player.abilities.flying,
      invulnerable: !!player.abilities.invulnerable,
      canBuild: !!player.abilities.mayBuild,
      canDestroyBlocksInstantly: !!player.abilities.instabuild
    },
    spawnLocation: {
      x: player.SpawnX,
      y: player.SpawnY,
      z: player.SpawnZ
    },
    spawnForced: !!player.SpawnForced,
    position: {
      x: player.Pos[0].toFixed(2),
      y: player.Pos[1].toFixed(2),
      z: player.Pos[2].toFixed(2)
    },
    velocity: {
      x: player.Motion[0].toFixed(2),
      y: player.Motion[1].toFixed(2),
      z: player.Motion[2].toFixed(2)
    },
    rotation: {
      yaw: player.Rotation[0].toFixed(2),
      pitch: player.Rotation[1].toFixed(2)
    },
    dimensionID: player.Dimension
  }
}

module.exports = { readPlayers, readPlayerByUuid }
