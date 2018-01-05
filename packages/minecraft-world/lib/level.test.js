const getLevel = require('./level')
const path = require('path')

const worldDirectory = path.join(__dirname, 'fixtures', 'world')

describe('getLevel', () => {
  let result
  beforeEach(async () => {
    result = await getLevel(worldDirectory)
  })
  afterEach(() => {
    result = null
  })

  it('should return an object', () => {
    expect(typeof result).toBe('object')
  })

  it('which should contain a world object', () => {
    console.log(require('util').inspect(result, { depth: 5, colors: true }))
    expect(result).toHaveProperty('world')
    expect(typeof result).toBe('object')
  })
})
