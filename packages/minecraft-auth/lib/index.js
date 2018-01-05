const fetch = require('node-fetch')

const authServerUrl = 'https://authserver.mojang.com'

const authServerRequest = async (
  path = '/',
  body = {},
  { raw = false } = {}
) => {
  const res = await fetch(authServerUrl + path, {
    method: 'POST',
    headers: {
      'Content-type': 'application/json'
    },
    body: body ? JSON.stringify(body) : null
  })
  return raw ? res : await res.json()
}

const authenticateUser = ({
  username,
  password,
  clientToken,
  requestUser = true
}) =>
  authServerRequest('/authenticate', {
    username,
    password,
    requestUser,
    clientToken,
    agent: { name: 'Minecraft', version: 1 }
  })

const refreshAccessToken = ({ accessToken, clientToken, requestUser = true }) =>
  authServerRequest('/refresh', { accessToken, clientToken, requestUser })

const validateAccessToken = async ({ accessToken, clientToken }) => {
  const res = await authServerRequest(
    '/validate',
    { accessToken, clientToken },
    { json: false }
  )
  return res.status === 204 ? { valid: true } : await res.json()
}

const invalidateAccessToken = async ({ accessToken, clientToken }) => {
  await authServerRequest(
    '/invalidate',
    { accessToken, clientToken },
    { raw: true }
  )
}

const logoutUser = async ({ username, password }) => {
  await authServerRequest('/logout', { username, password }, { raw: true })
}
module.exports = {
  authServerRequest,
  authenticateUser,
  refreshAccessToken,
  validateAccessToken,
  invalidateAccessToken,
  logoutUser
}
