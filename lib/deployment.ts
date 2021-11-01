import {
  customStaleAfter,
  maxDeployments,
  staleAfter,
} from '../const/siteConfig';
import { getDatabases } from '../pages/api/databases';
import { getTags } from '../pages/api/dockerhub/[image]';
import { filterPullRequests, getPullRequests } from './github';
import { getMostCommonElement } from './helpers';
import { RA } from './typescriptCommonTypes';
import { User } from './user';

type DeploymentDetails = {
  hostname: string;
  deployedAt: number;
  accessedAt: number;
};

export type ActiveDeployment = Deployment & DeploymentDetails;

export type Deployment = Partial<DeploymentDetails> & {
  branch: string;
  database: string;
  schemaVersion: string;
  wasAutoDeployed: boolean;
};

export type DeploymentWithInfo = Deployment & {
  readonly frontend: {
    readonly id: number;
    readonly status?:
      | 'fetching'
      | 'unreachable'
      | {
          readonly collection: string;
          readonly discipline: string;
          readonly institution: string;
          readonly schemaVersion: string;
          readonly version: string;
        };
  };
};

export const formalizeState = (
  state: RA<Deployment>,
  originalState?: RA<Deployment>
): RA<ActiveDeployment> =>
  state
    .slice(0, maxDeployments)
    .map<ActiveDeployment>((state) => ({
      deployedAt: Date.now(),
      accessedAt: Date.now(),
      hostname: state.branch
        .toLowerCase()
        .replaceAll(/^[^a-z]+|[^a-z\d]+$|[^a-z\d-]+/g, ''),
      ...state,
    }))
    .map((state, index) => ({
      ...state,
      hostname: state.hostname.length > 0 ? state.hostname : `server-${index}`,
      deployedAt:
        typeof originalState?.[index] === 'undefined' ||
        (['branch', 'database', 'schemaVersion'] as const).every(
          (key) => state[key] === originalState[index][key]
        )
          ? state.deployedAt
          : Date.now(),
    }))
    .reduce<RA<ActiveDeployment>>(
      (deployments, deployment) => [
        ...deployments,
        {
          ...deployment,
          hostname: deployments.some(
            ({ hostname }) => hostname === deployment.hostname
          )
            ? `${deployment.hostname}-${
                deployments.filter(
                  ({ hostname }) => hostname === deployment.hostname
                ).length
              }`
            : deployment.hostname,
        },
      ],
      []
    );

export async function autoDeployPullRequests(
  state: RA<ActiveDeployment>,
  user: User
): Promise<RA<ActiveDeployment>> {
  const pullRequests = filterPullRequests(
    await getPullRequests(user.token),
    user
  );

  const trimmedState = state.filter(
    ({ branch, accessedAt, wasAutoDeployed }) => {
      const readyForTesting = pullRequests.some(
        ({ headRefName }) => headRefName === branch
      );
      const staleLimit = wasAutoDeployed ? staleAfter : customStaleAfter;
      const isStale = Date.now() - accessedAt > staleLimit * 1000;
      return !isStale && (!wasAutoDeployed || readyForTesting);
    }
  );

  const databases = await getDatabases();
  const database =
    getMostCommonElement(state.map(({ database }) => database)) ?? databases[0];

  const schemaVersions = await getTags('specify6-service');
  const schemaVersion =
    getMostCommonElement(state.map(({ schemaVersion }) => schemaVersion)) ??
    schemaVersions[0];

  return formalizeState([
    ...trimmedState,
    ...pullRequests
      .filter(({ headRefName }) =>
        trimmedState.every(({ branch }) => branch !== headRefName)
      )
      .slice(0, maxDeployments - trimmedState.length)
      .map(({ headRefName }) => ({
        branch: headRefName,
        database,
        schemaVersion,
        wasAutoDeployed: true,
      })),
  ]);
}
