import { check } from 'k6';
import { Vault } from './vault';
import faker from 'k6/x/faker';
import { Account, AccountAccessKey } from './type';
import { Artesca } from './artesca';

export type SetupData = {
  accounts: Account[];
  accountsKey: { [accountId: string]: AccountAccessKey };
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
  };

  console.info(`Number of accounts: ${numberOfAccounts}`);
  console.info(`Number of policies per account: ${numberOfPoliciesPerAccount}`);
  console.info(`Number of groups per account: ${numberOfGroupsPerAccount}`);
  console.info(`Number of users per account: ${numberOfUsersPerAccount}`);
  console.info(`Number of roles per account: ${numberOfRolesPerAccount}`);

  const { accounts, keys } = await createAccounts(client, numberOfAccounts);
  data.accounts = accounts;
  data.accountsKey = keys;

  // TODO Create the groups

  // TODO Create the roles

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
