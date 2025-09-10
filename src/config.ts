export default {
  region: 'us-east-1',
  asUser: {
    endpoint: __ENV.AS_USER_ENDPOINT || '',
    accessKey: __ENV.AS_USER_ACCESS_KEY || '',
    secretKey: __ENV.AS_USER_SECRET_KEY || '',
  },
  asAdmin: {
    endpoint: __ENV.AS_ADMIN_ENDPOINT || '',
    accessKey: __ENV.AS_ADMIN_ACCESS_KEY || '',
    secretKey: __ENV.AS_ADMIN_SECRET_KEY || '',
  },
  numberOfAccounts: __ENV.NUMBER_OF_ACCOUNTS ? parseInt(__ENV.NUMBER_OF_ACCOUNTS, 10) : 1,
  numberOfPoliciesPerAccount: __ENV.NUMBER_OF_POLICIES_PER_ACCOUNT
    ? parseInt(__ENV.NUMBER_OF_POLICIES_PER_ACCOUNT, 10)
    : 1,
  numberOfGroupsPerAccount: __ENV.NUMBER_OF_GROUPS_PER_ACCOUNT ? parseInt(__ENV.NUMBER_OF_GROUPS_PER_ACCOUNT, 10) : 1,
  numberOfUsersPerAccount: __ENV.NUMBER_OF_USERS_PER_ACCOUNT ? parseInt(__ENV.NUMBER_OF_USERS_PER_ACCOUNT, 10) : 1,
  numberOfRolesPerAccount: __ENV.NUMBER_OF_ROLES_PER_ACCOUNT ? parseInt(__ENV.NUMBER_OF_ROLES_PER_ACCOUNT, 10) : 1,
};
