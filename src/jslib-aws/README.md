# k6-jslib-aws

This folder contains only code coppied from [grafana/k6-jslib-aws](https://github.com/grafana/k6-jslib-aws).
Please refer to the original repository for documentation and updates.

## Updated

### 2025-09-05

The code has been updated to be add `stringToSign` and `signature` as public
properties of the `AWSSignerV4` class.

```typescript
  private stringToSign?: string;
  private signature?: string;
```
