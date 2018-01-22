const { compose } = require('react-app-rewired');
const rewireForCssModules = require('react-app-rewire-css-modules');
const rewireForYarnWorkspaces = require('react-app-rewire-yarn-workspaces');

module.exports = compose(rewireForCssModules, rewireForYarnWorkspaces);
