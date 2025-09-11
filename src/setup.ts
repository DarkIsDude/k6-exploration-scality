import { check } from 'k6';
import { Vault } from './vault';
import faker from 'k6/x/faker';
import { Account, AccountAccessKey, Group, Policy } from './type';
import { Artesca } from './artesca';
import config from './config';

import AdministratorPolicy from './policies/Administrator.json';
import ReadOnlyS3Policy from './policies/ReadOnlyS3.json';
import AdminitratorS3Policy from './policies/AdministratorS3.json';
import ListAllMyBucketsPolicy from './policies/ListAllMyBuckets.json';
import AssumeRolePolicy from './policies/AssumeRole.json';

const POLICIES = {
  AdministratorPolicy,
  ReadOnlyS3Policy,
  AdminitratorS3Policy,
  ListAllMyBucketsPolicy,
  AssumeRolePolicy,
};

export type SetupData = {
  accounts: Account[];
  accountsKey: { [accountId: string]: AccountAccessKey };
  accountsGroups?: { [accountId: string]: Group[] };
  accountsRoles?: { [accountId: string]: Group[] };
  accountsUsers?: { [accountId: string]: Group[] };
  accountsPolicies?: { [accountId: string]: Group[] };
};

export async function createFakeData(
  client: Vault | Artesca,
  numberOfAccounts: number,
  numberOfPoliciesPerAccount: number,
  numberOfGroupsPerAccount: number,
  numberOfUsersPerAccount: number,
  numberOfRolesPerAccount: number,
) {
  const data: SetupData = {
    accounts: [],
    accountsKey: {},
    accountsGroups: {},
    accountsRoles: {},
    accountsUsers: {},
    accountsPolicies: {},
  };

  console.info(`Number of accounts: ${numberOfAccounts}`);
  console.info(`Number of policies per account: ${numberOfPoliciesPerAccount}`);
  console.info(`Number of groups per account: ${numberOfGroupsPerAccount}`);
  console.info(`Number of users per account: ${numberOfUsersPerAccount}`);
  console.info(`Number of roles per account: ${numberOfRolesPerAccount}`);

  const { accounts, keys } = await createAccounts(client, numberOfAccounts);
  data.accounts = accounts;
  data.accountsKey = keys;

  for (const account of accounts) {
    console.info(`Creating data for account ${account.id} - ${account.name}`);
    const key = keys[account.id];

    const groups = await createGroups(key, numberOfGroupsPerAccount);
    console.info(`Created ${groups.length} groups for account ${account.id}`);
    data.accountsGroups![account.id] = groups;

    const roles = await createRoles(key, numberOfRolesPerAccount);
    console.info(`Created ${roles.length} roles for account ${account.id}`);
    data.accountsRoles![account.id] = roles;

    const users = await createUsers(key, numberOfUsersPerAccount);
    console.info(`Created ${users.length} users for account ${account.id}`);
    data.accountsUsers![account.id] = users;

    const { basePolicies, policies } = await createPolicies(key, numberOfPoliciesPerAccount);
    console.info(`Created ${policies.length} policies for account ${account.id}`);
    console.info(`Base policies for account ${account.id}: ${Object.keys(basePolicies).join(', ')}`);
    data.accountsPolicies![account.id] = policies;
  }

  // TODO Create the users (assign roles and groups randomly)
  // TODO Create the policies (assign to groups, roles, users randomly)

  return data;
}

async function createAccounts(client: Vault | Artesca, numberOfAccounts: number) {
  const accounts: Account[] = [];
  const keys: { [accountId: string]: AccountAccessKey } = {};

  for (let i = 0; i < (numberOfAccounts || 1); i++) {
    const { res: resCreation, account } = await client.createAccount(faker.person.name(), faker.person.email());
    check(resCreation, { 'is status 201': (r) => r.status === 201 });
    accounts.push(account!);
    console.info(`Account ${i + 1}/${numberOfAccounts} created: ${account?.id} - ${account?.name}`);

    const { res: resKey, key } = await client.generateAsscessKeyForAccount(account!);
    check(resKey, { 'is status 201': (r) => r.status === 201 });
    keys[account!.id] = key!;
    console.info(`Access key for account ${account?.id} created: ${key?.id}`);
  }

  return { accounts, keys };
}

async function createGroups(key: AccountAccessKey, numberOfGroups: number) {
  const client = new Vault('iam', config.region, key.id, key.value, config.vault.endpoint);
  const groups: Group[] = [];

  for (let i = 0; i < (numberOfGroups || 1); i++) {
    const { res, group } = await client.createGroup(faker.word.noun());
    check(res, { 'is status 201': (r) => r.status === 201 });
    groups.push(group!);
    console.info(`Group ${i + 1}/${numberOfGroups} created: ${group?.id} - ${group?.name}`);
  }

  return groups;
}

async function createRoles(key: AccountAccessKey, numberOfRoles: number) {
  const client = new Vault('iam', config.region, key.id, key.value, config.vault.endpoint);
  const roles = [];

  for (let i = 0; i < (numberOfRoles || 1); i++) {
    const { res, role } = await client.createRole(faker.word.noun());
    check(res, { 'is status 201': (r) => r.status === 201 });
    roles.push(role!);
    console.info(`Role ${i + 1}/${numberOfRoles} created: ${role?.id} - ${role?.name}`);
  }

  return roles;
}

async function createUsers(key: AccountAccessKey, numberOfRoles: number) {
  const client = new Vault('iam', config.region, key.id, key.value, config.vault.endpoint);
  const users = [];

  for (let i = 0; i < (numberOfRoles || 1); i++) {
    const { res, user } = await client.createUser(faker.person.name());
    check(res, { 'is status 201': (r) => r.status === 201 });
    users.push(user!);
    console.info(`User ${i + 1}/${numberOfRoles} created: ${user?.id} - ${user?.name}`);
  }

  return users;
}

async function createPolicies(key: AccountAccessKey, numberOfPolicies: number) {
  const client = new Vault('iam', config.region, key.id, key.value, config.vault.endpoint);
  const basePolicies: { [policyName: string]: Policy } = {};
  const policies: Policy[] = [];

  for (const policyName in POLICIES) {
    const policyDocument = POLICIES[policyName as keyof typeof POLICIES];
    const { res, policy } = await client.createPolicy(policyName, JSON.stringify(policyDocument));
    check(res, { 'is status 200': (r) => r.status === 200 });
    basePolicies[policyName] = policy;
    console.info(`Policy ${policyName} created: ${policy?.id} - ${policy?.name}`);
  }

  for (let i = 0; i < (numberOfPolicies || 1); i++) {
    const policyDocumentIndex = faker.numbers.intRange(0, Object.keys(POLICIES).length - 1);
    const policyDocument = Object.values(POLICIES)[policyDocumentIndex];
    const { res, policy } = await client.createPolicy(faker.word.noun(), JSON.stringify(policyDocument));
    check(res, { 'is status 200': (r) => r.status === 200 });
    policies.push(policy!);
    console.info(`Policy ${i + 1}/${numberOfPolicies} created: ${policy?.id} - ${policy?.name}`);
  }

  return { basePolicies, policies };
}
