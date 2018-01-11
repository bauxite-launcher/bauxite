const Table = require('tty-table')
const chalk = require('chalk')

const noProfilesMessage = arg0 => {
  console.log(
    chalk.white(
      "\n  You don't currently have any",
      chalk.bold('Mojang accounts'),
      'logged-in.\n'
    )
  )
  console.log(chalk.white('  You can log in using the following command:\n'))
  console.log('    ', chalk.gray('$'), chalk.cyan(arg0, 'profile login'))
}

const profileTable = profiles => {
  const headers = [{ value: 'Profile name' }, { value: 'uuid', width: 39 }]
  const rows = profiles.map(({ name, uuid, isDefault }) => [
    formatName(name, isDefault),
    formatUuid(uuid)
  ])
  const table = new Table(headers, rows)
  console.log(table.render())
}

const formatName = (name, isDefault) => (isDefault ? `${name} (default)` : name)
const formatUuid = uuid =>
  [
    uuid.slice(0, 8),
    uuid.slice(8, 12),
    uuid.slice(12, 16),
    uuid.slice(16, 20),
    uuid.slice(20)
  ].join('-')

module.exports = { noProfilesMessage, profileTable }
