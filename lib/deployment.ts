export type Deployment = {
  id: string;
  hostname: string;
  deployedAt: string;
  accessedAt: string;
  branch: string;
  database: string;
  schemaVersion: string;
  wasAutoDeployed: boolean;
};
