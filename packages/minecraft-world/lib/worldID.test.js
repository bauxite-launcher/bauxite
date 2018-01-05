const getWorldID = require('./worldID')
const path = require('path')

const worldDirectory = path.join(__dirname, 'fixtures', 'world')
const expectedID = 'a02e535593a84b79b6858512cc33d78a'

describe('getWorldID', () => {
  it('should return the world ID from world_data.json', async () => {
    const result = await getWorldID(worldDirectory)
    expect(result).toBe(expectedID)
  })
})
