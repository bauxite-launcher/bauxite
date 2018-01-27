const { listInstances } = require('@bauxite/launcher-api/lib/instances')
const { listProfiles } = require('@bauxite/launcher-api/lib/profiles')
const { prompt, Separator } = require('inquirer')
const { menuLoop } = require('./util/menuLoop')
const { handler: installHandler } = require('./install')
const { handler: launchHandler } = require('./launch/interactive')
const { handler: profileHandler } = require('./profile/interactive')
const { handler: instancesHandler } = require('./instances/interactive')

exports.command = '$0'
exports.describe = 'Provides interactive usage of other commands'
exports.handler = async () => await menuLoop(mainMenu)

const mainMenu = async exitAfter => {
  const instances = await listInstances()
  const profiles = await listProfiles()
  const actionChoices = [
    ...(instances.length
      ? [
          {
            name: 'Launch an instance of Minecraft',
            value: 'launch'
          },
          {
            name: 'Manage your Minecraft instances',
            value: 'instances'
          }
        ]
      : []),
    {
      name: `Install an${
        instances.length ? 'other' : ''
      } instance of Minecraft`,
      value: 'install'
    },
    {
      name: profiles.length
        ? 'Manage your Mojang accounts'
        : `Login with your Mojang account`,
      value: 'profiles'
    },
    new Separator(),
    { name: "I'm done! Exit.", value: 'quit' }
  ]
  const { action } = await prompt([
    {
      name: 'action',
      message: 'What do you want to do?',
      type: 'list',
      choices: actionChoices,
      default: actionChoices[0].value
    }
  ])
  if (action === 'quit') {
    return exitAfter()
  }
  await actionHandlers[action]({})
}

const actionHandlers = {
  launch: launchHandler,
  instances: instancesHandler,
  install: installHandler,
  profiles: profileHandler
}
