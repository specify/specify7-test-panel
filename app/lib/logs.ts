import * as fs from 'fs/promises';
import * as path from 'path';

const DOCKER_LOG_PATH = process.env.DOCKER_LOG_PATH || '/var/lib/docker/containers';

export async function getContainerLogs(containerName: string, tail: number = 200): Promise<string> {
  try {
    const containerId = await findContainerIdByName(containerName);
    if (!containerId) {
      throw new Error(`Container '${containerName}' not found`);
    }

    // Read logs directly from Docker's log files
    const logPath = path.join(DOCKER_LOG_PATH, containerId, `${containerId}-json.log`);
    
    // Ensure we're not reading outside the allowed directory (path traversal protection)
    const resolvedPath = path.resolve(logPath);
    const allowedDir = path.resolve(DOCKER_LOG_PATH);
    if (!resolvedPath.startsWith(allowedDir)) {
      throw new Error('Invalid log path');
    }

    const logData = await fs.readFile(logPath, 'utf-8');
    return parseDockerJsonLogs(logData);
  } catch (err: any) {
    throw new Error(`Could not fetch logs for container '${containerName}': ${err.message}`);
  }
}

async function findContainerIdByName(containerName: string): Promise<string | null> {
  try {
    // Get all container directories
    const containerDirs = await fs.readdir(DOCKER_LOG_PATH, { withFileTypes: true });
    
    for (const dir of containerDirs) {
      if (!dir.isDirectory()) continue;
      
      try {
        const configPath = path.join(DOCKER_LOG_PATH, dir.name, 'config.v2.json');
        const configData = await fs.readFile(configPath, 'utf-8');
        const config = JSON.parse(configData);
        
        // Check if this container matches our name
        if (config.Name === `/${containerName}` || config.Name === containerName) {
          return dir.name; // Return container ID (directory name)
        }
      } catch (err) {
        // Skip invalid config files or directories without config
        continue;
      }
    }
    
    return null;
  } catch (err) {
    throw new Error(`Failed to find container: ${err}`);
  }
}

function parseDockerJsonLogs(logData: string): string {
  try {
    const lines = logData.trim().split('\n').filter(line => line.trim());
    const parsedLogs = lines
      .map(line => {
        try {
          const logEntry = JSON.parse(line);
          const timestamp = new Date(logEntry.time).toISOString();
          return `${timestamp} ${logEntry.log}`;
        } catch (err) {
          return line;
        }
      })
      .slice(-200) // Just grab the last 200 lines
      .join('');
    
    return parsedLogs;
  } catch (err) {
    throw new Error(`Failed to parse logs: ${err}`);
  }
}