const { tmpdir } = require('os')
const { unlink, stat, createReadStream } = require('fs-extra')
const { join: joinPath } = require('path')
const { Readable } = require('stream')
const {
  createDownloadStream,
  downloadToFile,
  streamCompleted
} = require('./download.utils')
const {} = require('fs')
const nock = require('nock')

const testUrl = 'http://example.com'
describe('Download utilities', () => {
  let scope
  beforeEach(() => {
    scope = nock(testUrl).persist()
  })
  afterEach(() => {
    scope.persist(false)
    nock.restore()
  })
  describe('createDownloadStream', () => {
    it('should be a function', () => {
      expect(typeof createDownloadStream).toBe('function')
    })
    describe('when called with a valid URL', () => {
      let result
      beforeEach(async () => {
        scope.get('/').reply(200, () => fs.createReadStream(__filename))
        result = await createDownloadStream(testUrl)
      })
      it('should return a readable stream', () => {
        expect(result).toHaveProperty('stream')
        expect(result.stream).toBeInstanceOf(Readable)
        expect(scope.isDone())
      })
      it('should return the size of the file', () => {
        expect(result).toHaveProperty('size')
        expect(typeof result.size).toBe('number')
        expect(result.size).toBeGreaterThan(0)
        expect(scope.isDone())
      })
    })
  })

  describe('downloadToFile', () => {
    it('should be a function', () => {
      expect(typeof downloadToFile).toBe('function')
    })
    describe('when called with a valid URL and path', () => {
      let testPath
      beforeEach(() => {
        testPath = joinPath(tmpdir(), 'tmpDownload')
      })
      afterEach(async () => await unlink(testPath))
      it('should download the file to the path', async () => {
        const result = await downloadToFile(testUrl, testPath)
        const downloaded = await stat(testPath)
        expect(downloaded.size).toBeGreaterThan(0)
        expect(scope.isDone())
      })
      it('should accept an onProgress callback', async () => {
        const onProgress = jest.fn()
        const result = await downloadToFile(testUrl, testPath, { onProgress })
        expect(onProgress).toHaveBeenCalled()
        expect(scope.isDone())
      })
    })
  })
})
