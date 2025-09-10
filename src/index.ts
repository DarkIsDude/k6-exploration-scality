import { Options } from 'k6/options';
import { check } from 'k6';
import { Vault } from './vault';
import {createFakeData, SetupData} from './setup';
import config from './config';

export const options:Options = {
  iterations: 1,
  vus: 1,
};

const vaultAsAdmin = new Vault('iam', config.region, config.asAdmin.accessKey, config.asAdmin.secretKey, config.asAdmin.endpoint);
const vaultAsUser = new Vault('s3', config.region, config.asUser.accessKey, config.asUser.secretKey, config.asUser.endpoint);

export async function setup(): Promise<SetupData> {
  const data = await createFakeData(vaultAsAdmin, config.numberOfAccounts, config.numberOfPoliciesPerAccount, config.numberOfGroupsPerAccount, config.numberOfUsersPerAccount, config.numberOfRolesPerAccount);

  return data;
}

export default async(data: SetupData) => {
  const resAuthV4 = await vaultAsUser.authV4();
  check(resAuthV4, { 'is status 200': (r) => r.status === 200 });

  const { res: resListAccounts, accounts } = await vaultAsAdmin.listAccounts();
  check(resListAccounts, { 'is status 200': (r) => r.status === 200 });

  check(accounts, {
    'setup data account exists in listAccounts': (accs) => accs.some(a => a.id === data.accounts[0].id),
  });
}
