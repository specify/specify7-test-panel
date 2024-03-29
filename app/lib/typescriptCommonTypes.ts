// Record
export type R<V> = Record<string, V>;

// Immutable record
// eslint-disable-next-line @typescript-eslint/naming-convention
export type IR<V> = Readonly<Record<string, V>>;

// Generic Immutable record
// eslint-disable-next-line @typescript-eslint/naming-convention
export type RR<K extends number | string | symbol, V> = Readonly<Record<K, V>>;

// Immutable Array
// eslint-disable-next-line @typescript-eslint/naming-convention
export type RA<V> = readonly V[];

// Make sure a value is not undefined
export function safe<T>(value: T | undefined): T {
  if (typeof value === 'undefined') throw new Error('Value is not defined');
  else return value;
}

// Convert all nullable types to undefined
export const nullSafe = <T>(
  value: T | typeof Number.NaN | '' | false | null | undefined
): T | undefined => (Boolean(value) ? (value as T) : undefined);

export const filterArray = <T>(array: RA<T | undefined>): RA<T> =>
  array.filter((item): item is T => item !== undefined);
