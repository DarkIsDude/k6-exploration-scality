import { Account, AccountAccessKey, User } from '../type';

export type VaultCreateAccountResponse = {
  account: {
    data: Account;
  };
};

export type VaultListAccountsResponse = {
  accounts: Account[];
};

export type VaultGenerateAccountAccessKeyResponse = {
  data: AccountAccessKey;
};

export type VaultCreateUserResponse = {
  user: {
    data: User;
  };
};
