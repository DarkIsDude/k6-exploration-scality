import { Options } from 'k6/options';
import { check } from 'k6';
import { Vault } from './vault';

export const options:Options = {
  iterations: 1000,
  vus: 10,
};

const service = 's3';
const region = 'us-east-1';
const accessKey = 'BJ8Q0L35PRJ92ABA2K0B';
const secretKey = 'kTgcfEaLjxvrLN5EKVcTnb4Ac046FU1m=33/baf1';
const endpoint = `http://localhost:8500/`;
    
export default async() => {
  const vault = new Vault(service, region, accessKey, secretKey, endpoint);
  const res = await vault.authV4();

  console.info('Response: ', { res });

  check(res, { 'is status 200': (r) => r.status === 200 });
}
