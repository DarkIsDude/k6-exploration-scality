export default {
  region: 'us-east-1',
  skipSetup: true,
  vaultAdmin: {
    endpoint: __ENV.VAULT_ADMIN_ENDPOINT || '',
    accessKey: __ENV.VAULT_ADMIN_ACCESS_KEY || '',
    secretKey: __ENV.VAULT_ADMIN_SECRET_KEY || '',
  },
  artescaAdmin: {
    endpoint: __ENV.ARTESCA_ADMIN_ENDPOINT || '',
    uuid: __ENV.ARTESCA_ADMIN_UUID || '',
    username: __ENV.ARTESCA_ADMIN_USERNAME || '',
    password: __ENV.ARTESCA_ADMIN_PASSWORD || '',
  },
  vault: {
    endpoint_s3: __ENV.VAULT_ENDPOINT_S3 || '',
    endpoint_iam: __ENV.VAULT_ENDPOINT_IAM || '',
    endpoint_sts: __ENV.VAULT_ENDPOINT_STS || '',
  },
  numberOfAccounts: __ENV.NUMBER_OF_ACCOUNTS ? parseInt(__ENV.NUMBER_OF_ACCOUNTS, 10) : 1,
  numberOfPoliciesPerAccount: __ENV.NUMBER_OF_POLICIES_PER_ACCOUNT
    ? parseInt(__ENV.NUMBER_OF_POLICIES_PER_ACCOUNT, 10)
    : 1,
  numberOfGroupsPerAccount: __ENV.NUMBER_OF_GROUPS_PER_ACCOUNT ? parseInt(__ENV.NUMBER_OF_GROUPS_PER_ACCOUNT, 10) : 1,
  numberOfUsersPerAccount: __ENV.NUMBER_OF_USERS_PER_ACCOUNT ? parseInt(__ENV.NUMBER_OF_USERS_PER_ACCOUNT, 10) : 1,
  numberOfRolesPerAccount: __ENV.NUMBER_OF_ROLES_PER_ACCOUNT ? parseInt(__ENV.NUMBER_OF_ROLES_PER_ACCOUNT, 10) : 1,
};
