const { readJSON, readFile } = require('fs-extra')
const {
  parse: parseNBTAsync,
  simplify: simplifyNBT
} = require('prismarine-nbt')
const { promisify } = require('util')
const parseNBT = promisify(parseNBTAsync)

const readNBT = async (path, { simplify = true } = {}) => {
  const nbt = await parseNBT(await readFile(path))
  return simplify ? simplifyNBT(nbt) : nbt
}

module.exports = { readJSON, readNBT }
