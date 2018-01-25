> Provides a GraphQL layer to [`launcher-api`](../launcher-api)

# Installation

As a globally available binary.

Via yarn:

```bash
[sudo] yarn global add @bauxite/launcher-graphql
```

or via npm:

```bash
[sudo] npm install --global @bauxite/launcher-graphql
```

# Usage

From your terminal:

```bash
bauxite-gql
```

This will launch a local HTTP server on port 2501, exposing a GraphQL endpoint
at `/api`. It will also launch your default web browser with a GraphiQL user interface to allow you to interact with the underlying API.

To override the default port, pass the `PORT` environment variable when launching:

```bash
PORT=2501 bauxite-gql
```
