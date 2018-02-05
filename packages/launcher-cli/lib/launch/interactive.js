const {
  listInstances,
  startInstance,
  stopInstance,
  getDefaultProfile
} = require('@bauxite/launcher-api')
const path = require('path')
const { ensureDir, remove } = require('fs-extra')
const { Tail } = require('tail')
const { prompt, Separator } = require('inquirer')
const Listr = require('listr')
const { menuLoop } = require('../util/menuLoop')

exports.command = '$0'
exports.handler = async () => await menuLoop(launchMenu)

const launchMenu = async exitAfter => {
  const { instances, profile } = await new Listr(
    [
      {
        title: 'Get installed instances',
        task: async context => {
          context.instances = await listInstances()
        }
      },
      {
        title: 'Get default profile',
        task: async context => {
          context.profile = await getDefaultProfile()
        }
      }
    ],
    { concurrent: true }
  ).run()

  if (!instances.length) return exitAfter()
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
  return await new Listr([
    {
      title: 'Rotate logs',
      task: () => rotateLogs(instance)
    },
    {
      title: 'Launch instance',
      task: async context => {
        const { process } = await startInstance(instance.ID, profile.username)
        context.process = process
      }
    },
    {
      title: 'Wait for launch',
      task: async context => await instanceStarted(instance, context.process)
    },
    {
      title: 'Dereference instance',
      task: context => {
        context.process.unref()
      }
    }
  ]).run()
}

// TODO: Do this properly
const rotateLogs = async instance => {
  const logDirectory = path.join(instance.directory, 'logs')
  await remove(logDirectory)
  await ensureDir(logDirectory)
}

const instanceStarted = async (instance, process) => {
  const logFile = path.join(instance.directory, 'logs', 'out.log')
  const tail = new Tail(logFile)
  await new Promise(resolve => {
      tail.on('line', line => {
        if (line.includes('Reloading ResourceManager')) {
          resolve()
        }
      })
  })
  tail.unwatch()
}
