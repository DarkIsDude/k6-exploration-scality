import http from 'k6/http';
import { Endpoint } from '../jslib-aws/endpoint';
import { SignatureV4 } from '../jslib-aws/signature';
import { CreateAccountResponse, ListAccountsResponse } from './type';

export { Account } from './type';

export class Vault {
  private signer: SignatureV4;
  private endpoint: Endpoint;
  private region: string;
  private service: string;
  private accessKey: string;

  constructor(service: string, region: string, accessKey: string, secretKey: string, endpointURL: string) {
    this.endpoint = new Endpoint(endpointURL);
    this.region = region;
    this.service = service;
    this.accessKey = accessKey;

    this.signer = new SignatureV4({
      service: this.service,
      region: this.region,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
      uriEscapePath: false,
      applyChecksum: true,
    });
  }

  public async authV4() {
    const { now, amzDateShort } = this.generateDate();

    const signedRequest = this.signer.sign(
      {
        method: 'POST',
        endpoint: this.endpoint,
        path: '/',
        query: {},
        body: 'signature',
        headers: {},
      },
      {
        signingDate: now,
      },
    );

    return http.post(
      signedRequest.url,
      {
        Action: 'AuthV4',
        accessKey: this.accessKey,
        region: this.region,
        scopeDate: amzDateShort,
        signatureFromRequest: signedRequest.signature,
        stringToSign: signedRequest.stringToSign,
      },
      { headers: signedRequest.headers },
    );
  }

  public async createAccount(name: string, emailAddress: string) {
    const signedRequest = this.signer.sign({
      method: 'POST',
      endpoint: this.endpoint,
      path: '/',
      query: {},
      body: JSON.stringify({
        Action: 'CreateAccount',
        Version: '2010-05-08',
        name,
        emailAddress,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const res = http.post(signedRequest.url, signedRequest.body, { headers: signedRequest.headers });

    const body = res.json() as CreateAccountResponse | undefined;
    return { res, account: body?.account.data };
  }

  public async listAccounts() {
    const signedRequest = this.signer.sign({
      method: 'POST',
      endpoint: this.endpoint,
      path: '/',
      query: {},
      body: JSON.stringify({
        Action: 'ListAccounts',
        Version: '2010-05-08',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const res = http.post(signedRequest.url, signedRequest.body, { headers: signedRequest.headers });

    const body = res.json() as ListAccountsResponse | undefined;
    return { res, accounts: body?.accounts || [] };
  }

  private generateDate() {
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const amzDateShort = amzDate.slice(0, 8);
    return { now, amzDate, amzDateShort };
  }
}
