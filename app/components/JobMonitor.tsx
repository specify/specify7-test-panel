import React from 'react';
import { localization } from '../const/localization';

export function JobMonitor(): JSX.Element {
  const [jobs, setJobs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isFirstLoad = React.useRef(true);
  const fetchJobs = async () => {
    // Only show loading on first load
    if (isFirstLoad.current && jobs.length === 0) setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/databases/jobs');
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (err) {
      setError(localization.failedToFetchJobs || 'Failed to fetch jobs');
    } finally {
      setLoading(false);
      isFirstLoad.current = false;
    }
  };

  React.useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 3000);
    return () => clearInterval(interval);
  }, []);

  const cancelJob = async (jobId: string) => {
    try {
      await fetch('/api/databases/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      fetchJobs();
    } catch (err) {
      setError(localization.failedToCancelJob || 'Failed to cancel job');
    }
  };

  return (
    <div className="rounded bg-gray-100 p-4 mb-4">
      <h2 className="text-xl font-bold mb-2">{localization.uploadJobs}</h2>
      {loading && <div>{localization.loading}</div>}
      {error && <div className="text-red-500">{error}</div>}
      {jobs.length === 0 && !loading ? <div>{localization.noOngoingJobs || 'No ongoing jobs.'}</div> : null}
      <ul className="flex flex-col gap-2">
        {jobs.map(job => (
          <li key={job.id} className="flex items-center justify-between bg-white p-2 rounded shadow">
            <div>
              <b>Type:</b> {job.data?.sourceDb && job.data?.targetDb ? 'Clone' : 'Upload'}
              <b>{localization.progress || 'Progress:'}</b> {job.progress}% <b>{localization.state || 'State:'}</b> {job.state}
            </div>
            <button
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-700"
              onClick={() => cancelJob(job.id)}
            >
              {localization.cancel}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
