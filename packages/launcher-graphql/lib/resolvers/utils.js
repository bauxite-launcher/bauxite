const optionalRequire = require('optional-require')(require)

const typeNameResolverFromPlugins = (rootTypeName, defaultTypeName) => (
  instance,
  context
) => {
  const { names } = context.getInstalledPlugins()
  const resolverPlugins = names
    .map(pluginName => optionalRequire(`./plugins/${pluginName}`))
    .map(
      plugin =>
        plugin &&
        plugin[rootTypeName] &&
        plugin[rootTypeName].___pluginResolveType
    )
    .filter(x => x)
  const resolvedFromPlugin = resolverPlugins.reduce((found, resolver) => {
    if (found) return found
    return resolver(instance, context)
  }, null)

  return resolvedFromPlugin || defaultTypeName
}

module.exports = { typeNameResolverFromPlugins }
