import http from 'k6/http';
import { Endpoint } from '../jslib-aws/endpoint';
import { SignatureV4 } from '../jslib-aws/signature';
import { parseHTML } from 'k6/html';
import { CreateAccountResponse, GenerateAccountAccessKeyResponse, ListAccountsResponse } from './type';
import { Account, User } from '../type';

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

  public async createAccount(name: string, emailAddress: string) {
    const signedRequest = this.signer.sign({
      method: 'POST',
      endpoint: this.endpoint,
      path: '/',
      query: undefined,
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

  public async createUser(userName: string) {
    const signedRequest = this.signer.sign({
      method: 'POST',
      endpoint: this.endpoint,
      path: '/',
      query: undefined,
      body: JSON.stringify({
        Action: 'CreateUser',
        Version: '2010-05-08',
        UserName: userName,
        Path: '/',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const res = http.post(signedRequest.url, signedRequest.body, { headers: signedRequest.headers });
    const xml = parseHTML(res.body as string);
    const userNode = xml.find('CreateUserResult').find('User');

    const user: User = {
      id: userNode.find('UserId').text(),
      arn: userNode.find('Arn').text(),
      createDate: userNode.find('CreateDate').text(),
      name: userNode.find('UserName').text(),
    };

    console.info({ res });

    return { res, user };
  }

  public async createGroup() {
    // TODO
    //     #### Create group
    // Create a new group.
    // ##### Method and path
    // `POST /?Action=CreateGroup`
    // ##### Request parameters
    // | name | description | type | default | value |
    // -------|:------------|:-----|:--------|:------|
    // | Action | Action to execute | string || 'CreateGroup' |
    // | Version | Protocol version | string || '2010-05-08' |
    // | GroupName | Name of group | string ||
    // | Path | Path of group | string | '/' |
    // see http://docs.aws.amazon.com/IAM/latest/APIReference/API_CreateGroup.html
  }

  public async createRole() {
    // TODO
    // Create a role.
    // ##### Method and path
    // `POST /?Action=CreateRole`
    // ##### Request parameters
    // | name | description | type | default | value |
    // -------|:------------|:-----|:--------|:------|
    // | Action | Action to execute | string || 'CreateRole' |
    // | Version | Protocol version | string || '2010-05-08' |
    // | AssumeRolePolicyDocument | Trust policy defining the role | stringified json ||
    // | Path | Path of the role | string | '/' |
    // | RoleName | Role name | string ||
  }

  public async createPolicy() {
    // TODO
  }

  public async assignUserToGroup() {
    // TODO
    // #### Add user to group
    // Add a user into a group.
    // ##### Method and path
    // `POST /?Action=AddUserToGroup`
    // ##### Request parameters
    // | name | description | type | default | value |
    // -------|:------------|:-----|:--------|:------|
    // | Action | Action to execute | string || 'AddUserToGroup' |
    // | Version | Protocol version | string || '2010-05-08' |
    // | GroupName | Name of group | string ||
    // | UserName | Name of user | string ||
    // see http://docs.aws.amazon.com/IAM/latest/APIReference/API_AddUserToGroup.html
  }

  public async attachRolePolicy() {
    // TODO
    // #### Attach role policy
    // Attach a managed policy to the role.
    // ##### Method and path
    // `POST /?Action=AttachRolePolicy`
    // ##### Request parameters
    // | name | description | type | default | value |
    // -------|:------------|:-----|:--------|:------|
    // | Action | Action to execute | string || 'AttachRolePolicy' |
    // | Version | Protocol version | string || '2010-05-08' |
    // | PolicyArn | Arn of the managed policy | string ||
    // | RoleName | Name of the role | string ||
    // See http://docs.aws.amazon.com/IAM/latest/APIReference/API_AttachRolePolicy.html
    // ##### Success code
    // | code | message |
    // -------|:--------|
    // | 200 | OK |
  }

  public async attachUserPolicy() {
    // TODO
  }

  public async attachGroupPolicy() {
    // TODO
  }

  public async generateAsscessKeyForAccount(account: Account) {
    const signedRequest = this.signer.sign({
      method: 'POST',
      endpoint: this.endpoint,
      path: '/',
      query: undefined,
      body: JSON.stringify({
        Action: 'GenerateAccountAccessKey',
        Version: '2010-05-08',
        AccountName: account.name,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const res = http.post(signedRequest.url, signedRequest.body, { headers: signedRequest.headers });

    const body = res.json() as GenerateAccountAccessKeyResponse | undefined;
    return { res, key: body?.data };
  }

  public async createAccessKeyForUser() {
    // TODO
    // `POST /?Action=GenerateAccountAccessKey`
    // ##### Request parameters
    // | name | description | type | default | value |
    // -------|:------------|:-----|:--------|:------|
    // | Action | Action to execute | string || 'GenerateAccountAccessKey' |
    // | Version | Protocol version | string || '2010-05-08' |
    // | AccountName | Name of account | string |
    // | externalAccessKey | User spplied access key | string |
    // | externalSecretKey | User supplied secret key | string |
    // Note: Request parameters `externalAccessKey` and `externalSecretKey` are
    // independent of each other. Any one or both can be supplied. If only one is
    // supplied the other will be generated.
    // ##### Output format
    // ```js
    // {
    //   "id": "string", // access key set by the user
    //   "value": "string", // secret key set by the user
    //   "createDate": "string", // key creation date
    //   "lastUsedDate": "string", // key last used date
    //   "status": "string", // status of the key
    //   "userId": "string" // account identifier
    // }
  }

  public async authV4() {
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const amzDateShort = amzDate.slice(0, 8);

    const signedRequest = this.signer.sign(
      {
        method: 'POST',
        endpoint: this.endpoint,
        path: '/',
        query: undefined,
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

  public async evalPolicy() {
    // TODO
    // const data = {
    //     Action: 'CheckPolicies',
    //     requestContextParams,
    //     userArn,
    // };
    //     generalResource: 'policybucket',
    // specificResource: 'obj',
    // requesterIp: '',
    // sslEnabled: '',
    // apiMethod: 'objectDelete',
    // awsService: 's3',
  }

  public async assumeRole() {
    // TODO
  }

  public async assumeRoleWithWebIdentity() {
    // TODO
  }

  public async getRolesForWebIdentity() {
    // TODO
    // const data = {
    //     Action: 'GetRolesForWebIdentity',
    //     WebIdentityToken: webIdentityToken,
    // };
  }

  public async listAccounts() {
    const signedRequest = this.signer.sign({
      method: 'POST',
      endpoint: this.endpoint,
      path: '/',
      query: undefined,
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
}
export { Account };
