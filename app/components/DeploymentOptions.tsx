import React from 'react';

import type { Deployment } from '../lib/deployment';
import { isNoFetchMode } from '../lib/helpers';
import type { IR } from '../lib/typescriptCommonTypes';
import { DateElement } from './DateElement';
import { icons } from './Icons';
import {
  dangerButtonClassName,
  infoButtonClassName,
} from './InteractivePrimitives';
import { ModalDialog } from './ModalDialog';
import { useApi } from './useApi';
import { ListUsers } from '../pages/databases';
import { localization } from '../const/localization';

export function DeploymentOptions({
  deployment,
  schemaVersions,
  onChange: handleChange,
  onDelete: handleDelete,
}: {
  readonly deployment: Deployment;
  readonly schemaVersions: IR<string>;
  readonly onChange: (deployment: Partial<Deployment>) => void;
  readonly onDelete: () => void;
}): JSX.Element {
  const [isOpen, setIsOpen] = React.useState(false);

  const isFrozen = deployment.notes.length > 0;
  const frozenDescription = isFrozen
    ? localization.frozenDeploymentDescription
    : undefined;

  const [group, setGroup] = React.useState<string | undefined>(
    deployment.group
  );

  function handleClose(): void {
    setIsOpen(false);
    if (group !== deployment.group) handleChange({ group });
  }

  const [listUsers, setListUsers] = React.useState(false);

  return (
    <>
      <button
        className={infoButtonClassName}
        type="button"
        onClick={(): void => setIsOpen(true)}
      >
        {icons.cog}
      </button>
      {listUsers && (
        <ListUsers
          database={deployment.database}
          onClose={(): void => setListUsers(false)}
        />
      )}
      <ModalDialog
        buttons={
          <>
            <button
              className={dangerButtonClassName}
              disabled={isFrozen}
              title={frozenDescription}
              type="button"
              onClick={handleDelete}
            >
              {localization.remove}
            </button>
            <button
              className={infoButtonClassName}
              type="button"
              onClick={(): void => setListUsers(!listUsers)}
            >
              {localization.listUsers}
            </button>
            <button
              className={infoButtonClassName}
              type="button"
              onClick={handleClose}
            >
              {localization.close}
            </button>
          </>
        }
        isOpen={isOpen}
        title={deployment.hostname ?? localization.newDeployment}
        onClose={handleClose}
      >
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            {localization.lastAccessed}
            <div className="rounded-md border bg-gray-200 p-1.5">
              <DateElement
                date={deployment.accessedAt}
                fallback={localization.never}
              />
            </div>
          </label>
          <label className="flex flex-col gap-2">
            {localization.deployedAt}
            <div className="rounded-md border bg-gray-200 p-1.5">
              <DateElement
                date={deployment.deployedAt}
                fallback={localization.never}
              />
            </div>
          </label>
          <label className="flex flex-col gap-2">
            {localization.groupName}
            <input
              className="rounded-md border bg-gray-200 p-1.5"
              type="text"
              value={group ?? ''}
              onChange={({ target }): void => setGroup(target.value)}
            />
          </label>
          <label className="flex flex-col gap-2">
            {localization.schemaVersion}
            <select
              className="rounded-md bg-gray-200 p-2 disabled:opacity-50"
              disabled={isFrozen}
              required
              title={frozenDescription}
              value={deployment.schemaVersion}
              onChange={({ target }): void =>
                handleChange({
                  schemaVersion: target.value,
                })
              }
            >
              <optgroup label={localization.schemaVersion}>
                {Object.keys(schemaVersions).map((version) => (
                  <option key={version} value={version}>
                    {version}
                  </option>
                ))}
              </optgroup>
            </select>
          </label>
        </div>
        {typeof deployment.hostname === 'string' && !isNoFetchMode() && (
          <DeploymentBuildDate hostname={deployment.hostname} />
        )}
      </ModalDialog>
    </>
  );
}

function DeploymentBuildDate({
  hostname,
}: {
  readonly hostname: string;
}): JSX.Element | null {
  const [state] = useApi<string>(
    `${document.location.protocol}//${hostname}.${document.location.hostname}/static/build_date.txt`
  );
  return typeof state === 'object' ? (
    <label className="flex flex-col gap-2">
      {localization.buildDate}
      <div className="rounded-md border bg-gray-200 p-1.5">
        <DateElement date={state.data} fallback={localization.loading} />
      </div>
    </label>
  ) : null;
}
