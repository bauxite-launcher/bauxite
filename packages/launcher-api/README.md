# launcher-api

> Provides config, data storage and high-level API for managing Minecraft client instances.
> Designed to be consumed by `launcher-ui` and `launcher-cli`.

## Table of Contents

 - [Installation](#installation)
 - [API Overview](#api-overview)
    - [Managing Local Configuration Data](#managing-local-configuration-data)
      - [`getConfiguration`](#getconfiguration-async)
      - [`setConfiguration`](#setconfiguration-async)
    - [Managing User Profiles](#managing-user-profiles)
      - [`listProfiles`](#listprofiles-async)
      - [`createProfile`](#createprofile-async)
      - [`deleteProfile`](#deleteprofile-async)
      - [`getAccessToken`](#getaccesstoken-async)
      - [`getProfileByUsername`](#getprofilebyusername-async)
      - [`getProfileByUUID`](#getprofilebyuuid-async)
      - [`getProfileByName`](#getprofilebyname-async)
      - [`getDefaultProfile`](#getdefaultprofile-async)
      - [`setDefaultProfile`](#setdefaultprofile-async)
      - [`getAvatarByUuid`](#getavatarbyuuid-async)
    - [Minecraft Instance Management](#minecraft-instance-management)
      - [`listInstances`](#listinstances-async)
      - [`getInstance`](#getinstance-async)
      - [`deleteInstance`](#deleteinstance-async)
      - [`renameInstance`](#renameinstance-async)
      - [`installInstance`](#installinstance-async)
      - [`upgradeInstance`](#upgradeinstance-async)
      - [`cloneInstance`](#cloneinstance-async)
      - [`backupInstance`](#backupinstance-async)
    - [Launching Minecraft Instances](#starting--stopping-minecraft-instances)
      - [`startInstance`](#startinstance-async)
      - [`stopInstance`](#stopinstance-async)
      - [`getCurrentProcessIDForInstance`](#getcurrentprocessidforinstance-async)
    - [Utilities](#utilities)
      - [`getOperatingSystem`](#getoperatingsystem-sync)
      - [`generateInstanceName`](#generateinstancename-sync)

## Installation

```bash
$ yarn add @bauxite/launcher-api
```

or

```bash
$ npm install --save @bauxite/launcher-api
```

## API Overview

All methods described below return a Promise unless otherwise specified. "Return" implies the Promise having been  resolved, and "throw" implies the Promise having been rejected.

These methods, where interacting with the filesystem, will *all* write their files to the user's local configuration directory:

 - On Windows, this will be `%APPDATA%/Bauxite`
 - On OSX, this will be `~/Library/Preferences/Bauxite`
 - On all other platforms (i.e. Linux), this will be `~/.bauxite`

All methods that write to the filesystem will automatically ensure that any required directories exist.

### Managing Local Configuration Data

These methods provide read/write access to the user's local configuration data. These
preferences get stored as a JSON file, `config.json`.

Default values will be supplied for any values not stored in the configuration file,
or if the file is missing entirely.

#### `getConfiguration` _(async)_

Returns a Promise to return the user's local configuration data as a JSON object.

##### Return value

Returns an object, comprising:

 - `directory`: The base directory used by Bauxite for file storage. This is calculated as described above.
 - `managedBy`: An object containing two keys: `name` and `version`. This is to be used to allow migrations where configuration format is changed.
 - `clientToken`: A token supplied by Mojang to identify this client instance, when authenticating Minecraft users. This will only be present once a user has logged in.

```js
{
  "directory": "/home/<user>/.bauxite",
  "managedBy": {
    "name": "@bauxite/launcher-api",
    "version": "1.0.0"
  },
  "clientToken": "abdef0123456789abdef0123456789"
}
```

##### Example Usage

```js
const { getConfiguration } = require('@bauxite/launcher-api')

// in an async function:
const { directory, clientToken } = await getConfiguration()
```

#### `setConfiguration` _(async)_

Returns a Promise to update the user's local configuration data. Changes supplied will be merged into the existing configuration, and written to the directory specified above.

It is not possible to override the `directory` configuration item as yet ─ doing so will throw an error. This restriction may be relaxed in later versions as the ability to relocate an installation directory is introduced.

##### Parameters

 - `configChanges` - an object containing the new values to apply to the configuration.

##### Return value

Returns an object containing the (entire) updated configuration data, identical to that of [`getConfiguration`](#getconfiguration-async).

##### Example usage

```js
const { setConfiguration } = require('@bauxite/launcher-api')

// in an async function:
const updatedConfig = await setConfiguration({
  clientToken: '<hexadecimal token>'
})
```

### Managing User Profiles

These methods provide read/write access to the user's stored Mojang profiles. These preferences are stored as a JSON file in a subdirectory of the user's home directory.

#### `listProfiles` _(async)_

Gets a list of the user profiles

##### Return value

Returns a Promise to return an array of profile objects, each of the following shape:

```js
[
  {
    "username": "tehminerer@aol.com",
    "name": "tehminerer",
    "uuid": "<meaty hexadecimal token>"
    "properties": []
    "isDefault": true,
    "accessToken": "<hefty hexadecimal token>"
  }
]
```

 - `username`: The email address of the Mojang account used to authenticate the user, _or_ the username for legacy Minecraft accounts.
 - `name`: The player's in-game name
 - `uuid`: The player's in-game UUID
 - `properties`: An array additional metadata associated with the account, such as a Twitch access token.
 - `isDefault`: Whether this account is to be used by default when launching Minecraft
 - `accessToken`: The Mojang access token used to launch Minecraft

##### Example usage

```js
const { listProfiles } = require('@bauxite/launcher-api')

// in an async function
const profiles = await listProfiles()
```

#### `createProfile` _(async)_

Authenticates a Mojang account, and stores the associated profile for use in-game.

##### Parameters

 - `username`: The email address of the Mojang account, or legacy Minecraft username.
 - `password`: The password associated with the Mojang/Minecraft account

##### Return value

Returns an object containing the profile data, equivalent to an element of the array returned by [`listProfiles`](#listprofiles-async).

The `isDefault` property will be true if there is not already a default profile selected.

If the profile has already been added, an error will be thrown.

If the account does not exist, or the password is wrong, then an error will be thrown.

##### Example usage

```js
const { createProfile } = require('@bauxite/launcher-api')

const { name, uuid } = await createProfile('tehminerer@aol.com', 'hunter2')

console.log(`New profile "${name}" added successfully!`)
```

#### `deleteProfile` _(async)_

Removes a stored profile, and revokes the stored access token.

##### Parameters

 - `username`: The email/username of the account to delete.

##### Return value

Returns the profile object for the deleted profile. At this point, the returned access token will be invalid.

If the username does not match that of a stored profile, an error will be thrown.

##### Example Usage

```js
const { deleteProfile } = require('@bauxite/launcher-api')

const { name } = await deleteProfile('tehminerer@aol.com')

console.log(`Successfully removed profile "${name}"`)
```

#### `getAccessToken` _(async)_

Returns a valid access token for the named profile.

The existing stored access token is first validated ─ if it is still valid, it is returned ─ otherwise a fresh token is requested.

##### Parameters

 - `username`: Self-explanatory

##### Return value

Returns the access token as a string.

If the username supplied does not match that of a stored profile, an error will be thrown.

##### Example usage

```js
const { getAccessToken } = require('@bauxite/launcher-api')

const accessToken = await getAccessToken('tehminerer@aol.com')
```

#### `getProfileByUsername` _(async)_

Gets profile data for the supplied username

##### Parameters

 - `username` - The email address/username

##### Return value

A profile object, just like an element of the array returned by [`listProfiles`](#listprofiles-async).

##### Example usage

```js
const { getProfileByUsername } = require('@bauxite/launcher-api')

const { name } = await getProfileByUsername('tehminerer@aol.com')

console.log(`In-game name is "${name}"`)
```

#### `getProfileByUUID` _(async)_

Like [`getProfileByUsername`](#getprofilebyusername-async), but accepting a profile's UUID as a parameter instead.

#### `getProfileByName` _(async)_

Like [`getProfileByUsername`](#getprofilebyusername-async), but accepting a profile's in-game name as a parameter instead.

#### `getDefaultProfile` _(async)_

Gets the default selected user profile.

##### Return value

A profile object, just like an element of the array returned by [`listProfiles`](#listprofiles-async), where `isDefault` is `true`.

##### Example usage

```js
const { getDefaultProfile } = require('@bauxite/launcher-api')

const { name } = await getDefaultProfile()

console.log(`Default profile is "${name}"`)
```

#### `setDefaultProfile` _(async)_

Sets the default profile to use when launching the game.

##### Parameters

 - `name`: The in-game name of the profile to set as default

##### Return value

_Nothing. Zip. `undefined`._

If the profile has not already been added, then an error will be thrown.

#### `getAvatarByUuid` _async_

Gets the user's avatar as a Buffer containing PNG image data. Uses API from [Crafatar](https://crafatar.com) to fetch images.

##### Parameters

 - `uuid`: The UUID of the player for which to fetch the avatar
 - `options`: An optional object with the following properties:
   - `cache`: If `true`, a caching layer will be used to speed up repeated calls. This is enabled by default.
   - `size`: The pixel width/height (it's square) to render the avatar. Default is `8`, matching the actual size of the texture.

##### Return value

A `Buffer`, containing the image file in PNG format.

### Minecraft Instance Management

These methods provide access to the user's locally installed instances of Minecraft (as installed by Bauxite).

#### `listInstances` _(async)_

Gets a list of locally installed Minecraft instances, based on the contents of the instances directory.

##### Return value

Returns an array of objects, each representing a locally installed Minecraft instance, looking something like:

```js
[
  {
    "ID": "sketchy-villager-23",
    "directory": "/home/<user>/.bauxite/instances/sketchy-villager-23",
    "versionID": "1.10.2"
  },
  {
    "ID": "friendly-creeper-11",
    "directory": "/home/<user>/.bauxite/instances/friendly-creeper-11",
    "versionID": "1.12.2"
  }
]
```

##### Example usage

```js
const { listInstances } = require('@bauxite/launcher-api')

const instances = await listInstances()

console.log(`There are ${instances.length} instances installed:`)
instances.forEach(({ ID, versionID }) => {
  console.log(` - ${ID} (${versionID})`)
})
```

#### `getInstance` _(async)_

Gets details of a locally installed Minecraft instance by ID.

##### Parameters

 - `ID`: The ID of the instance to fetch details for.

##### Return value

An object representing the named instance, just like an element of the array returned by [`listInstances`](#listinstances-async).

##### Example usage

```js
const { getInstance } = require('@bauxite/launcher-api')

const { ID, versionID } = await getInstance('friendly-creeper-11')

console.log(`Instance "${ID}" is version "${versionID}"`)
```

#### `deleteInstance` _(async)_

Deletes (i.e. from the filesystem) an installed Minecraft instance, stored data and all.

##### Parameters

 - `instanceID`: The ID of the instance to delete.

##### Return value

Returns `true` if the instance existed (and was removed), or `false` if it does not exist.

#### `renameInstance` _(async)_

Renames (i.e. changes the ID of) an installed Minecraft instance, including renaming the instance directory.

##### Parameters

 - `oldInstanceID`: The current ID of the existing instance.
 - `newInstanceID`: The new ID of the instance.

##### Return value

An object representing the renamed instance, just like an element of the array returned by [`listInstances`](#listinstances-async). The `ID` returned will be the `newInstanceID`.

If the new chosen ID is already taken by another installed instance, an error will be thrown.

Likewise, if the new instance ID forms an invalid directory name, an error will be thrown.

#### `installInstance`

Installs an instance of the Minecraft locally.

##### Parameters

 - `inputInstanceID`: The ID of the instance to install. If omitted, a name will be generated at random using [`generateInstanceName`](#generateinstancename-sync).
 - `versionID`: The version of Minecraft to install. If omitted, the latest stable version will be selected.
 - `options`: An optional object with the following keys:
   - `onProgress`: An optional callback function which will be called with progress updates. See details below.
   - `cache`: If set to `false`, the installation cache will not be used. By default, it is `true`.
   - `overwrite`: If set to `true`, and `inputInstanceID` is specified, this will overwrite an existing instance matching that ID instead of throwing an error. This allows `installInstance` to function both as a means to repair a damaged instance, and as a way to upgrade instances, although for the latter you should use [`upgradeInstance`](#upgradeinstance-async).

##### Return value

When the installation is complete, an object is returned representing the new instance. It looks just like an element of the array returned by  [`listInstances`](#listinstances-async).

##### `onProgress` callback

If the `onProgress` callback is supplied, it will be called every few miliseconds with an update in the following shape:

```js
{
  "delta": 3233, // bytes transferred since last update
  "total": 4561282, // total size of transfer
  "progress": 2341232, // total progress so far
  "percent": 51.3283765 // progress as percent
}
```

The callback will be called a _minimum_ of twice - once at the start of the installation, and once at the end.

In reality, for most installations, this will be called many times a second - be sure not to attach any heavy UI logic to this callback without throttling it first!

#### `upgradeInstance` _(async)_

Upgrades an existing instance of Minecraft to a newer version.

Please note that while this method is capable of _downgrading_ an instance, this is likely to cause issues with any savegames, especially if using snapshot versions
of Minecraft, or moving between major releases.

This will not perform upgrades on any savegames attached to the instance ─ this
is performed by Minecraft itself when you first attempt to load that world.

##### Parameters

 - `instanceID`: The ID of the instance to upgrade
 - `versionID`: The new version of Minecraft to upgrade to
 - `options`: An optional object, with the following properties:
   - `backupFirst`: If `true` (default), then the instance will be cloned before performing the upgrade. The backup instance will be named in the format `{instanceID}-backup-{oldVersionID}`.
   - All other options from [`installInstance`](#installinstance-async) can be used, except `overwrite`, which will be ignored if set.

##### Return value

Returns a value identical to that of [`installInstance`](#installinstance-async).

If the specified instance does not already exist, an error is thrown.

##### Example usage

```js
const { upgradeInstance } = require('@bauxite/launcher-api')

const { ID, versionID } = await upgradeInstance('spicy-pig-32', '1.12.2')
// A short time later...
console.log(`Instance "${ID}" is now on version "${versionID}"!`)
```

#### `cloneInstance` _(async)_

Makes a complete copy of an existing instance, worlds and all.

##### Parameters

 - `instanceID`: The ID of the instance to clone.
 - `cloneInstanceID`: The new ID for the copy.

##### Return value

Returns an object describing the details of the new copy of the instance, just
like [`getInstance`](#getinstance-async)

##### Example usage

```js
const { cloneInstance } = require('@bauxite/launcher-api')

await cloneInstance('jumpy-zombie-99', 'svelte-ghast-38')
```

#### `backupInstance` _(async)_

Makes a backup copy of an existing instance. This is a wrapper around [`cloneInstance`](#cloneinstance-async).

##### Parameters

 - `instanceID`: The ID of the instance of which to make a backup.

##### Return value

Returns an object identical to that of [`cloneInstance`](#cloneinstance-async).

##### Example usage

```js
const { backupInstance } = require('@bauxite/launcher-api')

const { ID } = await backupInstance('covert-enderman-58')

console.log(ID)
// => covert-enderman-58-backup-1.12.2-2018-01-25T00:52:36.962Z
```

### Starting & Stopping Minecraft Instances

These methods allow the starting, stopping, and interrogation of locally installed Minecraft client instances.

#### `startInstance` _(async)_

Starts a locally installed Minecraft instance.

##### Parameters

 - `instanceID`: the ID of the instance to launch.
 - `username`: the username to launch the instance with.

##### Return value

Returns an object containing data about the launched instance, like the return value of [`getInstance`](#getinstance-async), with the addition of a `processID` field. This is an integer representing the launched Minecraft process's ID from the operating system.

If the instance is already running, an error will be thrown.

#### `stopInstance` _(async)_

Forcibly stops a running Minecraft instance.

##### Parameters

 - `instanceID`: The ID of the instance to stop.

##### Return value

Returns an object containing data about the stopped instance, like the return value of [`getInstance`](#getinstance-async).

If this instance is not already running, an error will be thrown.

#### `getCurrentProcessIDForInstance` _(async)_

Returns the process ID (pid) of the Minecraft instance, if it is currently running.

##### Parameters

 - `instanceID`: The ID of the instance to query

##### Return value

If the instance is currently running, the PID is returned as reported by the operating system.

Otherwise, `null` is returned.

### Utilities

#### `getOperatingSystem` _(sync)_

Returns the name of the current operating system, as used by Minecraft's version manifests.

##### Return value

Returns one of:

 - `Windows`
 - `OSX`
 - `Linux`

#### `generateInstanceName` _(sync)_

Returns a randomly-generated instance name of the format `noun-adjective-XX`, where `noun` is the name of a mob from Minecraft, and `XX` is a random 2-digit number.
