import React from 'react';
import { PullRequest } from '../lib/github';
import { trimString } from '../lib/helpers';
import { Language } from '../lib/languages';
import { DeploymentWithInfo } from '../lib/deployment';
import { IR, RA } from '../lib/typescriptCommonTypes';
import { localizationStrings } from '../pages';
import { Actions } from '../reducers/Dashboard';
import {
  disabledButtonClassName,
  infoButtonClassName,
  link,
} from './InteractivePrimitives';

export function Deployments({
  languageStrings,
  deployments,
  schemaVersions,
  branches,
  databases,
  pullRequests,
  dispatch,
}: {
  readonly languageStrings: typeof localizationStrings[Language];
  readonly deployments: RA<DeploymentWithInfo>;
  readonly schemaVersions: IR<string>;
  readonly branches: IR<string>;
  readonly databases: RA<string>;
  readonly pullRequests: RA<PullRequest>;
  readonly dispatch: (action: Actions) => void;
}): JSX.Element {
  const pairedBranches = Object.keys(branches).map(
    (branch) =>
      [
        branch,
        pullRequests.find(({ headRefName }) => headRefName === branch),
      ] as const
  );

  const branchesWithPullRequests = pairedBranches.filter(
    (entry): entry is [string, PullRequest] => typeof entry[1] !== 'undefined'
  );
  const branchesWithoutPullRequests = pairedBranches
    .filter(
      (entry): entry is [string, PullRequest] => typeof entry[1] === 'undefined'
    )
    .map(([branch]) => branch);

  return (
    <ul className="gap-y-5 flex flex-col mt-4">
      {deployments.map((deployment) => (
        <li
          key={deployment.frontend.id}
          className="gap-x-5 flex flex-row p-4 bg-gray-300 rounded"
        >
          <a
            href={
              'hostname' in deployment
                ? `${document.location.protocol}//${deployment.hostname}.${document.location.hostname}/`
                : undefined
            }
            className={
              'hostname' in deployment
                ? infoButtonClassName
                : disabledButtonClassName
            }
            onClick={() =>
              fetch(`/api/state/${deployment.frontend.id}/ping`).catch(
                console.error
              )
            }
            onContextMenu={() =>
              fetch(`/api/state/${deployment.frontend.id}/ping`).catch(
                console.error
              )
            }
          >
            {languageStrings.launch}
          </a>
          <select
            className="p-2 bg-gray-200 rounded-md"
            value={deployment.branch}
            required
            style={{ maxWidth: '20vw' }}
            onChange={({ target }) =>
              dispatch({
                type: 'ChangeConfigurationAction',
                id: deployment.frontend.id,
                newState: {
                  ...deployment,
                  branch: target.value,
                  hostname: undefined,
                },
              })
            }
          >
            {branchesWithPullRequests.map(([branch, pullRequest]) => (
              <optgroup key={branch} label={pullRequestFormatter(pullRequest)}>
                <option value={branch}>{branch}</option>
              </optgroup>
            ))}
            <optgroup label={languageStrings.otherBranches}>
              {branchesWithoutPullRequests.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </optgroup>
          </select>
          <div className="flex items-center">
            <p>
              {branchesWithoutPullRequests.includes(deployment.branch)
                ? languageStrings.serverName(deployment.frontend.id + 1)
                : [
                    branchesWithPullRequests.find(
                      ([branch]) => branch === deployment.branch
                    )![1],
                  ].map((pullRequest, index) => (
                    <JsxPullRequestFormatter
                      pullRequest={pullRequest}
                      key={index}
                    />
                  ))}
            </p>
          </div>
          <span className="flex-1" />
          {deployment.wasAutoDeployed && (
            <span className="flex items-center text-green-600">
              {languageStrings.automatic}
            </span>
          )}
          <select
            className="p-2 bg-gray-200 rounded-md"
            value={deployment.database}
            required
            style={{ maxWidth: '10vw' }}
            onChange={({ target }) =>
              dispatch({
                type: 'ChangeConfigurationAction',
                id: deployment.frontend.id,
                newState: {
                  ...deployment,
                  database: target.value,
                },
              })
            }
          >
            <optgroup label={languageStrings.databases}>
              {databases.map((database) => (
                <option key={database} value={database}>
                  {database}
                </option>
              ))}
            </optgroup>
          </select>
          <select
            className="p-2 bg-gray-200 rounded-md"
            value={deployment.schemaVersion}
            required
            style={{ maxWidth: '10vw' }}
            onChange={({ target }) =>
              dispatch({
                type: 'ChangeConfigurationAction',
                id: deployment.frontend.id,
                newState: {
                  ...deployment,
                  schemaVersion: target.value,
                },
              })
            }
          >
            <optgroup label={languageStrings.schemaVersion}>
              {Object.keys(schemaVersions).map((version) => (
                <option key={version} value={version}>
                  {version}
                </option>
              ))}
            </optgroup>
          </select>
        </li>
      ))}
    </ul>
  );
}

const pullRequestFormatter = (pullRequest: PullRequest): string =>
  `#${pullRequest.number} ${pullRequest.title}`;

function JsxPullRequestFormatter({
  pullRequest,
}: {
  pullRequest: PullRequest;
}): JSX.Element {
  return (
    <>
      <a
        className={link}
        href={`https://github.com/specify/specify7/pull/${pullRequest.number}`}
      >
        {`#${pullRequest.number}`}
      </a>{' '}
      <span
        title={pullRequest.title.length > 70 ? pullRequest.title : undefined}
      >
        {trimString(pullRequest.title, 70)}
      </span>
      {Object.keys(pullRequest.closingIssuesReferences.nodes).length > 0 ? (
        <span>
          {` (`}
          {pullRequest.closingIssuesReferences.nodes
            .flatMap(({ number, title }) => [
              <a
                className={link}
                key={number}
                title={title}
                href={`https://github.com/specify/specify7/issues/${number}`}
              >
                {`#${number}`}
              </a>,
              `, `,
            ])
            .slice(0, -1)}
          {`)`}
        </span>
      ) : undefined}
    </>
  );
}
