const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const { getInstalledPlugins } = require('@bauxite/launcher-api')
const optionalRequire = require('optional-require')(require)

const readFile = promisify(fs.readFile)

const readSchema = async schema =>
  await readFile(path.join(__dirname, `${schema}.graphql`), 'utf8')

const schemata = [
  'base',
  'config',
  'install',
  'profiles',
  'instances',
  'versions'
]

const getSchemata = async schemata => Promise.all(schemata.map(readSchema))

const getPluginSchemata = async () => {
  const pluginSchemata = await Promise.all(
    getInstalledPlugins().names.map(async plugin => {
      const schemata = optionalRequire(`./${plugin}`)
      if (!schemata) return
      return await getSchemata(schemata.map(schema => `${plugin}/${schema}`))
    })
  )
  return pluginSchemata.reduce((all = [], these = []) => all.concat(these), [])
}

const getAllSchemata = async () => {
  const [baseSchemata, pluginSchemata] = await Promise.all([
    getSchemata(schemata),
    getPluginSchemata()
  ])
  return [...baseSchemata, ...pluginSchemata]
}

module.exports = getAllSchemata
