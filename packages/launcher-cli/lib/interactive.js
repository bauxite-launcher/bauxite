const { listInstances } = require('@bauxite/launcher-api/lib/instances')
const { listProfiles } = require('@bauxite/launcher-api/lib/profiles')
const { prompt } = require('inquirer')
const { handler: installHandler } = require('./install')
const { handler: profileHandler } = require('./profile')

exports.command = '$0'
exports.describe = 'Provides interactive usage of other commands'
exports.handler = async () => {
  const instances = await listInstances()
  const profiles = await listProfiles()
  const actionChoices = [
    ...(instances.length
      ? [
          { name: 'Launch an instance of Minecraft', value: 'launch' },
          { name: 'Manage your Minecraft instances', value: 'instances' }
        ]
      : []),
    {
      name: `Install an${
        instances.length ? 'other' : ''
      } instance of Minecraft`,
      value: 'install'
    },
    ...(profiles.length
      ? [{ name: 'Manage your Mojang accounts', value: 'profiles' }]
      : [
          {
            name: `Login with ${
              !profiles.length ? 'your' : 'an additional'
            } Mojang account`,
            value: 'profiles'
          }
        ]),
    ,
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
  await actionHandlers[action]({})
}

const actionHandlers = {
  launch: async () => {},
  instances: async () => {},
  install: installHandler,
  profiles: profileHandler,
  quit: () => process.exit(0)
}
