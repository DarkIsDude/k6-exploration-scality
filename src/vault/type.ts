import { AccessKey, Account, User } from '../type';

export type VaultCreateAccountResponse = {
  account: {
    data: Account;
  };
};

export type VaultGenerateAccountAccessKeyResponse = {
  data: AccessKey;
};

export type VaultCreateUserResponse = {
  user: {
    data: User;
  };
};
