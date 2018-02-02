const {
  listInstances,
  startInstance,
  stopInstance,
  getDefaultProfile
} = require('@bauxite/launcher-api')
const { prompt, Separator } = require('inquirer')
const ora = require('ora')
const { menuLoop } = require('../util/menuLoop')

exports.command = '$0'
exports.handler = async () => await menuLoop(launchMenu)

const launchMenu = async exitAfter => {
  const spinner = ora('Fetching installed instances').start()
  const instances = await listInstances()
  spinner.stop()
  if (!instances.length) return exitAfter()

  const profileSpinner = ora(`Getting default profile`).start()
  const profile = await getDefaultProfile()
  profileSpinner.stop()
  if (!profile) {
    console.log('You must be logged in to launch Minecraft.')
    return exitAfter()
  }

  const { instance } = await prompt([
    {
      type: 'list',
      name: 'instance',
      message: 'Which instance would you like to launch?',
      choices: [
        ...instances.map(instance => ({
          value: instance,
          name: `${instance.ID} (${instance.versionID})`
        })),
        new Separator(),
        { value: { goBack: true }, name: 'Go back' }
      ]
    }
  ])
  if (instance.goBack) {
    return exitAfter()
  } else {
    return await launchInstance(instance, profile)
  }
}

const launchInstance = async (instance, profile) => {
  const launchSpinner = ora(
    `Starting "${instance.ID}" (Minecraft ${instance.versionID})`
  ).start()
  try {
    await startInstance(instance.ID, profile.username)
    launchSpinner.succeed(`Instance "${instance.ID}" started!`)
  } catch (error) {
    console.error(error.stack)
    launchSpinner.fail(`Could not launch instance "${instance.ID}"`)
  }
}
