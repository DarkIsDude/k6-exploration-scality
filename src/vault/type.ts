export type CreateAccountResponse = {
  account: {
    data: Account;
  };
};

export type ListAccountsResponse = {
  accounts: Account[];
};

export type Account = {
  arn: string;
  canonicalId: string;
  id: string;
  emailAddress: string;
  name: string;
  createDate: string;
};
