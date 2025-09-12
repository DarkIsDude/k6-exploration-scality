# Performance Tests with k6 for Vault

This project provides performance and load testing scripts for Scality services using [k6](https://k6.io/), written in TypeScript.

## Features

- Automated setup of test data (accounts, users, roles, etc.)
- Supports both Vault and Artesca backends
- Uses [xk6-faker](https://github.com/szkiba/xk6-faker) for generating fake data
- TypeScript-first development with Webpack bundling
- Easily configurable via `src/config.ts`

## Prerequisites

- [Node.js](https://nodejs.org/)
- [Yarn](https://yarnpkg.com/)
- [k6](https://k6.io/)

## Getting Started

1. **Install dependencies:**

   ```sh
   yarn install
   ```

2. **Build the project:**

   ```sh
   yarn bundle
   ```

3. **Configure your test parameters:**

   Edit `src/config.ts` to set endpoints, credentials, and test data sizes.

4. **Run the tests:**

   ```sh
   yarn test
   ```

   This will execute the bundled script with k6.

## Scripts

- `yarn bundle` – Build the TypeScript code into `dist/index.js`
- `yarn test` – Run the k6 test using the bundled script
- `yarn lint` – Run Prettier and ESLint

## Configuration

### External lab

To run tests against an external lab, set the following environment variables:

```sh
export NUMBER_OF_ACCOUNTS=1
export NUMBER_OF_USERS_PER_ACCOUNT=1
export NUMBER_OF_ROLES_PER_ACCOUNT=1
export NUMBER_OF_GROUPS_PER_ACCOUNT=1
export NUMBER_OF_POLICIES_PER_ACCOUNT=1

export VAULT_ENDPOINT_IAM=https://iam.edouard-comtet-personal-lab.com
export VAULT_ENDPOINT_STS=https://sts.edouard-comtet-personal-lab.com

export ARTESCA_ADMIN_ENDPOINT=https://10.160.104.161:8443
export ARTESCA_ADMIN_UUID=6365c27f-92a2-4968-a72d-e428717217c4
export ARTESCA_ADMIN_USERNAME=edouard-comtet
export ARTESCA_ADMIN_PASSWORD=edouard-comtet
```

### Local lab with vault

To run tests against a local Vault instance, set the following environment variables:

```sh
export NUMBER_OF_ACCOUNTS=1
export NUMBER_OF_USERS_PER_ACCOUNT=1
export NUMBER_OF_ROLES_PER_ACCOUNT=1
export NUMBER_OF_GROUPS_PER_ACCOUNT=1
export NUMBER_OF_POLICIES_PER_ACCOUNT=1

export VAULT_ENDPOINT_IAM=http://localhost:8600
export VAULT_ENDPOINT_STS=http://localhost:8800

export VAULT_ADMIN_ENDPOINT=http://localhost:8600/
export VAULT_ADMIN_ACCESS_KEY=1DWA6EDIOWZQAAKZRAF3
export VAULT_ADMIN_SECRET_KEY=A45FWQY6ES27GV20XBZ5CDQGXHHCLPK8CBSLSWT0
```
