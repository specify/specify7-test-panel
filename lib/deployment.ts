export type ActiveDeployment = Deployment & {
  hostname: string;
  deployedAt: string;
  accessedAt: string;
};

export type Deployment = {
  branch: string;
  database: string;
  schemaVersion: string;
  wasAutoDeployed: boolean;
};
