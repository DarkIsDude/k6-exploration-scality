import http from 'k6/http';
import { sleep, check } from 'k6';
import { Options } from 'k6/options';
import crypto from 'k6/crypto';

export const options:Options = {
  iterations: 1,
  vus: 1,
};

function computeAWSigV4Signature(
  method: string,
  service: string,
  region: string,
  _endpoint: string,
  _accessKey: string,
  secretKey: string,
  payload: string,
  amzDate: string,
  headers: Record<string, string>
) {
  const canonicalUri = '/';
  const canonicalQuerystring = '';
  const canonicalHeaders = Object.entries(headers)
    .map(([k, v]) => `${k.toLowerCase()}:${v.trim()}\n`)
    .sort()
    .join('');
  const signedHeaders = Object.keys(headers)
    .map(k => k.toLowerCase())
    .sort()
    .join(';');
  const payloadHash = crypto.createHash('sha256');
  payloadHash.update(payload);

  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQuerystring,
    canonicalHeaders,
    signedHeaders,
    payloadHash.digest('hex'),
  ].join('\n');

  // Step 2: Create String to Sign
  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${amzDate.slice(0,8)}/${region}/${service}/aws4_request`;
  const canonicalRequestHash = crypto.createHash('sha256');
  canonicalRequestHash.update(canonicalRequest);
  canonicalRequestHash.update(canonicalRequest);
  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    canonicalRequestHash.digest('hex')
  ].join('\n');

  // Step 3: Calculate the Signature
  function getSignatureKey(key: string, dateStamp: string, regionName: string, serviceName: string) {
    const kDateHmac = crypto.createHMAC('sha256', 'AWS4' + key);
    kDateHmac.update(dateStamp)
    const kDate = kDateHmac.digest('hex');
    console.info(`kDate: ${kDate} / dateStamp: ${dateStamp}`);

    const kRegionHmac = crypto.createHMAC('sha256', kDate);
    kRegionHmac.update(regionName);
    const kRegion = kRegionHmac.digest('hex');
    console.info(`kRegion: ${kRegion} / regionName: ${regionName}`);

    const kServiceHmac = crypto.createHMAC('sha256', kRegion);
    kServiceHmac.update(serviceName);
    const kService = kServiceHmac.digest('hex');
    console.info(`kService: ${kService} / serviceName: ${serviceName}`);

    const kSigningHmac = crypto.createHMAC('sha256', kService);
    kSigningHmac.update('aws4_request');
    const kSigning = kSigningHmac.digest('hex');
    console.info(`kSigning: ${kSigning}`);

    return kSigning;
  }

  const signingKey = getSignatureKey(secretKey, amzDate.slice(0,8), region, service);
  const signatureHmac = crypto.createHMAC('sha256', signingKey);
  signatureHmac.update(stringToSign);
  const signature = signatureHmac.digest('hex');

  return signature;
}

export default() => {
  const method = 'POST';
  const service = 's3';
  const region = 'us-east-1';
  const accessKey = 'BJ8Q0L35PRJ92ABA2K0B';
  const secretKey = 'kTgcfEaLjxvrLN5EKVcTnb4Ac046FU1m=33/baf1';
  const endpoint = `http://localhost:8500/`;
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
  const headers: Record<string, string> = {
    'Host': 'localhost:8500',
    'Content-Type': 'application/json',
    'x-amz-date': amzDate,
  };
  const payload = {
    'Action': 'AuthV4',
    'accessKey': accessKey,
    'stringToSign': 'what ever', 
    'region': region,
    'scopeDate': amzDate.slice(0,8),
  };

  const signature = computeAWSigV4Signature(
    method,
    service,
    region,
    endpoint,
    accessKey,
    secretKey,
    JSON.stringify(payload),
    amzDate,
    headers
  );

  const payloadWithSignature = {
    ...payload,
    signatureFromRequest: signature,
  };

  const res = http.post(endpoint, JSON.stringify(payloadWithSignature), { headers });
  check(res, {
    'status is 200': () => res.status === 200,
  });

  sleep(0.5);
}
