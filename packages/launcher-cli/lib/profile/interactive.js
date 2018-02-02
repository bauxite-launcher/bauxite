const {
  listProfiles,
  createProfile,
  deleteProfile,
  getAvatarByUuid,
  getInstalledPlugins
} = require('@bauxite/launcher-api')
const ora = require('ora')
const { prompt, Separator } = require('inquirer')
const asciify = require('asciify-image')
const fetch = require('make-fetch-happen')
const { times } = require('lodash')
const { menuLoop } = require('../util/menuLoop')

exports.command = '$0'
exports.handler = async () => await menuLoop(profileMenu)

const profileMenu = async exitAfter => {
  const spinner = ora('Fetching profiles').start()
  const profiles = await listProfiles()
  spinner.stop()
  if (!profiles.length) {
    await menuLoop(loginForm)
    return exitAfter()
  }
  const { action } = await prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        ...profiles.map(profile => ({
          value: profile,
          name: `${profile.name}${
            profile.isDefault ? ' (default profile)' : ''
          }`
        })),
        new Separator(),
        {
          value: 'login',
          name: 'Login with an additional account'
        },
        { value: 'back', name: 'Go back' }
      ]
    }
  ])
  if (action === 'back') {
    return exitAfter()
  } else if (action === 'login') {
    if (await menuLoop(loginForm)) {
      exitAfter()
    }
  } else {
    if (await menuLoop(manageProfile, action)) {
      return exitAfter()
    }
  }
}

const loginForm = async exitAfter => {
  const { username, password } = await prompt([
    {
      type: 'input',
      name: 'username',
      message: 'Enter your Mojang account email address:'
    },
    {
      type: 'password',
      name: 'password',
      message: 'Enter your password:',
      when: ({ username }) => username
    }
  ])
  if (!username) {
    exitAfter()
    return true
  }
  const spinner = ora('Authenticating with Mojang').start()
  let newProfile
  try {
    newProfile = await createProfile(username, password)
    spinner.succeed(`Authenticated successfully!`)
    exitAfter()
  } catch (loginError) {
    console.error(loginError.stack)
    spinner.fail(`Could not authenticate with Mojang!`)
    return
  }
  return await menuLoop(manageProfile, newProfile)
}

const manageProfile = async (exitAfter, profile) => {
  await renderProfile(profile)
  const { action } = await prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        ...(profile.isDefault
          ? []
          : [{ value: 'default', name: 'Make this profile my default' }]),
        { value: 'logout', name: 'Logout this profile' },
        new Separator(),
        { value: 'back', name: 'Go back' }
      ]
    }
  ])
  switch (action) {
    case 'default':
      return await setDefaultProfileMenu(profile.name)
    case 'logout':
      await deleteProfileMenu(profile.username)
      exitAfter()
      return true
  }
  exitAfter()
}

const setDefaultProfileMenu = async name => {
  const spinner = ora(`Setting "${name}" as default profile`).start()
  try {
    await setDefaultProfile(name)
    spinner.succeed(`Set "${name}" as default profile`)
  } catch (error) {
    console.error(error.stack)
    spinner.fail(`Could not set "${name}" as default profile"`)
  }
}

const deleteProfileMenu = async username => {
  const spinner = ora(`Logging out of profile "${censor(username)}"`).start()
  try {
    await deleteProfile(username)
    spinner.succeed(`Logged out of profile "${censor(username)}"`)
  } catch (error) {
    console.error(error.stack)
    spinner.fail(`Could not log out profile "${censor(username)}"`)
  }
}

const renderProfile = async ({ uuid, name, username, isDefault }) => {
  const spinner = ora(`Fetching profile details for "${name}"`).start()
  const avatar = await getAvatarByUuid(uuid)
  const ascii = await asciify(avatar)
  spinner.stop()
  const message = [
    'Profile details:',
    '',
    ` - In-game name: ${name}`,
    ` - Mojang account: ${censor(username)}`,
    ...(isDefault ? [``, ` * Default profile`] : [])
  ]
  console.log('\n')
  ascii
    .split(/\n/g)
    .forEach((line, index) =>
      console.log(
        `   ${line}   ${
          index > 1 && index < message.length + 2 ? message[index - 2] : ''
        }`
      )
    )
  console.log('\n')
}

const censor = email =>
  email.replace(
    /\b([a-z]+)\b/gi,
    part => part[0] + times(part.length - 1, () => '*').join('')
  )
