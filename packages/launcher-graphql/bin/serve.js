#!/usr/bin/env node
const express = require('express')
const { graphqlExpress } = require('apollo-server-express')
const bodyParser = require('body-parser')
const { makeSchema } = require('../lib/schema')

const launchServer = async (port = 2501) => {
  const app = express()
  const schema = await makeSchema()
  app.use('/', bodyParser.json(), graphqlExpress({ schema }))
  await new Promise(resolve => app.listen(port, resolve))
  return { ...app, port }
}

if (module.parent) {
  module.exports = { launchServer }
} else {
  launchServer(process.env.PORT).then(
    ({ port }) => console.log(`Server listening at http://localhost:${port}`),
    error =>
      console.error(
        `Could not launch server, because ${error.stack || error.valueOf()}`
      )
  )
}
