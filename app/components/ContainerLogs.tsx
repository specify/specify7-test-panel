import React from 'react';
import type { Deployment } from '../lib/deployment';

function getContainerName(hostname: string): string {
  // Match the docker naming scheme for deployment containers
  return `specify7-test-panel-${hostname}-1`;
}

export function ContainerLogs({ 
  deployment, 
  containerName: customContainerName 
}: { 
  deployment: Deployment;
  containerName?: string;
}) {
  if (!deployment.hostname && !customContainerName) {
    return <div>Error: No hostname available for this deployment</div>;
  }
  const containerName = customContainerName || getContainerName(deployment.hostname!);
  const [logs, setLogs] = React.useState<string>('');
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`/api/logs/${encodeURIComponent(containerName)}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch logs');
        return res.text();
      })
      .then(setLogs)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [containerName]);

  if (loading) return <div>Loading logs...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;
  return (
    <pre
      style={{
        maxHeight: '50vh',
        overflow: 'auto',
        background: '#222',
        color: '#eee',
        padding: '1em',
        fontSize: '0.9em'
      }}
      data-testid="container-logs"
    >
      {logs}
    </pre>
  );
}