import React from 'react';

import { stateRefreshInterval } from '../const/siteConfig';
import type { Deployment, DeploymentWithInfo } from '../lib/deployment';
import type { PullRequest } from '../lib/github';
import { isNoFetchMode, split, trimString } from '../lib/helpers';
import { getRelativeDate } from '../lib/internationalization';
import type { Language } from '../lib/languages';
import type { IR, RA } from '../lib/typescriptCommonTypes';
import type { Database, localizationStrings } from '../pages';
import type { Actions } from '../reducers/Dashboard';
import { AutoGrowTextArea } from './AutoGrowTextArea';
import { DeploymentOptions } from './DeploymentOptions';
import {
  disabledButtonClassName,
  infoButtonClassName,
  link,
} from './InteractivePrimitives';
import { ModalDialog } from './ModalDialog';
import { Branch, isStale } from './Deployments';

type Status =
  | 'fetching'
  | 'unreachable'
  | {
      readonly collection: string;
      readonly discipline: string;
      readonly institution: string;
      readonly schemaVersion: string;
      readonly specifyVersion: string;
    }
  | undefined;

export function DeploymentLine({
  deployment,
  languageStrings,
  schemaVersions,
  databases,
  dispatch,
  branches,
  databaseGroups,
}: {
  readonly deployment: DeploymentWithInfo;
  readonly languageStrings: typeof localizationStrings[Language];
  readonly schemaVersions: IR<string>;
  readonly databases: RA<Database>;
  readonly dispatch: (action: Actions) => void;
  readonly branches: RA<Branch>;
  readonly databaseGroups: IR<RA<string>>;
}): JSX.Element {
  const [status, setStatus] = React.useState<Status>(undefined);

  const ungroupedDatabases = React.useMemo(() => {
    const groupedDatabases = new Set(Object.values(databaseGroups).flat());
    return databases.filter(({ name }) => !groupedDatabases.has(name));
  }, [databaseGroups, databases]);

  React.useEffect(() => {
    if (isNoFetchMode()) {
      setStatus('fetching');
      return;
    }
    let destructorCalled = false;

    const fetchStatus = (hostname: string): void => {
      if (destructorCalled) return;
      const timeout = setTimeout(() => setStatus('fetching'), 150);
      fetch(
        `${document.location.protocol}//${hostname}.${document.location.hostname}/context/system_info.json`,
        { cache: 'no-cache' }
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
          setTimeout(() => fetchStatus(hostname), stateRefreshInterval);
        })
        .catch(console.error);
    };

    if (typeof deployment.hostname === 'string')
      fetchStatus(deployment.hostname);

    return () => {
      destructorCalled = true;
    };
  }, [deployment.hostname]);

  const handleChange = (newDeployment: Partial<Deployment>): void =>
    dispatch({
      type: 'ChangeConfigurationAction',
      id: deployment.frontend.id,
      newState: {
        ...deployment,
        ...newDeployment,
      },
    });

  const isFrozen =
    deployment.deployedAt !== undefined && deployment.notes.length > 0;
  const frozenDescription = isFrozen
    ? languageStrings.frozenDeploymentDescription
    : undefined;

  const branchesWithPullRequests = branches.filter(
    ({ pullRequest }) => typeof pullRequest === 'object'
  );
  const branchesWithoutPullRequests = branches
    .filter(({ pullRequest }) => pullRequest === undefined)
    .map((branch) => branch);
  const [freshBranches, slateBranches] = split(
    branchesWithoutPullRequests,
    ({ modifiedDate }) => isStale(modifiedDate)
  );

  return (
    <li
      className="flex flex-row gap-x-5 rounded bg-gray-300 p-4"
      key={deployment.frontend.id}
    >
      <a
        className={
          'hostname' in deployment && typeof deployment.hostname !== 'undefined'
            ? infoButtonClassName
            : disabledButtonClassName
        }
        href={
          'hostname' in deployment && typeof deployment.hostname !== 'undefined'
            ? `${document.location.protocol}//${deployment.hostname}.${document.location.hostname}/`
            : undefined
        }
        onClick={async () =>
          fetch(`/api/state/${deployment.frontend.id}/ping`).catch(
            console.error
          )
        }
        onContextMenu={async () =>
          fetch(`/api/state/${deployment.frontend.id}/ping`).catch(
            console.error
          )
        }
      >
        {languageStrings.launch}
      </a>
      <select
        className="rounded-md bg-gray-200 p-2 disabled:opacity-50"
        disabled={isFrozen}
        title={frozenDescription}
        required
        style={{ maxWidth: '20vw' }}
        value={deployment.branch}
        onChange={({ target }): void =>
          handleChange({
            branch: target.value,
            hostname: undefined,
          })
        }
      >
        {branchesWithPullRequests.map(({ branch, pullRequest }) => (
          <optgroup key={branch} label={pullRequestFormatter(pullRequest!)}>
            <option value={branch}>{branch}</option>
          </optgroup>
        ))}
        <optgroup label={languageStrings.branches}>
          {freshBranches.map(({ branch }) => (
            <option key={branch} value={branch}>
              {branch}
            </option>
          ))}
        </optgroup>
        <optgroup label={languageStrings.staleBranches}>
          {slateBranches.map(({ branch }) => (
            <option key={branch} value={branch}>
              {branch}
            </option>
          ))}
        </optgroup>
      </select>
      <div className="flex flex-1 items-center">
        <p>
          {branchesWithoutPullRequests.some(
            ({ branch }) => branch === deployment.branch
          )
            ? languageStrings.serverName(deployment.frontend.id + 1)
            : [
                branchesWithPullRequests.find(
                  ({ branch }) => branch === deployment.branch
                )?.pullRequest!,
              ]
                .filter(Boolean)
                .map((pullRequest, index) => (
                  <JsxPullRequestFormatter
                    key={index}
                    pullRequest={pullRequest}
                  />
                ))[0]}
        </p>
      </div>
      <StatusIndicator
        deployment={deployment}
        languageStrings={languageStrings}
        status={status}
      />
      <TextBox
        deployment={deployment}
        languageStrings={languageStrings}
        onChange={handleChange}
      />
      <select
        className="rounded-md bg-gray-200 p-2 disabled:opacity-50"
        disabled={isFrozen}
        title={frozenDescription}
        required
        style={{ maxWidth: '10vw' }}
        value={deployment.database}
        onChange={({ target }): void =>
          handleChange({
            database: target.value,
            schemaVersion:
              databases.find(({ name }) => name === target.value)?.version ??
              deployment.schemaVersion,
          })
        }
      >
        <option />
        <optgroup label={languageStrings.databases}>
          {ungroupedDatabases.map(({ name, version }) => (
            <option key={name} value={name}>
              {`${name} (${version ?? languageStrings.corruptDatabase})`}
            </option>
          ))}
        </optgroup>
        {Object.entries(databaseGroups).map(([group, databaseNames]) => (
          <optgroup label={group} key={group}>
            {databaseNames.map((name) => (
              <option key={name} value={name}>
                {`${name} (${
                  databases.find((database) => database.name === name)
                    ?.version ?? languageStrings.corruptDatabase
                })`}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <DeploymentOptions
        deployment={deployment}
        languageStrings={languageStrings}
        schemaVersions={schemaVersions}
        onChange={handleChange}
        onDelete={(): void =>
          dispatch({
            type: 'RemoveInstanceAction',
            id: deployment.frontend.id,
          })
        }
      />
    </li>
  );
}

function TextBox({
  deployment,
  languageStrings,
  onChange: handleChange,
}: {
  readonly deployment: Deployment;
  readonly languageStrings: typeof localizationStrings[Language];
  readonly onChange: (deployment: Partial<Deployment>) => void;
}): JSX.Element {
  const retrieveRelativeDate = (): string =>
    deployment.accessedAt === undefined
      ? ''
      : getRelativeDate(new Date(deployment.accessedAt));
  const [relativeDate] = React.useState(retrieveRelativeDate);

  return (
    <AutoGrowTextArea
      className="w-80"
      containerClassName="w-80"
      placeholder={
        relativeDate === ''
          ? languageStrings.notes
          : `${languageStrings.lastAccessed} ${relativeDate}`
      }
      rows={1}
      value={deployment.notes}
      onChange={({ target }): void => handleChange({ notes: target.value })}
    />
  );
}

const pullRequestFormatter = (pullRequest: PullRequest): string =>
  `#${pullRequest.number} ${pullRequest.title}`;

function JsxPullRequestFormatter({
  pullRequest,
}: {
  readonly pullRequest: PullRequest;
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
                href={`https://github.com/specify/specify7/issues/${number}`}
                key={number}
                title={title}
              >
                {`#${number}`}
              </a>,
              `, `,
            ])
            .slice(0, -1)}
          )
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
  let state = '';
  let stateDescription: string | undefined;
  let color = '';

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
          className={`flex items-center ${color} ${
            isReady ? '' : 'cursor-default'
          }`}
          disabled={!isReady}
          title={stateDescription}
          type="button"
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
