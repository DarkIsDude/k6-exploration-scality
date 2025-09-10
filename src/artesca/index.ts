import http from 'k6/http';
import { JSONObject } from 'k6';
import { Account, AccountAccessKey } from '../type';
import { ArtescaAccount, ArtescaAccountAccessKey } from './type';

export class Artesca {
  private endpoint: string;
  private uuid: string;
  private username: string;
  private password: string;

  constructor(endpoint: string, uuid: string, username: string, password: string) {
    this.endpoint = endpoint;
    this.uuid = uuid;
    this.username = username;
    this.password = password;
  }

  private async getToken() {
    const res = http.post(
      `${this.endpoint}/auth/realms/artesca/protocol/openid-connect/token`,
      {
        grant_type: 'password',
        client_id: 'zenko-ui',
        username: this.username,
        password: this.password,
        scope: 'openid',
      },
      {},
    );

    const token = (res.json() as JSONObject).access_token as string;
    return token;
  }

  public async createAccount(userName: string, email: string) {
    const token = await this.getToken();
    const res = http.post(
      `${this.endpoint}/data/api/v1/config/${this.uuid}/user`,
      JSON.stringify({
        userName,
        email,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Authentication-Token': token,
        },
      },
    );

    const body = res.json() as ArtescaAccount | undefined;
    const bodyTransformed: Account | undefined = body
      ? {
          arn: body.arn,
          canonicalId: body.canonicalId,
          id: body.id,
          emailAddress: body.email,
          name: body.userName,
          createDate: body.createDate,
        }
      : undefined;
    return { res, account: bodyTransformed };
  }

  public async generateAsscessKeyForAccount(account: Account) {
    const token = await this.getToken();
    const res = http.post(`${this.endpoint}/data/api/v1/config/${this.uuid}/user/${account.name}/key`, null, {
      headers: {
        'Content-Type': 'application/json',
        'X-Authentication-Token': token,
      },
    });

    const body = res.json() as ArtescaAccountAccessKey | undefined;
    const bodyTransformed: AccountAccessKey | undefined = body
      ? {
          id: body.accessKey,
          value: body.secretKey,
        }
      : undefined;
    return { res, key: bodyTransformed };
  }
}
