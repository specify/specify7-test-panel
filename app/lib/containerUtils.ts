/**
 * Utilities for Docker container name generation and management
 */

/**
 * Generate the container name for a deployment based on hostname
 * Matches the docker naming scheme for deployment containers
 */
export function getContainerName(hostname: string): string {
  return `specify7-test-panel-${hostname}-1`;
}

/**
 * Generate the worker container name for a deployment based on hostname
 * Matches the docker naming scheme for worker containers
 */
export function getWorkerContainerName(hostname: string): string {
  return `specify7-test-panel-${hostname}-worker-1`;
}
