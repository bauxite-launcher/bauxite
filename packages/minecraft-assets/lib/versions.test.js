const { formatMinecraftVersions, getMinecraftVersions } = require('./versions')

const fakeMinecraftVersions = {
  versions: [
    {
      id: '17w49b',
      type: 'snapshot',
      time: '2017-12-07T15:31:34+00:00',
      releaseTime: '2017-12-07T15:29:54+00:00',
      url:
        'https://launchermeta.mojang.com/mc/game/19d97d8ffffd71cce712414a2a9b95c1ed168e55/17w49b.json'
    },
    {
      id: '1.12.2',
      type: 'release',
      time: '2017-12-07T09:55:13+00:00',
      releaseTime: '2017-09-18T08:39:46+00:00',
      url:
        'https://launchermeta.mojang.com/mc/game/cf72a57ff499d6d9ade870b2143ee54958bd33ef/1.12.2.json'
    }
  ],
  latest: {
    snapshot: '17w49b',
    release: '1.12.2'
  }
}

describe('Versions API', () => {
  describe('formatMinecraftInstances', () => {
    let result
    beforeEach(() => (result = formatMinecraftVersions(fakeMinecraftVersions)))

    it('should return an array of versions', () => {
      expect(result).toHaveProperty('versions')
      expect(Array.isArray(result.versions)).toBe(true)
      result.versions.forEach(version => {
        expect(typeof version).toBe('object')
        expect(version).toHaveProperty('ID')
        expect(typeof version.ID).toBe('string')
        expect(version).toHaveProperty('type')
        expect(typeof version.type).toBe('string')
        expect(version).toHaveProperty('uploadedAt')
        expect(version.uploadedAt).toBeInstanceOf(Date)
        expect(version).toHaveProperty('releasedAt')
        expect(version.releasedAt).toBeInstanceOf(Date)
        expect(version).toHaveProperty('assetManifestUrl')
      })
    })

    it('should return the latest instance', () => {
      expect(result).toHaveProperty('latest')
      expect(result).toHaveProperty(
        'latest.Snapshot.ID',
        fakeMinecraftVersions.versions[0].id
      )
      expect(result).toHaveProperty(
        'latest.Release.ID',
        fakeMinecraftVersions.versions[1].id
      )
    })
  })

  describe('getMinecraftVersions', () => {
    let fetch
    beforeEach(() => {
      fetch = jest.fn()
      fetch.mockImplementation(async () => ({
        json: async () => fakeMinecraftVersions
      }))
    })

    it('should be a function', () => {
      expect(typeof getMinecraftVersions).toBe('function')
    })

    it('should call the supplied fetch function', async () => {
      await getMinecraftVersions({ fetch })
      expect(fetch).toBeCalled()
    })

    it('should allow overriding of the manifest URL', async () => {
      await getMinecraftVersions({ fetch, manifestUrl: 'http://mc.versions/' })
      expect(fetch).toHaveBeenCalledWith('http://mc.versions/', {})
    })

    it('should pass additional options to the fetch function', async () => {
      await getMinecraftVersions({
        fetch,
        manifestUrl: 'http://mc.versions/',
        foo: 'bar',
        baz: 'qux'
      })
      expect(fetch).toHaveBeenCalledWith('http://mc.versions/', {
        foo: 'bar',
        baz: 'qux'
      })
    })
  })
})
