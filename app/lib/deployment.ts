import {
  customStaleAfter,
  maxDeployments,
  staleAfter,
} from '../const/siteConfig';
import { getDatabases } from '../pages/api/databases';
import { getTags } from '../pages/api/dockerhub/[image]';
import { getPullRequests } from './github';
import { getMostCommonElement } from './helpers';
import type { RA } from './typescriptCommonTypes';
import type { User } from './user';

type DeploymentDetails = {
  readonly hostname: string;
  readonly deployedAt: number;
  readonly accessedAt: number;
};

export type ActiveDeployment = Deployment & DeploymentDetails;

export type Deployment = Partial<DeploymentDetails> & {
  readonly branch: string;
  readonly database: string;
  readonly schemaVersion: string;
  readonly wasAutoDeployed: boolean;
};

export type DeploymentWithInfo = Deployment & {
  readonly frontend: {
    readonly id: number;
  };
};

/**
 * Add missing details for newly added deploymenys and update
 * deployedAt for existing deployments that were changed
 */
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
        .replaceAll(/^[^a-z]+|[^\da-z]+$|[^\d\-a-z]+/g, ''),
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
                ).length + 1
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
  const pullRequests = await getPullRequests(user);

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

  const firstDatabase = Object.entries(await getDatabases()).find(
    ([_name, version]) => typeof version === 'string'
  )?.[0];
  const database =
    getMostCommonElement(state.map(({ database }) => database)) ??
    firstDatabase;

  if (typeof database === 'undefined') {
    console.error('No databases found for auto deployment');
    return state;
  }

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
