import Docker from 'dockerode';

// Docker log stream header length - Docker prefixes each log line with an 8-byte header
// containing stream type (stdout/stderr) and length information
const DOCKER_LOG_HEADER_LENGTH = 8;

let docker: Docker | null = null;

function getDockerInstance(): Docker {
  if (!docker) {
    docker = new Docker({ socketPath: '/var/run/docker.sock' });
  }
  return docker;
}

export async function getContainerLogs(containerName: string, tail: number = 200): Promise<string> {
  try {
    const dockerInstance = getDockerInstance();
    const container = dockerInstance.getContainer(containerName);
    const logsBuffer = await container.logs({
      stdout: true,
      stderr: true,
      tail: tail,
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
  } catch (err: unknown) {
    const errorMessage = (err && typeof err === 'object' && 'message' in err && typeof (err as any).message === 'string')
      ? (err as any).message
      : 'Unknown error';
    throw new Error(`Could not fetch logs for container '${containerName}': ${errorMessage}`);
  }
}

function cleanDockerLogs(rawLogs: string): string {
  // Remove null characters (\0) and other non-printable ASCII control characters.
  // The regex [\x00-\x08\x0B\x0C\x0E-\x1F\x7F] matches:
  // - \x00-\x08: Control characters from NULL (0x00) to BACKSPACE (0x08).
  // - \x0B: Vertical Tab (0x0B).
  // - \x0C: Form Feed (0x0C).
  // - \x0E-\x1F: Control characters from SHIFT OUT (0x0E) to UNIT SEPARATOR (0x1F).
  // - \x7F: DELETE (0x7F).
  // These characters are removed to ensure the logs are clean and readable.
  const sanitized = rawLogs.replace(/\0/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Split by lines and clean each line
  return sanitized
    .split('\n')
    .map(line => {
      // Remove Docker log stream headers so it looks cleaner
      if (line.length > DOCKER_LOG_HEADER_LENGTH) {
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