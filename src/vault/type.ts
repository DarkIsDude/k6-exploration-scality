import { Account, AccountAccessKey, User } from '../type';

export type CreateAccountResponse = {
  account: {
    data: Account;
  };
};

export type ListAccountsResponse = {
  accounts: Account[];
};

export type GenerateAccountAccessKeyResponse = {
  data: AccountAccessKey;
};

export type CreateUserResponse = {
  user: {
    data: User;
  };
};
