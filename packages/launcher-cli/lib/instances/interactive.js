const {
  listInstances,
  deleteInstance,
  getInstalledPlugins,
  installForge,
  getForgeVersionsForMinecraftVersion
} = require('@bauxite/launcher-api')
const { prompt, Separator } = require('inquirer')
const ora = require('ora')
const { menuLoop } = require('../util/menuLoop')

exports.command = '$0'
exports.handler = async () => await menuLoop(instancesMenu)

const instancesMenu = async exitAfter => {
  const instances = await listInstances()
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
  const spinner = ora('Deleting instance...').start()
  const successful = await deleteInstance(instance.ID)
  if (successful) {
    spinner.succeed('Deleted instance')
  } else {
    spinner.fail('Could not delete instance')
  }
  return successful
}

const cloneMenu = async instance => {
  const { newID } = await prompt([
    {
      type: 'input',
      name: 'newID',
      message: 'Enter a name for the clone of the instance:',
      validate: ({ newID }) => newID.match(/^[a-z0-9-]+$/i)
    }
  ])
  if (!newID) return
  const spinner = ora(`Copying instance "${instance.ID}" as "${newID}"`).start()
  try {
    await cloneInstance(instance.ID, newID)
    spinner.succeed('Copied instance')
  } catch (error) {
    console.error(error.stack)
    spinner.fail('Could not copy instance')
  }
}

const installForgeMenu = async (exitAfter, instance) => {
  const spinner = ora(
    `Getting versions of Forge compatible with ${instance.versionID}...`
  ).start()
  const forgeVersions = await getForgeVersionsForMinecraftVersion(
    instance.versionID
  )
  spinner.stop()
  const { versionType, selectedForgeVersionID } = await prompt([
    {
      type: 'list',
      name: 'versionType',
      message: 'Which version of Forge should I install?',
      choices: [
        { value: 'recommended', name: 'The recommended compatible version' },
        { value: 'latest', name: 'The latest (unstable) compatible version' },
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

  let forgeVersionID
  switch (versionType) {
    case 'recommended':
      forgeVersionID = forgeVersions.find(({ recommended }) => recommended).ID
      break
    case 'latest':
      forgeVersionID = forgeVersions.find(({ latest }) => latest).ID
      break
    case 'select':
      forgeVersionID = selectedForgeVersionID
      break
    default:
      return exitAfter()
  }
  const installSpinner = ora(
    `Downloading and installing Forge ${forgeVersionID}`
  ).start()
  try {
    await installForge(instance.directory, forgeVersionID)
    installSpinner.succeed(`Installed Forge ${forgeVersionID}!`)
  } catch (error) {
    console.error(error.stack || error)
    installSpinner.fail(`Failed to install ${forgeVersionID}`)
  }
  exitAfter()
}
