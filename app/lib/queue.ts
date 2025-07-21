import Bull from 'bull';

export const uploadQueue = new Bull('database-upload', {
  redis: { host: 'localhost', port: 6379 }
});

export const cloneQueue = new Bull('database-clone', {
  redis: { host: 'localhost', port: 6379 }
});
