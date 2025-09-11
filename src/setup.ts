import { check } from 'k6';
import { Vault } from './vault';
import faker from 'k6/x/faker';
import { Account, AccessKey, Group, Policy, User, Role } from './type';
import { Artesca } from './artesca';
import config from './config';
import { randomIntBetween, randomItem } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

import AdministratorPolicy from './policies/Administrator.json';
import ReadOnlyS3Policy from './policies/ReadOnlyS3.json';
import AdministratorS3Policy from './policies/AdministratorS3.json';
import ListAllMyBucketsPolicy from './policies/ListAllMyBuckets.json';
import AssumeRolePolicy from './policies/AssumeRole.json';
import http from 'k6/http';

const BASE_POLICIES = ['AdministratorPolicy', 'ReadOnlyS3Policy', 'AdministratorS3Policy', 'ListAllMyBucketsPolicy', 'AssumeRolePolicy'] as const;
const POLICIES: Record<typeof BASE_POLICIES[number], unknown> = {
  AdministratorPolicy,
  ReadOnlyS3Policy,
  AdministratorS3Policy,
  ListAllMyBucketsPolicy,
  AssumeRolePolicy,
};

const PROBABILITY_TO_ATTACH_POLICY_TO_GROUP = 0.8;
const PROBABILITY_TO_ATTACH_POLICY_TO_ROLE = 0.6;
const PROBABILITY_TO_ATTACH_POLICY_TO_USER = 0.7;
const PROBABILITY_TO_ADD_USER_TO_GROUP = 0.8;

export type SetupData = {
  accounts: Account[];
  accountsKey: { [accountId: string]: AccessKey };
  accountsGroups?: { [accountId: string]: Group[] };
  accountsRoles?: { [accountId: string]: Role[] };
  accountsUsers?: { [accountId: string]: User[] };
  accountsPolicies?: { [accountId: string]: Policy[] };
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
    const client = new Vault('iam', config.region, key.id, key.value, config.vault.endpoint);

    const groups = await createGroups(client, numberOfGroupsPerAccount);
    console.info(`Created ${groups.length} groups for account ${account.id}`);
    data.accountsGroups![account.id] = groups;

    const roles = await createRoles(client, numberOfRolesPerAccount);
    console.info(`Created ${roles.length} roles for account ${account.id}`);
    data.accountsRoles![account.id] = roles;

    const users = await createUsers(client, numberOfUsersPerAccount);
    console.info(`Created ${users.length} users for account ${account.id}`);
    data.accountsUsers![account.id] = users;

    const { basePolicies, policies } = await createPolicies(client, numberOfPoliciesPerAccount);
    console.info(`Created ${policies.length} policies for account ${account.id}`);
    console.info(`Base policies for account ${account.id}: ${Object.keys(basePolicies).join(', ')}`);
    data.accountsPolicies![account.id] = policies;

    for (const user of users) {
      const {res: resAssumeRolePolicy} = await client.attachUserPolicy(user, basePolicies['AssumeRolePolicy']!);
      check(resAssumeRolePolicy, { 'is status 200': (r) => r.status === 200 });

      await linkRandomly(
        PROBABILITY_TO_ADD_USER_TO_GROUP,
        user,
        groups,
        async (user, group) => {
          const { res } = await client.addUserToGroup(group, user);
          console.info(`User ${user.id} added to group ${group.id}`);
          return { res };
        }
      );
    }

    for (const policy of policies) {
      await linkRandomly(
        PROBABILITY_TO_ATTACH_POLICY_TO_GROUP,
        policy,
        groups,
        async (policy, group) => {
          const { res } = await client.attachGroupPolicy(group, policy);
          console.info(`Policy ${policy.id} attached to group ${group.id}`);
          return { res };
        }
      );

      await linkRandomly(
        PROBABILITY_TO_ATTACH_POLICY_TO_ROLE,
        policy,
        roles,
        async (policy, role) => {
          const { res } = await client.attachRolePolicy(role, policy);
          console.info(`Policy ${policy.id} attached to role ${role.id}`);
          return { res };
        }
      );

      await linkRandomly(
        PROBABILITY_TO_ATTACH_POLICY_TO_USER,
        policy,
        users,
        async (policy, user) => {
          const { res } = await client.attachUserPolicy(user, policy);
          console.info(`Policy ${policy.id} attached to user ${user.id}`);
          return { res };
        }
      );
    }
  }

  return data;
}

async function createAccounts(client: Vault | Artesca, numberOfAccounts: number) {
  const accounts: Account[] = [];
  const keys: { [accountId: string]: AccessKey } = {};

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

async function createGroups(client: Vault, numberOfGroups: number) {
  const groups: Group[] = [];

  for (let i = 0; i < (numberOfGroups || 1); i++) {
    const { res, group } = await client.createGroup(faker.word.noun());
    check(res, { 'is status 201': (r) => r.status === 201 });
    groups.push(group!);
    console.info(`Group ${i + 1}/${numberOfGroups} created: ${group?.id} - ${group?.name}`);
  }

  return groups;
}

async function createRoles(client: Vault, numberOfRoles: number) {
  const roles = [];

  for (let i = 0; i < (numberOfRoles || 1); i++) {
    const { res, role } = await client.createRole(faker.word.noun());
    check(res, { 'is status 201': (r) => r.status === 201 });
    roles.push(role!);
    console.info(`Role ${i + 1}/${numberOfRoles} created: ${role?.id} - ${role?.name}`);
  }

  return roles;
}

async function createUsers(client: Vault, numberOfRoles: number) {
  const users = [];

  for (let i = 0; i < (numberOfRoles || 1); i++) {
    const { res, user } = await client.createUser(faker.person.name());
    check(res, { 'is status 201': (r) => r.status === 201 });
    users.push(user!);
    console.info(`User ${i + 1}/${numberOfRoles} created: ${user?.id} - ${user?.name}`);
  }

  return users;
}

async function createPolicies(client: Vault, numberOfPolicies: number) {
  const basePolicies: Partial<Record<typeof BASE_POLICIES[number], Policy>> = {};
  const policies: Policy[] = [];

  for (const policyName of BASE_POLICIES) {
    const policyDocument = POLICIES[policyName];
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

async function linkRandomly<Item, Possibility>(
  probabilityToLink: number,
  item: Item,
  possibilities: Possibility[],
  linkFunction: (item: Item, possibility: Possibility) => Promise<{ res: ReturnType<typeof http.post> }>,
) {
  let probability = randomIntBetween(0, 100) / 100;
  while (probability < probabilityToLink) {
    const itemToLink = randomItem(possibilities);
    const { res } = await linkFunction(item, itemToLink);
    check(res, { 'is status 200': (r) => r.status === 200 });
    probability = randomIntBetween(0, 100) / 100;
  }
}
