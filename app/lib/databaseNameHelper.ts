/**
 * Generate a database name with today's date suffix
 * Format: {baseName}_YYYY_MM_DD
 */
export function generateDatabaseNameWithDate(baseName: string): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${baseName}_${year}_${month}_${day}`;
}
