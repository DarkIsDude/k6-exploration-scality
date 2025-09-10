export type AccountAccessKey = {
  id: string;
  value: string;
};

export type Account = {
  arn: string;
  canonicalId: string;
  id: string;
  emailAddress: string;
  name: string;
  createDate: string;
};

export type User = {
  arn: string;
  id: string;
  name: string;
  createDate: string;
};
