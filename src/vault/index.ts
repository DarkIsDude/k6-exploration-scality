import http from 'k6/http';
import { Endpoint } from '../jslib-aws/endpoint';
import { SignatureV4 } from '../jslib-aws/signature';
import { parseHTML } from 'k6/html';
import { VaultCreateAccountResponse, VaultGenerateAccountAccessKeyResponse } from './type';
import { Account, AccessKey, Group, Policy, Role, User } from '../type';

const S3_SERVICE = 's3';
const STS_SERVICE = 'sts';
const IAM_SERVICE = 'iam';

export class Vault {
  private signer: SignatureV4;
  private endpoint: Endpoint;
  private region: string;
  private accessKey: string;

  constructor(region: string, accessKey: string, secretKey: string, endpointURL: string) {
    this.endpoint = new Endpoint(endpointURL);
    this.region = region;
    this.accessKey = accessKey;

    this.signer = new SignatureV4({
      service: IAM_SERVICE,
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

    const body = res.json() as VaultCreateAccountResponse | undefined;
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

    return { res, user };
  }

  public async createGroup(groupName: string) {
    const signedRequest = this.signer.sign({
      method: 'POST',
      endpoint: this.endpoint,
      path: '/',
      query: undefined,
      body: JSON.stringify({
        Action: 'CreateGroup',
        Version: '2010-05-08',
        GroupName: groupName,
        Path: '/',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const res = http.post(signedRequest.url, signedRequest.body, { headers: signedRequest.headers });
    const xml = parseHTML(res.body as string);
    const groupNode = xml.find('CreateGroupResult').find('Group');

    const group: Group = {
      id: groupNode.find('GroupId').text(),
      arn: groupNode.find('Arn').text(),
      name: groupNode.find('GroupName').text(),
    };

    return { res, group };
  }

  public async createRole(roleName: string) {
    const signedRequest = this.signer.sign({
      method: 'POST',
      endpoint: this.endpoint,
      path: '/',
      query: undefined,
      body: JSON.stringify({
        Action: 'CreateRole',
        Version: '2010-05-08',
        RoleName: roleName,
        AssumeRolePolicyDocument: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: 'sts:AssumeRole',
              Principal: '*',
            },
          ],
        }),
        Path: '/',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const res = http.post(signedRequest.url, signedRequest.body, { headers: signedRequest.headers });
    const xml = parseHTML(res.body as string);
    const roleNode = xml.find('CreateRoleResult').find('Role');

    const role: Role = {
      id: roleNode.find('RoleId').text(),
      arn: roleNode.find('Arn').text(),
      name: roleNode.find('RoleName').text(),
      createDate: roleNode.find('CreateDate').text(),
    };

    return { res, role };
  }

  public async createPolicy(policyName: string, policyDocument: string) {
    const signedRequest = this.signer.sign({
      method: 'POST',
      endpoint: this.endpoint,
      path: '/',
      query: undefined,
      body: JSON.stringify({
        Action: 'CreatePolicy',
        Version: '2010-05-08',
        PolicyName: policyName,
        PolicyDocument: policyDocument,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const res = http.post(signedRequest.url, signedRequest.body, { headers: signedRequest.headers });
    const xml = parseHTML(res.body as string);
    const policyNode = xml.find('CreatePolicyResult').find('Policy');

    const policy: Policy = {
      id: policyNode.find('PolicyId').text(),
      arn: policyNode.find('Arn').text(),
      name: policyNode.find('PolicyName').text(),
    };

    return { res, policy };
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

    const body = res.json() as VaultGenerateAccountAccessKeyResponse | undefined;
    return { res, key: body?.data };
  }

  public async createAccessKeyForUser(user: User) {
    const signedRequest = this.signer.sign({
      method: 'POST',
      endpoint: this.endpoint,
      path: '/',
      query: undefined,
      body: JSON.stringify({
        Action: 'CreateAccessKey',
        Version: '2010-05-08',
        UserName: user.name,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const res = http.post(signedRequest.url, signedRequest.body, { headers: signedRequest.headers });
    const xml = parseHTML(res.body as string);
    const accessKeyNode = xml.find('CreateAccessKeyResult').find('AccessKey');

    const key: AccessKey = {
      id: accessKeyNode.find('AccessKeyId').text(),
      value: accessKeyNode.find('SecretAccessKey').text(),
    };

    return { res, key };
  }

  public async addUserToGroup(group: Group, user: User) {
    const signedRequest = this.signer.sign({
      method: 'POST',
      endpoint: this.endpoint,
      path: '/',
      query: undefined,
      body: JSON.stringify({
        Action: 'AddUserToGroup',
        Version: '2010-05-08',
        GroupName: group.name,
        UserName: user.name,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const res = http.post(signedRequest.url, signedRequest.body, { headers: signedRequest.headers });

    return { res };
  }

  public async attachRolePolicy(role: Role, policy: Policy) {
    const signedRequest = this.signer.sign({
      method: 'POST',
      endpoint: this.endpoint,
      path: '/',
      query: undefined,
      body: JSON.stringify({
        Action: 'AttachRolePolicy',
        Version: '2010-05-08',
        RoleName: role.name,
        PolicyArn: policy.arn,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const res = http.post(signedRequest.url, signedRequest.body, { headers: signedRequest.headers });

    return { res };
  }

  public async attachUserPolicy(user: User, policy: Policy) {
    const signedRequest = this.signer.sign({
      method: 'POST',
      endpoint: this.endpoint,
      path: '/',
      query: undefined,
      body: JSON.stringify({
        Action: 'AttachUserPolicy',
        Version: '2010-05-08',
        UserName: user.name,
        PolicyArn: policy.arn,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const res = http.post(signedRequest.url, signedRequest.body, { headers: signedRequest.headers });

    return { res };
  }

  public async attachGroupPolicy(group: Group, policy: Policy) {
    const signedRequest = this.signer.sign({
      method: 'POST',
      endpoint: this.endpoint,
      path: '/',
      query: undefined,
      body: JSON.stringify({
        Action: 'AttachGroupPolicy',
        Version: '2010-05-08',
        GroupName: group.name,
        PolicyArn: policy.arn,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const res = http.post(signedRequest.url, signedRequest.body, { headers: signedRequest.headers });

    return { res };
  }

  public async deleteGroup(group: Group) {
    const signedRequest = this.signer.sign({
      method: 'POST',
      endpoint: this.endpoint,
      path: '/',
      query: undefined,
      body: JSON.stringify({
        Action: 'DeleteGroup',
        Version: '2010-05-08',
        GroupName: group.name,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const res = http.post(signedRequest.url, signedRequest.body, { headers: signedRequest.headers });

    return { res };
  }

  public async deleteUser(user: User) {
    const signedRequest = this.signer.sign({
      method: 'POST',
      endpoint: this.endpoint,
      path: '/',
      query: undefined,
      body: JSON.stringify({
        Action: 'DeleteUser',
        Version: '2010-05-08',
        UserName: user.name,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const res = http.post(signedRequest.url, signedRequest.body, { headers: signedRequest.headers });

    return { res };
  }

  public async assumeRole(role: Role, sessionName: string) {
    const signedRequest = this.signer.sign({
      method: 'POST',
      endpoint: this.endpoint,
      path: '/',
      query: undefined,
      body: JSON.stringify({
        Action: 'AssumeRole',
        Version: '2010-05-08',
        RoleArn: role.arn,
        RoleSessionName: sessionName,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    }, { signingService: STS_SERVICE });

    const res = http.post(signedRequest.url, signedRequest.body, { headers: signedRequest.headers });
    const xml = parseHTML(res.body as string);
    const node = xml.find('AssumeRoleResult').find('Credentials');

    const session = {
      accessKeyId: node.find('AccessKeyId').text(),
      secretAccessKey: node.find('SecretAccessKey').text(),
      sessionToken: node.find('SessionToken').text(),
      expiration: node.find('Expiration').text(),
    };

    return { res, session };
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
        signingService: S3_SERVICE,
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
}

export { Account };
