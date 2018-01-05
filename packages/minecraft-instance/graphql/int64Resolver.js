const { GraphQLScalarType } = require('graphql')
const Int64 = require('node-int64')

const config = {
  name: 'Int64',
  description:
    'A 64-bit integer, represented either as an integer, or a hexadecimal ' +
    'string, prefixed with `0x`.',
  serialize(value) {
    if (value instanceof Int64) {
      return serializeToDecimal(value)
    }
  },
  parseValue(value) {
    console.log('parseValue', value)
    throw new Error('TODO: Implement Int64.parseValue')
  },
  parseLiteral(ast) {
    console.log('parseLiteral', ast)
    throw new Error('TODO: Implement Int64.parseLiteral')
  }
}

const serializeToDecimal = value => {
  if (isFinite(value.valueOf())) {
    return value.valueOf()
  }
  return `0x${value.toOctetString()}`
}

module.exports = new GraphQLScalarType(config)
