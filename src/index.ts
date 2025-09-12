import { Options } from 'k6/options';
import { check } from 'k6';
import { Vault } from './vault';
import { createFakeData, SetupData } from './setup';
import config from './config';
import { Artesca } from './artesca';
import faker from 'k6/x/faker';

export const options: Options = {
  insecureSkipTLSVerify: true,
  scenarios: {
    authV4: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '1m', target: 10 },
        { duration: '2m', target: 200 },
        { duration: '1m', target: 200 },
        { duration: '30s', target: 500 },
        { duration: '30s', target: 750 },
        { duration: '1m', target: 100 },
      ],
      exec: 'authV4',
    },
    assumeRole: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '1m', target: 10 },
        { duration: '4m', target: 100 },
        { duration: '2m', target: 200 },
      ],
      exec: 'assumeRole',
    },
  },
};

export async function setup(): Promise<SetupData> {
  if (config.skipSetup) {
    console.info('Skipping setup');
    return {} as SetupData;
  }

  const client = config.artescaAdmin.endpoint
    ? new Artesca(
        config.artescaAdmin.endpoint,
        config.artescaAdmin.uuid,
        config.artescaAdmin.username,
        config.artescaAdmin.password,
      )
    : new Vault(
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

export async function authV4(data: SetupData) {
  if (config.skipSetup) {
    // let vaultAsUser = new Vault(config.region, 'BJ8Q0L35PRJ92ABA2K0B', 'kTgcfEaLjxvrLN5EKVcTnb4Ac046FU1m=33/baf1', 'http://localhost:8500');
    let vaultAsUser = new Vault(config.region, 'ZVYNZS4SFX7OI8SD6A8I', 'LpDAnLXLgs+Jmykqn5ivSilprHn6BV9nS/VyHKte', 'https://vault2-s3.edouard-comtet-personal-lab.com');
    const res = await vaultAsUser.authV4();
    check(res, { 'is status 200': (r) => r.status === 200 });

    return;
  }

  // TODO Random that !
  const account = data.accounts[0];
  const user = data.accountsUsers[account.id][0];
  const key = data.usersKeys[user.id];

  let vaultAsUser = new Vault(config.region, key.id, key.value, config.vault.endpoint_s3);
  const res = await vaultAsUser.authV4();
  check(res, { 'is status 200': (r) => r.status === 200 });
};

export async function assumeRole(data: SetupData) {
  if (config.skipSetup) {
    // vaultAsUser = new Vault(config.region, 'RM4F8XSXLHJWRPQWZX1B', 'Ebzk9E+VjbH2UcizKfrNWo+b8YfjvmGvH/CDbZ1b', 'http://localhost:8800');
    const vaultAsUser = new Vault(config.region, 'ZVYNZS4SFX7OI8SD6A8I', 'LpDAnLXLgs+Jmykqn5ivSilprHn6BV9nS/VyHKte', 'https://sts.edouard-comtet-personal-lab.com');
    const { res } = await vaultAsUser.assumeRole({
      id: 'FAKE',
      arn: 'arn:aws:iam::336769822032:role/house',
      name: 'FAKE',
      createDate: 'FAKE',
    }, faker.company.company());
    check(res, { 'is status 200': (r) => r.status === 200 });

    return;
  }

  // TODO Random that !
  const account = data.accounts[0];
  const user = data.accountsUsers[account.id][0];
  const role = data.accountsRoles[account.id][0];
  const key = data.usersKeys[user.id];

  const vaultAsUser = new Vault(config.region, key.id, key.value, config.vault.endpoint_sts);
  const { res } = await vaultAsUser.assumeRole(role, faker.company.company());
  check(res, { 'is status 200': (r) => r.status === 200 });
};
