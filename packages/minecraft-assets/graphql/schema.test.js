const { execute, parse } = require('graphql')
const { makeSchema } = require('./schema')
describe('Minecraft Assets GraphQL API', () => {
  let schema
  beforeEach(async () => {
    schema = await makeSchema()
  })
  const makeQuery = query => {
    const documentAST = parse(query)
    return async ({ variables, context = {}, root = {} } = {}) =>
      await execute(schema, documentAST, root, context, variables)
  }
  const runQuery = describe('Query', () => {
    describe('minecraftVersions', () => {
      const query = makeQuery(`query testVersions($type: [MinecraftReleaseType]) {
        minecraftVersions(releaseTypes: $type) {
          ID
          type
        }
      }`)
      describe('with no release type specified', () => {
        it('should return all versions', async () => {
          const { data } = await query()
          expect(Array.isArray(data.minecraftVersions)).toBe(true)
        })
      })
      describe('with only one release type specified', () => {
        it('should return only those types', async () => {
          const { data } = await query({ variables: { type: ['Release'] } })
          data.minecraftVersions.forEach(version => {
            expect(version).toHaveProperty('type', 'Release')
          })
        })
      })
    })
    describe('latestMinecraftVersion', () => {
      const query = makeQuery(`query testLatestVersion($type: MinecraftReleaseType) {
        latestMinecraftVersion(releaseType: $type) {
          ID
          type
        }
      }`)
      describe('when called with no release type', () => {
        it('should return the latest version', async () => {
          const { data } = await query()
          expect(data).toHaveProperty('latestMinecraftVersion.type', 'Release')
        })
      })
      describe('when called with Snapshot', () => {
        it('should return the latest snapshot version', async () => {
          const { data } = await query({ variables: { type: 'Snapshot' } })
          expect(data).toHaveProperty('latestMinecraftVersion.type', 'Snapshot')
        })
      })
    })
  })
})
