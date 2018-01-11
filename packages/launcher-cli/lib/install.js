const { prompt } = require('inquirer')
const {
  getMinecraftVersions
} = require('@bauxite/minecraft-assets/lib/versions')
const { installInstance } = require('@bauxite/launcher-api/lib/install')

exports.command = 'install [version] [name]'
exports.aliases = 'i'
exports.describe = 'Install an instance of Minecraft'
exports.builder = yargs =>
  yargs
    .positional('version', {
      describe: 'The specific version to install (e.g. 1.12.2)',
      type: 'string'
    })
    .positional('name', {
      describe: 'A unique name for the instance',
      type: 'string'
    })

exports.handler = async argv => {
  const options = await interactivelyFillOptions(argv)
  console.log('Installing...')
  const newInstance = await installInstance(
    options.name || null,
    options.version
  )
  console.log('Installed!', newInstance)
}

const interactivelyFillOptions = async argv => {
  const { versions, latest } = await getMinecraftVersions()
  const latestVersionID = latest.Release.ID

  const options = { name: argv.name, version: argv.version }
  let attempts = 0
  while (!optionsIsValid(options, versions)) {
    if (attempts++) {
      console.warn(`There's something wrong with those options!`)
      if (!versionIsValid(options.version, versions)) {
        console.warn(` - "${options.version}" isn't a valid Minecraft version`)
      }
      if (!nameIsValid(options.name)) {
        console.warn(
          ` - "${
            options.name
          }" is an invalid name. Valid characters are: 0-9 a-z _ -`
        )
      }
    }
    Object.assign(
      options,
      await prompt([
        {
          name: 'version',
          message: 'Which version of Minecraft should I install?',
          type: 'list',
          choices: versions
            .filter(({ type }) => type === 'Release')
            .map(
              ({ ID }) =>
                ID === latestVersionID
                  ? { name: `${ID} (latest)`, value: ID }
                  : ID
            ),
          default: latest.Release.ID,
          when: !versionIsValid(options.version, versions)
        },
        {
          name: 'name',
          message: 'Optionally, pick a unique name to identifier this instance',
          type: 'input',
          when: !options.name || !nameIsValid(options.name)
        }
      ])
    )
  }
  return options
}

const optionsIsValid = ({ name, version }, versions) => {
  return nameIsValid(name) && versionIsValid(version, versions)
}

const nameIsValid = name => !name || name.match(/^[a-z0-9_-]+$/i)

const versionIsValid = (versionID, versions) =>
  versionID && versions.find(({ ID }) => ID === versionID)
