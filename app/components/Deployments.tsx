import React from 'react';

import type { DeploymentWithInfo } from '../lib/deployment';
import type { PullRequest } from '../lib/github';
import type { Language } from '../lib/languages';
import type { IR, RA } from '../lib/typescriptCommonTypes';
import type { localizationStrings } from '../pages';
import type { Actions } from '../reducers/Dashboard';
import { DeploymentLine } from './Deployment';

export function Deployments({
  languageStrings,
  deployments,
  schemaVersions,
  databases,
  branchesWithPullRequests,
  branchesWithoutPullRequests,
  dispatch,
}: {
  readonly languageStrings: typeof localizationStrings[Language];
  readonly deployments: RA<DeploymentWithInfo>;
  readonly schemaVersions: IR<string>;
  readonly databases: IR<string | null>;
  readonly dispatch: (action: Actions) => void;
  readonly branchesWithPullRequests: RA<
    Readonly<readonly [string, PullRequest]>
  >;
  readonly branchesWithoutPullRequests: RA<string>;
}): JSX.Element {
  return (
    <ul className="mt-4 flex flex-col gap-y-5">
      {deployments.map((deployment) => (
        <DeploymentLine
          branchesWithoutPullRequests={branchesWithoutPullRequests}
          branchesWithPullRequests={branchesWithPullRequests}
          databases={databases}
          deployment={deployment}
          dispatch={dispatch}
          key={deployment.frontend.id}
          languageStrings={languageStrings}
          schemaVersions={schemaVersions}
        />
      ))}
    </ul>
  );
}
