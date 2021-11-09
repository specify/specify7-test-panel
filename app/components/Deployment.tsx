import React from 'react';
import { stateRefreshInterval } from '../const/siteConfig';
import { PullRequest } from '../lib/github';
import { trimString } from '../lib/helpers';
import { Language } from '../lib/languages';
import { ActiveDeployment, DeploymentWithInfo } from '../lib/deployment';
import { IR, RA } from '../lib/typescriptCommonTypes';
import { localizationStrings } from '../pages';
import { Actions } from '../reducers/Dashboard';
import {
  disabledButtonClassName,
  infoButtonClassName,
  link,
} from './InteractivePrimitives';
import { ModalDialog } from './ModalDialog';

type Status =
  | undefined
  | 'fetching'
  | 'unreachable'
  | {
      readonly collection: string;
      readonly discipline: string;
      readonly institution: string;
      readonly schemaVersion: string;
      readonly specifyVersion: string;
    };

export function DeploymentLine({
  deployment,
  languageStrings,
  schemaVersions,
  databases,
  dispatch,
  branchesWithPullRequests,
  branchesWithoutPullRequests,
}: {
  readonly deployment: DeploymentWithInfo;
  readonly languageStrings: typeof localizationStrings[Language];
  readonly schemaVersions: IR<string>;
  readonly databases: RA<string>;
  readonly dispatch: (action: Actions) => void;
  readonly branchesWithPullRequests: RA<Readonly<[string, PullRequest]>>;
  readonly branchesWithoutPullRequests: RA<string>;
}): JSX.Element {
  const [status, setStatus] = React.useState<Status>(undefined);

  React.useEffect(() => {
    const fetchStatus = (deployment: ActiveDeployment & DeploymentWithInfo) => {
      const timeout = setTimeout(() => setStatus('fetching'), 150);
      fetch(
        `${document.location.protocol}//${deployment.hostname}.${document.location.hostname}/context/system_info.json`
      )
        .then<Status>(async (response) => {
          if (response.status !== 200) return 'unreachable';
          const data: {
            readonly collection: string;
            readonly discipline: string;
            readonly institution: string;
            readonly schema_version: string;
            readonly version: string;
          } = await response.json();
          return {
            collection: data.collection,
            discipline: data.discipline,
            institution: data.institution,
            schemaVersion: data.schema_version,
            specifyVersion: data.version,
          };
        })
        .catch<Status>(() => 'unreachable')
        .then((status) => {
          clearTimeout(timeout);
          if (destructorCalled) return;
          setStatus(status);
          setTimeout(() => fetchStatus(deployment), stateRefreshInterval);
        })
        .catch(console.error);
    };

    if (typeof deployment.hostname !== 'undefined')
      fetchStatus(deployment as ActiveDeployment & DeploymentWithInfo);

    let destructorCalled = false;
    return () => {
      destructorCalled = false;
    };
  }, [deployment]);

  return (
    <li
      key={deployment.frontend.id}
      className="gap-x-5 flex flex-row p-4 bg-gray-300 rounded"
    >
      <a
        href={
          'hostname' in deployment && typeof deployment.hostname !== 'undefined'
            ? `${document.location.protocol}//${deployment.hostname}.${document.location.hostname}/`
            : undefined
        }
        className={
          'hostname' in deployment && typeof deployment.hostname !== 'undefined'
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
              ))[0]}
        </p>
      </div>
      <span className="flex-1" />
      <StatusIndicator
        deployment={deployment}
        status={status}
        languageStrings={languageStrings}
      />
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

function StatusIndicator({
  deployment,
  status,
  languageStrings,
}: {
  readonly deployment: DeploymentWithInfo;
  readonly status: Status;
  readonly languageStrings: typeof localizationStrings[Language];
}): JSX.Element {
  let state: string = '';
  let stateDescription: string | undefined;
  let color: string = '';

  const isReady = typeof status === 'object';

  if (typeof status === 'undefined' || status === 'fetching') {
    state = languageStrings.fetching;
    color = 'text-blue-600';
  } else if (status === 'unreachable') {
    state = languageStrings.starting;
    color = 'text-red-600';
  } else if (isReady) {
    if (deployment.wasAutoDeployed) {
      state = languageStrings.automatic;
      stateDescription = languageStrings.automaticDescription;
    } else state = languageStrings.ready;
    color = 'text-green-600';
  }

  const [isOpen, setIsOpen] = React.useState<boolean>(false);

  return (
    <>
      {typeof status !== 'undefined' && (
        <button
          type="button"
          className={`flex items-center ${color} ${
            isReady ? '' : 'cursor-default'
          }`}
          disabled={!isReady}
          title={stateDescription}
          onClick={isReady ? () => setIsOpen(true) : undefined}
        >
          {state}
        </button>
      )}
      {isReady && isOpen && (
        <ModalDialog title={deployment.branch} onClose={() => setIsOpen(false)}>
          <b>{languageStrings.collection}:</b> {status.collection}
          <br />
          <b>{languageStrings.discipline}:</b> {status.discipline}
          <br />
          <b>{languageStrings.institution}:</b> {status.institution}
          <br />
          <b>{languageStrings.schemaVersion}:</b> {status.schemaVersion}
          <br />
          <b>{languageStrings.specifyVersion}:</b> {status.specifyVersion}
        </ModalDialog>
      )}
    </>
  );
}