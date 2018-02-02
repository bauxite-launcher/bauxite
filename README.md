# Bauxite

> Minecraft client/server ecosystem

## Repositories

| Name                                                  | Description                                                   |
|:------------------------------------------------------|:--------------------------------------------------------------|
| [launcher-api](./packages/launcher-api)               | Installs/launches Minecraft client instances locally          |
| [launcher-api-forge](./packages/launcher-api)         | Installs/launches Minecraft Forge client instances locally    |
| [minecraft-auth](./packages/minecraft-auth)           | Authentication layer for Mojang API                           |
| [minecraft-assets](./packages/minecraft-assets)       | Assets API layer for Minecraft                                |
| [minecraft-installer](./packages/minecraft-installer) | Utilities for installing and upgrading minecraft              |
| [launcher-cli](./packages/launcher-cli)               | Command-line for managing/launching local Minecraft instances |
| [launcher-graphql](./packages/launcher-graphql)       | GraphQL interface to launcher-api                             |

## High-level Roadmap

* [x] Local client CLI launcher
  * [x] Forge integration
  * [ ] CurseForge integration
  * [ ] Remote server management in local client
* [ ] Local server CLI launcher
  * [ ] Forge integration
  * [ ] CurseForge integration
