import http from 'k6/http';
import { Options } from 'k6/options';
import { S3Client, AWSConfig } from '../s3';
import { SignatureV4 } from './signature';
import { Endpoint } from './endpoint';
import { check } from 'k6';

export const options:Options = {
  iterations: 1000,
  vus: 10,
};

const service = 's3';
const region = 'us-east-1';
const accessKey = 'BJ8Q0L35PRJ92ABA2K0B';
const secretKey = 'kTgcfEaLjxvrLN5EKVcTnb4Ac046FU1m=33/baf1';
const endpoint_s3 = `http://localhost:8000/`;
const endpoint_vault = `http://localhost:8500/`;
const now = new Date();
const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
const amzDateShort = amzDate.slice(0, 8);
    
export async function basicFromS3() {
  const awsConfig = new AWSConfig({
    region: 'us-east-1',
    accessKeyId: accessKey,
    secretAccessKey: secretKey,
    endpoint: endpoint_s3,
  });

  const s3 = new S3Client(awsConfig);
  const buckets = await s3.listBuckets();
  console.info('Buckets: ', { buckets });
}

export async function manualAuthV4() {
   const signer = new SignatureV4({
    service: service,
    region,
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
    uriEscapePath: false,
    applyChecksum: true,
  });

  const signedRequest = signer.sign(
    {
      method: 'POST',
      endpoint: new Endpoint(endpoint_vault),
      path: '/',
      query: {},
      body: 'signature',
      headers: {},
    },
    {
      signingDate: now,
      signingService: service,
      signingRegion: region,
    },
  );

  const res = http.post(
    signedRequest.url,
    {
      'Action': 'AuthV4',
      'accessKey': accessKey,
      'region': region,
      'scopeDate': amzDateShort,
      signatureFromRequest: signedRequest.signature,
      stringToSign: signedRequest.stringToSign,
    },
    { headers: signedRequest.headers },
  );

  console.info('Response: ', { res });

  check(res, { 'is status 200': (r) => r.status === 200 });
}

export default async() => {
  // await basicFromS3();
  await manualAuthV4();
}
