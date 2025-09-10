import { Options } from 'k6/options';
import { check } from 'k6';
import { Vault } from './vault';
import { createFakeData, SetupData } from './setup';
import config from './config';
import { Artesca } from './artesca';

export const options: Options = {
  iterations: 1,
  vus: 1,
  insecureSkipTLSVerify: true,
};

const vaultAsAdmin = new Vault(
  'iam',
  config.region,
  config.asAdmin.accessKey,
  config.asAdmin.secretKey,
  config.asAdmin.endpoint,
);
const asArtesca = config.asArtesca.endpoint
  ? new Artesca(config.asArtesca.endpoint, config.asArtesca.uuid, config.asArtesca.username, config.asArtesca.password)
  : undefined;

export async function setup(): Promise<SetupData> {
  const data = await createFakeData(
    asArtesca ?? vaultAsAdmin,
    config.numberOfAccounts,
    config.numberOfPoliciesPerAccount,
    config.numberOfGroupsPerAccount,
    config.numberOfUsersPerAccount,
    config.numberOfRolesPerAccount,
  );

  return data;
}

export default async (data: SetupData) => {
  const vaultAsUser = new Vault(
    's3',
    config.region,
    config.asUser.accessKey,
    config.asUser.secretKey,
    config.asUser.endpoint,
  );
  const resAuthV4 = await vaultAsUser.authV4();
  check(resAuthV4, { 'is status 200': (r) => r.status === 200 });

  const { res: resListAccounts, accounts } = await vaultAsAdmin.listAccounts();
  check(resListAccounts, { 'is status 200': (r) => r.status === 200 });

  check(accounts, {
    'setup data account exists in listAccounts': (accs) => accs.some((a) => a.id === data.accounts[0].id),
  });
};
