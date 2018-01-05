const os = require('os')

const getOperatingSystem = (platform = os.platform()) =>
  platform === 'win32' ? 'Windows' : platform === 'darwin' ? 'OSX' : 'Linux'

module.exports = { getOperatingSystem }
