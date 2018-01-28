#!/usr/bin/env node
const express = require('express')
const { graphqlExpress, graphiqlExpress } = require('apollo-server-express')
const bodyParser = require('body-parser')
const open = require('open')
const launcherAPI = require('@bauxite/launcher-api')
const { makeSchema } = require('../lib')

const launchServer = async (port = 2501) => {
  const app = express()
  const schema = await makeSchema()
  app.use(
    '/api',
    bodyParser.json(),
    graphqlExpress({ schema, context: launcherAPI })
  )
  app.use('/', graphiqlExpress({ endpointURL: '/api' }))
  await new Promise(resolve => app.listen(port, resolve))
  return { ...app, port }
}

if (module.parent) {
  module.exports = { launchServer }
} else {
  launchServer(process.env.PORT).then(
    ({ port }) => {
      const url = `http://0.0.0.0:${port}`
      console.log(`GraphiQL UI at ${url}/`)
      console.log(`GraphQL endpoint at: ${url}/api`)
      console.log('Press Ctrl + C to close')
      // open(url)
    },
    error =>
      console.error(
        `Could not launch server, because ${error.stack || error.valueOf()}`
      )
  )
}
