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
import { ContainerLogs } from './ContainerLogs';

function getContainerName(hostname: string): string {
  // Match the docker naming scheme for deployment containers
  return `specify7-test-panel-${hostname}-1`;
}
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
  const [showLogs, setShowLogs] = React.useState(false);
  const [downloading, setDownloading] = React.useState(false);

  const handleDownloadLogs = async () => {
    if (!deployment.hostname) return;
    
    setDownloading(true);
    try {
      const containerName = getContainerName(deployment.hostname);
      const response = await fetch(`/api/logs/${encodeURIComponent(containerName)}`);
      if (!response.ok) throw new Error('Failed to fetch logs for download');
      
      const logsText = await response.text();
      
      if (!logsText || logsText.trim() === '') {
        alert('No logs available for this container');
        return;
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${containerName}-logs-${timestamp}.txt`;
      
      const blob = new Blob([logsText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download logs:', error);
      alert('Failed to download logs. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

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
      {showLogs && (
        <ModalDialog
          title={localization.viewLogs ?? "Container Logs"}
          onClose={(): void => setShowLogs(false)}
          buttons={
            <>
              <button
                onClick={handleDownloadLogs}
                disabled={downloading}
                className={infoButtonClassName}
              >
                {icons.download}
                <span className="ml-2">
                  {downloading ? 'Downloading...' : 'Download Logs'}
                </span>
              </button>
              <button
                className={infoButtonClassName}
                type="button"
                onClick={(): void => setShowLogs(false)}
              >
                Close
              </button>
            </>
          }
        >
          <ContainerLogs deployment={deployment} />
        </ModalDialog>
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
              onClick={(): void => setShowLogs(true)}
            >
              {localization.viewLogs ?? "View Logs"}
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