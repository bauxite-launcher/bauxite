const {
  listInstances,
  deleteInstance,
  cloneInstance,
  renameInstance,
  getInstalledPlugins,
  installForge,
  getForgeVersionsForMinecraftVersion
} = require('@bauxite/launcher-api')
const { prompt, Separator } = require('inquirer')
const Listr = require('listr')
const { menuLoop } = require('../util/menuLoop')

exports.command = '$0'
exports.handler = async () => await menuLoop(instancesMenu)

const instancesMenu = async exitAfter => {
  const { instances } = await new Listr([
    {
      title: 'Get instances',
      task: async context => {
        context.instances = await listInstances()
      }
    }
  ]).run()
  if (!instances.length) return exitAfter()
  const { action } = await prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Which instance would you like to manage?',
      choices: [
        ...instances.map(instance => ({
          value: instance,
          name: formatInstanceName(instance)
        })),
        new Separator(),
        { value: 'back', name: 'Go back' }
      ]
    }
  ])
  if (action === 'back') {
    return exitAfter()
  } else {
    return await menuLoop(manageInstance, action)
  }
}

const formatInstanceName = ({ ID, versionID, forgeVersionID }) =>
  `${ID} (${versionID}${forgeVersionID ? ` / Forge ${forgeVersionID}` : ''})`

const manageInstance = async (exit, instance) => {
  const forgeEnabled = getInstalledPlugins().names.includes('forge')
  console.log('\n  - Name:', instance.ID)
  console.log('  - Minecraft Version:', instance.versionID)
  if (instance.forgeVersionID) {
    console.log('  - Forge Version:', instance.forgeVersionID)
  }
  console.log('  - Directory:', instance.directory, '\n')
  const { action } = await prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { value: 'clone', name: 'Make a copy of this instance' },
        { value: 'rename', name: 'Rename this instance' },
        { value: 'delete', name: 'Delete this instance' },
        ...(forgeEnabled && !instance.forgeVersionID
          ? [{ value: 'forge', name: 'Install Forge' }]
          : []),
        new Separator(),
        { value: 'back', name: 'Go back' }
      ]
    }
  ])
  switch (action) {
    case 'delete':
      if (await deleteMenu(instance)) {
        exit()
      }
      return
    case 'clone':
      return await cloneMenu(instance)
    case 'rename':
      return await renameMenu(instance)
    case 'forge':
      return await menuLoop(installForgeMenu, instance)
  }
  exit()
}

const deleteMenu = async instance => {
  const { confirm } = await prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message:
        'Are you absolutely sure? All saved data will be completely deleted!',
      default: false
    }
  ])
  if (!confirm) return
  const { successful } = await new Listr([
    {
      title: 'Delete instance',
      task: async context => {
        context.successful = await deleteInstance(instance.ID)
      }
    }
  ]).run()
  return successful
}

const renameMenu = async instance => {
  const { newID } = await prompt([
    {
      type: 'input',
      name: 'newID',
      message: 'Enter a new name for the instance:'
    }
  ])
  if (!newID) return
  await new Listr([
    {
      title: 'Rename instance',
      task: async () => await renameInstance(instance.ID, newID)
    }
  ]).run()
}

const cloneMenu = async instance => {
  const { newID } = await prompt([
    {
      type: 'input',
      name: 'newID',
      message: 'Enter a name for the clone of the instance:'
    }
  ])
  if (!newID) return
  await new Listr([
    {
      // TODO: Add progress
      title: 'Copy instance',
      task: async () => await cloneInstance(instance.ID, newID)
    }
  ]).run()
}

const installForgeMenu = async (exitAfter, instance) => {
  const { forgeVersions } = await new Listr([
    {
      title: `Get Forge versions compatible with ${instance.versionID}`,
      task: async context => {
        context.forgeVersions = await getForgeVersionsForMinecraftVersion(
          instance.versionID
        )
      }
    }
  ]).run()

  const recommendedForgeVersionID = forgeVersions.find(
    ({ recommended }) => recommended
  ).ID
  const latestForgeVersionID = forgeVersions.find(({ latest }) => latest).ID

  const { versionType, selectedForgeVersionID } = await prompt([
    {
      type: 'list',
      name: 'versionType',
      message: 'Which version of Forge should I install?',
      choices: [
        {
          value: 'recommended',
          name: `The recommended compatible version (${recommendedForgeVersionID})`
        },
        {
          value: 'latest',
          name: `The latest (unstable) compatible version (${latestForgeVersionID})`
        },
        { value: 'select', name: 'Let me choose a version!' },
        new Separator(),
        { value: 'back', name: 'Go back' }
      ]
    },
    {
      type: 'list',
      name: 'selectedForgeVersionID',
      message: 'Which specific version of Forge?',
      choices: forgeVersions.map(({ ID, latest, recommended }) => ({
        value: ID,
        name: `${ID}${latest ? ' (latest)' : ''}${
          recommended ? ' (recommended)' : ''
        }`
      })),
      default: forgeVersions.find(({ recommended }) => recommended).ID,
      when: ({ versionType }) => versionType === 'select'
    }
  ])

  if (versionType === 'back') return exitAfter()

  const forgeVersionID = {
    recommended: recommendedForgeVersionID,
    latest: latestForgeVersionID,
    select: selectedForgeVersionID
  }[versionType]

  await installForge({ silent: false }).run({
    directory: instance.directory,
    forgeVersionID
  })

  exitAfter()
  return true
}
