export type AccessKey = {
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

export type Group = {
  arn: string;
  id: string;
  name: string;
};

export type Role = {
  arn: string;
  id: string;
  name: string;
  createDate: string;
};

export type Policy = {
  arn: string;
  id: string;
  name: string;
};
