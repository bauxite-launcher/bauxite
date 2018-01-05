const nock = require('nock')
const path = require('path')
const { tmpdir } = require('os')
const { ensureDir, remove, exists } = require('fs-extra')
const { downloadLibraries } = require('./download')

describe('Downloads', () => {
  let workingDir
  beforeEach(async () => {
    workingDir = path.join(tmpdir(), 'tmpDownload')
    await ensureDir(workingDir)
  })
  afterEach(async () => {
    await remove(workingDir)
    nock.restore()
  })

  describe('downloadClient', () => {
    it('should be a function')
  })
  describe('downloadServer', () => {
    it('should be a function')
  })
  describe('downloadLibraries', () => {
    let scope
    beforeEach(() => {
      scope = nock('https://libraries.minecraft.net').persist()
    })
    afterEach(() => {
      scope.persist(false)
    })

    it('should be a function', () => {
      expect(typeof downloadLibraries).toBe('function')
    })

    it('should download all libraries', async () => {
      const results = await downloadLibraries(workingDir, fakeLibraries)
      expect(Array.isArray(results)).toBe(true)
      expect(results).toHaveProperty('length', fakeLibraries.length)
      expect(results).toHaveProperty('0.path')
      const hasDownloaded = await exists(results[0].path)
      expect(hasDownloaded).toBe(true)
      expect(scope.isDone()).toBe(true)
    })

    it('should fire its onProgress event at least twice per file', async () => {
      scope.get('*').reply(200, { test: 'passed' })
      const onProgress = jest.fn()
      const results = await downloadLibraries(workingDir, fakeLibraries, {
        onProgress
      })
      expect(onProgress.mock.calls.length).toBeGreaterThanOrEqual(2)
      onProgress.mock.calls.forEach(([call], index, calls) => {
        expect(call).toHaveProperty('totalSize', 46790)
        expect(call).toHaveProperty('completedSize')
        if (index) {
          expect(call.completedSize).toBeGreaterThanOrEqual(
            calls[index - 1][0].completedSize
          )
        }
        expect(call).toHaveProperty('totalFiles', 2)
        expect(call).toHaveProperty('completedFiles')
      })
      const lastCall =
        onProgress.mock.calls[onProgress.mock.calls.length - 1][0]
      expect(lastCall).toHaveProperty('completedSize', 46790)
      expect(lastCall).toHaveProperty('active.length', 0)
      expect(lastCall).toHaveProperty('percent', 100)
      expect(lastCall).toHaveProperty('completedFiles', 2)
    })
  })
  describe('downloadAssets', () => {
    it('should be a function')
  })
})

const fakeLibraries = [
  {
    ID: 'com.mojang:patchy:1.1',
    downloads: [
      {
        ID: 'aef610b34a1be37fa851825f12372b78424d8903',
        url:
          'https://libraries.minecraft.net/com/mojang/patchy/1.1/patchy-1.1.jar',
        sha1: 'aef610b34a1be37fa851825f12372b78424d8903',
        path: 'com/mojang/patchy/1.1/patchy-1.1.jar',
        size: 15817
      }
    ]
  },
  {
    ID: 'oshi-project:oshi-core:1.1',
    downloads: [
      {
        ID: '9ddf7b048a8d701be231c0f4f95fd986198fd2d8',
        url:
          'https://libraries.minecraft.net/oshi-project/oshi-core/1.1/oshi-core-1.1.jar',
        sha1: '9ddf7b048a8d701be231c0f4f95fd986198fd2d8',
        path: 'oshi-project/oshi-core/1.1/oshi-core-1.1.jar',
        size: 30973
      }
    ]
  }
]
