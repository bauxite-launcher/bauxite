const { listInstances, deleteInstance } = require('@bauxite/launcher-api')
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
          name: `${instance.ID} (${instance.versionID})`
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

const manageInstance = async (exit, instance) => {
  console.log('\n  - Name:', instance.ID),
    console.log('  - Minecraft Version:', instance.versionID),
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
