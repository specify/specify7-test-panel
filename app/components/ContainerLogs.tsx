import React from 'react';
import type { Deployment } from '../lib/deployment';
import { getContainerName } from '../lib/containerUtils';
import { localization } from '../const/localization';

export function ContainerLogs({ 
  deployment, 
  containerName: customContainerName,
  refreshRef
}: { 
  deployment: Deployment;
  containerName?: string;
  refreshRef?: React.MutableRefObject<(() => void) | null>;
}) {
  if (!deployment.hostname && !customContainerName) {
    return <div>Error: No hostname available for this deployment</div>;
  }
  const containerName = customContainerName || getContainerName(deployment.hostname!);
  const [logs, setLogs] = React.useState<string>('');
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const logsRef = React.useRef<HTMLPreElement>(null);

  const fetchLogs = React.useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`/api/logs/${encodeURIComponent(containerName)}`);
      if (!res.ok) throw new Error('Failed to fetch logs');
      const newLogs = await res.text();
      setLogs(newLogs);
      
      // Auto-scroll to bottom
      setTimeout(() => {
        if (logsRef.current) {
          logsRef.current.scrollTop = logsRef.current.scrollHeight;
        }
      }, 100);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [containerName]);

  // Expose fetchLogs to parent via refreshRef
  React.useEffect(() => {
    if (refreshRef) {
      refreshRef.current = fetchLogs;
    }
  }, [refreshRef, fetchLogs]);

  // Initial load and auto-refresh every 5 seconds
  React.useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  if (loading) return <div>{localization.loading}</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;
  
  return (
    <div className="flex flex-col gap-4 h-full">
      <pre
        ref={logsRef}
        style={{
          maxHeight: '50vh',
          overflow: 'auto',
          background: '#222',
          color: '#eee',
          padding: '1em',
          fontSize: '0.9em',
          flex: 1
        }}
        data-testid="container-logs"
      >
        {logs}
      </pre>
    </div>
  );
}