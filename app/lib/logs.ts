import Docker from 'dockerode';

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

export async function getContainerLogs(containerName: string): Promise<string> {
  try {
    const container = docker.getContainer(containerName);
    const logsBuffer = await container.logs({
      stdout: true,
      stderr: true,
      tail: 200,
      follow: false
    });

    // If logsBuffer is a Buffer, convert to string:
    if (Buffer.isBuffer(logsBuffer)) {
      return logsBuffer.toString('utf-8');
    }
    // If it is a stream (unexpected with follow: false), handle as before:
    let logs = '';
    logsBuffer.on('data', (chunk: Buffer) => {
      logs += chunk.toString('utf-8');
    });
    await new Promise((resolve, reject) => {
      logsBuffer.on('end', resolve);
      logsBuffer.on('error', reject);
    });
    return logs;
  } catch (err: any) {
    throw new Error(`Could not fetch logs for container '${containerName}': ${err.message}`);
  }
}