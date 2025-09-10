import { check } from 'k6';
import { Account, Vault } from './vault';
import faker from 'k6/x/faker';

export type SetupData = {
  accounts: Account[];
};

export async function createFakeData(
  vault: Vault,
  numberOfAccounts?: number,
  numberOfPoliciesPerAccount?: number,
  numberOfGroupsPerAccount?: number,
  numberOfUsersPerAccount?: number,
  numberOfRolesPerAccount?: number,
) {
  console.info(`Number of accounts: ${numberOfAccounts}`);
  console.info(`Number of policies per account: ${numberOfPoliciesPerAccount}`);
  console.info(`Number of groups per account: ${numberOfGroupsPerAccount}`);
  console.info(`Number of users per account: ${numberOfUsersPerAccount}`);
  console.info(`Number of roles per account: ${numberOfRolesPerAccount}`);

  const accounts: Account[] = [];
  for (let i = 0; i < (numberOfAccounts || 1); i++) {
    const { res, account } = await vault.createAccount(faker.person.name(), faker.person.email());
    check(res, { 'is status 201': (r) => r.status === 201 });
    accounts.push(account!);

    console.info(`Account ${i + 1}/${numberOfAccounts} created: ${account?.id} - ${account?.name}`);
  }

  return { accounts };
}
