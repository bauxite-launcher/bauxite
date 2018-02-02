const menuLoop = async (menu, ...args) => {
  let shouldContinue = true
  let previousErrorThrown
  let lastResult
  do {
    try {
      lastResult = await menu(() => (shouldContinue = false), ...args)
    } catch (error) {
      console.error(
        `Error in menu loop "${menu.name}":\n${error.stack || error}`
      )
      if (previousErrorThrown && error.stack === previousErrorThrown.stack) {
        console.error(`Preventing infinite loop in broken menu ${menu.name}...`)
        process.exit(1)
      }
      previousErrorThrown = error
    }
  } while (shouldContinue)
  return lastResult
}

module.exports = { menuLoop }
