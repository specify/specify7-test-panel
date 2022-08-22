import {
  customStaleAfter,
  maxAutoDeployments,
  staleAfter,
} from '../const/siteConfig';
import { getDatabases } from '../pages/api/databases';
import { fetchTagsForImage } from '../pages/api/dockerhub/[image]';
import { getPullRequests } from './github';
import { getMostCommonElement, getUniqueName, split } from './helpers';
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
  readonly notes: string;
  readonly group?: string;
};

export type DeploymentWithInfo = Deployment & {
  readonly frontend: {
    readonly id: number;
  };
};

/**
 * Add missing details for newly added deployments and update
 * deployedAt for existing deployments that were changed
 */
export const formalizeState = (
  state: RA<Deployment>,
  originalState?: RA<Deployment>
): RA<ActiveDeployment> =>
  limitAutoDeployments(state)
    .map<ActiveDeployment>((deployment) => ({
      deployedAt: Date.now(),
      accessedAt: Date.now(),
      ...deployment,
      hostname: generateHostname(deployment),
    }))
    .map((state, index) => ({
      ...state,
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
          hostname: getUniqueName(
            deployment.hostname,
            deployments.map(({ hostname }) => hostname)
          ),
        },
      ],
      []
    );

function limitAutoDeployments(deployments: RA<Deployment>): RA<Deployment> {
  const [manual, automatic] = split(
    deployments,
    ({ wasAutoDeployed }) => wasAutoDeployed
  );
  return [...manual, ...automatic.slice(0, maxAutoDeployments)];
}

const generateHostname = ({ branch, database }: Deployment): string =>
  `${canonicalizeToken(database) || 'database'}-${
    canonicalizeToken(branch) || 'branch'
  }`;

const canonicalizeToken = (string: string): string =>
  string.toLowerCase().replaceAll(/^[^a-z]+|[^\da-z]+$|[^\da-z\-]+/gu, '');

export async function autoDeployPullRequests(
  state: RA<ActiveDeployment>,
  user: User,
  autoDeploy: boolean
): Promise<RA<ActiveDeployment>> {
  const pullRequests = autoDeploy ? await getPullRequests(user) : [];

  const trimmedState = autoDeploy
    ? state.filter(({ branch, accessedAt, wasAutoDeployed, notes = '' }) => {
        const readyForTesting = pullRequests.some(
          ({ headRefName }) => headRefName === branch
        );
        // Deployments with notes are exempt from cleanup
        const hasNotes = notes.length > 0;
        const staleLimit = wasAutoDeployed ? staleAfter : customStaleAfter;
        const isStale = Date.now() - accessedAt > staleLimit * 1000;
        return hasNotes || (!isStale && (!wasAutoDeployed || readyForTesting));
      })
    : state;

  const database =
    getMostCommonElement(state.map(({ database }) => database)) ??
    (await getFirstDatabase());

  if (typeof database === 'undefined') {
    console.error('No databases found for auto deployment');
    return state;
  }

  const schemaVersions = await fetchTagsForImage('specify6-service');
  const schemaVersion =
    getMostCommonElement(state.map(({ schemaVersion }) => schemaVersion)) ??
    schemaVersions[0];

  return formalizeState([
    ...trimmedState,
    ...pullRequests
      .filter(({ headRefName }) =>
        trimmedState.every(({ branch }) => branch !== headRefName)
      )
      .map(({ headRefName }) => ({
        branch: headRefName,
        database,
        schemaVersion,
        wasAutoDeployed: true,
        notes: '',
      })),
  ]);
}

const getFirstDatabase = async (): Promise<string | undefined> =>
  Object.entries(await getDatabases()).find(
    ([_name, version]) => typeof version === 'string'
  )?.[0];
