const fs = require('fs')
const path = require('path')
const { promisify } = require('util')

const readFile = promisify(fs.readFile)

const readSchema = async schema =>
  await readFile(path.join(__dirname, `${schema}.graphql`), 'utf8')

const schemata = ['base', 'config', 'install', 'profiles', 'instances']
const getSchema = async () => Promise.all(schemata.map(readSchema))

module.exports = getSchema
