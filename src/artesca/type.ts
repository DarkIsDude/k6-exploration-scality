import { Account } from '../type';

export type ArtescaAccountAccessKey = {
  accessKey: string;
  secretKey: string;
};

export type ArtescaAccount = Pick<Account, 'arn' | 'canonicalId' | 'id' | 'createDate'> & {
  email: string;
  userName: string;
};
