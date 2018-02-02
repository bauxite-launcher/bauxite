# launcher-api-forge

> Provides high-level API for managing Forge Minecraft client instances.
> Works as a plugin for `launcher-api`.
> Designed to be consumed by `launcher-ui` and `launcher-cli`.

## Table of Contents

 - [Installation](#installation)
 - [API Overview](#api-overview)
    - [Forge Versions](#forge-versions)
      - [`getForgeVersions`](#getforgeversions-async)
      - [`getForgeVersionByID`](#getforgeversionbyid-async)
      - [`getForgeVersionsForMinecraftVersion`](#getforgeversionsforminecraftversion-async)
      - [`getForgeInstanceManifest`](#getforgeinstancemanifest-async)
    - [Installing Forge](#installing-forge)
      - [`installForge`](#installforge-async)
    - [Launching Forge Instances](#launching-forge-instances)
      - [`generateForgeLaunchArguments`](#generateforgelauncharguments-async)

## Installation

```bash
$ yarn add @bauxite/launcher-api-forge
```

or

```bash
$ npm install --save @bauxite/launcher-api-forge
```

## API Overview

All methods described below return a Promise unless otherwise specified. "Return" implies the Promise having been  resolved, and "throw" implies the Promise having been rejected.

### Forge Versions

#### `getForgeVersions` _(async)_

Fetch a list of all available versions of Forge.

##### Return value

Returns an array of objects, each representing a version of Forge, comprising:

 - `ID`: The version number, i.e. `14.23.1.2555`
 - `build`: The build number
 - `minecraftVersionID`: The supported version of Minecraft
 - `branch`: Usually `null` ─ the branch on which this version was released
 - `releasedAt`: A `Date` object representing the time this version was relesed
 - `downloads`: An array of objects, each representing a build artefact for this version. Each object contains:
   - `ID`: A unique identifier for this build, comprising the version `ID`, and the download `name`
   - `name`: The type of build artefact, i.e. `universal`, `installer` or `mdk`
   - `path`: The filename of the build artefact
   - `sha1`: A SHA1 hash of the build artefact
   - `url`: The remote URL from which the artefact can be downloaded
 - `latest`: If true, this is the latest _unstable_ available build
 - `recommended`: If true, this is the latest _recommended_ available build

The versions are in descending order of released date (`releasedAt`).

#### `getForgeVersionsByID` _(async)_

Finds a version of Forge by its ID.

##### Parameters

 - `ID`: The version ID to fetch details for

##### Return value

Returns an element of the array returned by [`getForgeVersions`](#getforgeversions-async), or `null` if the supplied `ID` does not match any versions.

#### `getForgeVersionsForMinecraftVersion` _(async)_

Finds all versions of Forge that are compatible with the supplied Minecraft version.

##### Parameters

 - `versionID`: The Minecraft version ID

##### Return value

Returns a subset of the array returned by [`getForgeVersions`](#getforgeversions-async), or an empty array if no compatible versions exist.

### Installing Forge

#### `installForge` _(async)_

Installs (or updates) Forge to a Bauxite-managed Minecraft instance.

##### Parameters

 - `directory`: The directory of the Minecraft instance to install Forge to
 - `forgeVersionID`: The version ID of Forge to install

##### Return value

Returns an object identical to that of `getInstance` from `launcher-api`, with
the addition of a `forgeVersionID` field. For example:

```js
{
  "ID": "twitchy-creeper-23",
  "directory": "/home/<user>/.bauxite/instances/twitchy-creeper-23",
  "versionID": "1.12.2",
  "forgeVersionID": "14.23.1.2555"
}
```

### Launching Forge

Launching Forge instances is handled by `startInstance` in `launcher-api` ─ only
the method for generating launch arguments is augmented to allow this.

#### `generateForgeLaunchArguments` _(async)_

An override for `generateLaunchArguments`, automatically called when launching
Forge-enabled instances.

##### Parameters

Accepts a single parameter of an object with the 3 following fields:

 - `instance`: An object representing the instance to launch, as returned by `getInstance` from `launcher-api`.
 - `profile`: An object representing the user profile to launch with, as returned by the `getProfile` methods from `launcher-api`.
 - `version`: An object representing the version manifest of the instance, as returned by `getVersionManifest` from `launcher-api`.

##### Return value

An array of command-line arguments to pass to the Java executable installed on the system, such that the Forge instance will be launched.
