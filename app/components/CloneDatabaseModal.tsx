import React from 'react';
import { ModalDialog } from './ModalDialog';
import { successButtonClassName, primaryButtonClassName } from './InteractivePrimitives';
import { localization } from '../const/localization';

export function CloneDatabaseModal({
  database,
  onClose: handleClose,
}: {
  readonly database: string;
  readonly onClose: () => void;
}): JSX.Element {
  const [prefix, setPrefix] = React.useState('');
  const [isCloning, setIsCloning] = React.useState(false);
  const [progress, setProgress] = React.useState<{ total: number; current: number; done: boolean; error?: string } | null>(null);
  const [newDbName, setNewDbName] = React.useState<string>('');

  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isCloning && newDbName) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/databases/${database}/clone?newName=${encodeURIComponent(newDbName)}`);
          if (res.ok) {
            const status = await res.json();
            setProgress(status);
            if (status.done) {
              clearInterval(interval!);
              setIsCloning(false);
              if (!status.error) {
                alert(localization.databaseCloned(newDbName));
                handleClose();
              } else {
                alert(`${localization.failedToCloneDatabase}: ${status.error}`);
              }
            }
          }
        } catch (err) {
          // ignore polling errors
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCloning, newDbName, database, handleClose]);

  const handleClone = async (): Promise<void> => {
    if (!prefix.trim()) {
      alert(localization.enterPrefix);
      return;
    }
    const dbName = `${prefix.trim()}_${database}`;
    setNewDbName(dbName);
    setIsCloning(true);
    setProgress(null);
    try {
      const response = await fetch(`/api/databases/${database}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName: dbName }),
      });
      if (!response.ok) {
        let errorMessage = response.statusText;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          try {
            const error = await response.json();
            errorMessage = error.error || response.statusText;
          } catch (jsonError) {
            // Fallback to status text if JSON parsing fails
          }
        }
        setIsCloning(false);
        alert(`${localization.failedToCloneDatabase}: ${errorMessage}`);
      }
    } catch (error) {
      setIsCloning(false);
      console.error('Failed to clone database:', error);
      alert(`${localization.failedToCloneDatabase}: ${error}`);
    }
  };

  return (
    <ModalDialog
      buttons={
        <>
          <button
            className={`${primaryButtonClassName} flex items-center gap-2`}
            type="button"
            onClick={handleClose}
            disabled={isCloning}
          >
            {localization.cancel}
          </button>
          <button
            className={`${successButtonClassName} flex items-center gap-2`}
            type="button"
            onClick={handleClone}
            disabled={isCloning || !prefix.trim()}
          >
            {isCloning ? localization.cloningDatabase : localization.cloneDatabase}
          </button>
        </>
      }
      title={localization.cloneDatabaseDialogTitle}
      onClose={handleClose}
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="clone-prefix">{localization.cloneDatabaseDialogMessage(database)}</label>
        <input
          id="clone-prefix"
          type="text"
          className="border rounded p-2"
          value={prefix}
          onChange={e => {
            // Only allow underscores, no dashes or spaces
            const raw = e.target.value;
            // Replace any non-word character (except underscore) with underscore
            const sanitized = raw.replace(/[^A-Za-z0-9_]+/g, '_');
            setPrefix(sanitized);
          }}
          placeholder={localization.cloneDatabasePrefixPlaceholder}
          disabled={isCloning}
        />
        {prefix.trim() && (
          <div className="text-sm text-gray-600">
            {localization.previewDatabaseNameLabel || 'Preview:'} <span className="font-mono">{`${prefix.trim()}_${database}`}</span>
          </div>
        )}
        {isCloning && progress && progress.total > 0 && (
          <div className="w-full h-2 bg-gray-200 rounded overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        )}
        {isCloning && (!progress || progress.total === 0) && (
          <div className="w-full h-2 bg-gray-200 rounded overflow-hidden">
            <div className="h-full bg-blue-500 animate-pulse" style={{ width: '60%' }} />
          </div>
        )}
      </div>
    </ModalDialog>
  );
}
