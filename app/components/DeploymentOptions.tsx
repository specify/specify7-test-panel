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
import { getContainerName, getWorkerContainerName } from '../lib/containerUtils';

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
  const [showWorkerLogs, setShowWorkerLogs] = React.useState(false);
  const [downloading, setDownloading] = React.useState(false);
  const [downloadingWorker, setDownloadingWorker] = React.useState(false);

  const handleDownloadLogs = async (containerType: 'main' | 'worker' = 'main') => {
    if (!deployment.hostname) return;
    
    const isWorker = containerType === 'worker';
    const setDownloadingState = isWorker ? setDownloadingWorker : setDownloading;
    
    setDownloadingState(true);
    try {
      const containerName = isWorker 
        ? getWorkerContainerName(deployment.hostname)
        : getContainerName(deployment.hostname);
      
      const response = await fetch(`/api/logs/${encodeURIComponent(containerName)}`);
      if (!response.ok) throw new Error(`Failed to fetch ${isWorker ? 'worker ' : ''}logs for download`);
      
      const logsText = await response.text();
      
      if (!logsText || logsText.trim() === '') {
        alert(localization.noLogsAvailable);
        return;
      }
      
      const timestamp = new Date().toISOString().slice(0, 16).replace(/[T:]/g, '-');
      const filename = `${containerName}-logs-${timestamp}.txt`;
      
      const blob = new Blob([logsText]);
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(`Failed to download ${isWorker ? 'worker ' : ''}logs:`, error);
      const errorMessage = isWorker 
        ? `${localization.failedToDownload} ${localization.workerLogs.toLowerCase()}. ${localization.pleaseTryAgain}`
        : `${localization.failedToDownload} ${localization.logs.toLowerCase()}. ${localization.pleaseTryAgain}`;
      alert(errorMessage);
    } finally {
      setDownloadingState(false);
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
          title={`${localization.view} ${localization.logs}`}
          onClose={(): void => setShowLogs(false)}
          buttons={
            <>
              <button
                onClick={() => handleDownloadLogs('main')}
                disabled={downloading}
                className={infoButtonClassName}
              >
                {icons.download}
                <span className="ml-2">
                  {downloading ? localization.downloading : `${localization.download} ${localization.logs}`}
                </span>
              </button>
              <button
                className={infoButtonClassName}
                type="button"
                onClick={(): void => setShowLogs(false)}
              >
                {localization.close}
              </button>
            </>
          }
        >
          <ContainerLogs deployment={deployment} />
        </ModalDialog>
      )}
      {showWorkerLogs && (
        <ModalDialog
          title={`${localization.view} ${localization.workerLogs}`}
          onClose={(): void => setShowWorkerLogs(false)}
          buttons={
            <>
              <button
                onClick={() => handleDownloadLogs('worker')}
                disabled={downloadingWorker}
                className={infoButtonClassName}
              >
                {icons.download}
                <span className="ml-2">
                  {downloadingWorker ? localization.downloading : `${localization.download} ${localization.workerLogs}`}
                </span>
              </button>
              <button
                className={infoButtonClassName}
                type="button"
                onClick={(): void => setShowWorkerLogs(false)}
              >
                {localization.close}
              </button>
            </>
          }
        >
          <ContainerLogs 
            deployment={deployment}
            containerName={deployment.hostname ? getWorkerContainerName(deployment.hostname) : undefined}
          />
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
              {`${localization.view} ${localization.logs}`}
            </button>
            <button
              className={infoButtonClassName}
              type="button"
              onClick={(): void => setShowWorkerLogs(true)}
            >
              {`${localization.view} ${localization.workerLogs}`}
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