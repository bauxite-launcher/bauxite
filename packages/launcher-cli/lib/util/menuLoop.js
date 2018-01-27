const menuLoop = async (menu, ...args) => {
  let shouldContinue = true;
  do {
    await menu(() => (shouldContinue = false), ...args);
  } while (shouldContinue);
};

module.exports = { menuLoop };
