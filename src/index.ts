import { Options } from 'k6/options';
import { check } from 'k6';
import { Vault } from './vault';
import { createFakeData, SetupData } from './setup';
import config from './config';
import { Artesca } from './artesca';
import faker from 'k6/x/faker';

export const options: Options = {
  iterations: 1,
  vus: 1,
  insecureSkipTLSVerify: true,
};

export async function setup(): Promise<SetupData> {
  const client = config.artescaAdmin.endpoint
    ? new Artesca(
        config.artescaAdmin.endpoint,
        config.artescaAdmin.uuid,
        config.artescaAdmin.username,
        config.artescaAdmin.password,
      )
    : new Vault(
        'iam',
        config.region,
        config.vaultAdmin.accessKey,
        config.vaultAdmin.secretKey,
        config.vaultAdmin.endpoint,
      );

  const data = await createFakeData(
    client,
    config.numberOfAccounts,
    config.numberOfPoliciesPerAccount,
    config.numberOfGroupsPerAccount,
    config.numberOfUsersPerAccount,
    config.numberOfRolesPerAccount,
  );

  return data;
}

export default async (data: SetupData) => {
  const account = data.accounts[0];
  const key = data.accountsKey[account.id];

  console.info({ key });

  const vaultAsUser = new Vault('iam', config.region, key.id, key.value, config.vault.endpoint);
  const { res: resCreateUser, user } = await vaultAsUser.createUser(faker.person.name());
  check(resCreateUser, { 'is status 201': (r) => r.status === 201 });

  console.info({ user });
};
