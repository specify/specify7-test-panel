import Docker from 'dockerode';

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

export async function getContainerLogs(containerName: string): Promise<string> {
  try {
    const container = docker.getContainer(containerName);
    const logsBuffer = await container.logs({
      stdout: true,
      stderr: true,
      tail: 200,
      follow: false,
      timestamps: true
    });

    // If logsBuffer is a Buffer, convert to string:
    if (Buffer.isBuffer(logsBuffer)) {
      const logs = cleanDockerLogs(logsBuffer.toString('utf-8'));
      return logs;
    }
    
    // If it is a stream, handle as a stream:
    const stream = logsBuffer as NodeJS.ReadableStream;
    let logs = '';
    
    return new Promise<string>((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => {
        logs += chunk.toString('utf-8');
      });
      
      stream.on('end', () => {
        const cleanedLogs = cleanDockerLogs(logs);
        resolve(cleanedLogs);
      });
      
      stream.on('error', (error) => {
        reject(error);
      });
    });
  } catch (err: any) {
    throw new Error(`Could not fetch logs for container '${containerName}': ${err.message}`);
  }
}

function cleanDockerLogs(rawLogs: string): string {
  const sanitized = rawLogs.replace(/\0/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Split by lines and clean each line
  return sanitized
    .split('\n')
    .map(line => {
      // Remove Docker log stream headers so it looks cleaner
      if (line.length > 8) {
        // Use the timestamp pattern to find the start of the actual log message
        const timestampMatch = line.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        if (timestampMatch) {
          const timestampIndex = line.indexOf(timestampMatch[0]);
          return line.substring(timestampIndex);
        }
      }
      return line;
    })
    .filter(line => line.trim().length > 0)
    .join('\n');
}