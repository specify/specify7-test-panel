import { f } from './functools';
import { filterArray } from './typescriptCommonTypes';
import type { IR, RA } from './typescriptCommonTypes';

export const getMostCommonElement = <T>(array: RA<T>): T | undefined =>
  array.reduce<readonly [number, T | undefined]>(
    ([count, commonValue], value, _index, array) => {
      const occurrenceCount = array.filter(
        (searchValue) => searchValue === value
      ).length;
      return occurrenceCount > count
        ? [occurrenceCount, value]
        : [count, commonValue];
    },
    [-1, undefined]
  )[1];

export const getMostRecentTag = (tags: IR<string>): string =>
  Object.entries(tags).sort(
    multiSortFunction(([_name, lastUpdated]) => lastUpdated, true)
  )[0][0];

/** Like sortFunction, but can sort based on multiple fields */
export const multiSortFunction =
  <ORIGINAL_TYPE>(
    ...payload: readonly (
      | boolean
      | ((value: ORIGINAL_TYPE) => Date | boolean | number | string)
    )[]
  ): ((left: ORIGINAL_TYPE, right: ORIGINAL_TYPE) => -1 | 0 | 1) =>
  (left: ORIGINAL_TYPE, right: ORIGINAL_TYPE): -1 | 0 | 1 => {
    const mappers = filterArray(
      payload.map((value, index) =>
        typeof value === 'function'
          ? ([
              value,
              typeof payload[index + 1] === 'boolean'
                ? (payload[index + 1] as boolean)
                : false,
            ] as const)
          : undefined
      )
    );

    for (const [mapper, isReverse] of mappers) {
      const [leftValue, rightValue] = isReverse
        ? [mapper(right), mapper(left)]
        : [mapper(left), mapper(right)];
      if (leftValue === rightValue) continue;
      return typeof leftValue === 'string' && typeof rightValue === 'string'
        ? (leftValue.localeCompare(rightValue) as -1 | 0 | 1)
        : leftValue > rightValue
        ? 1
        : -1;
    }
    return 0;
  };

/**
 * In no-fetch more, the deployment status requests are not sent.
 * Can be enabled by adding '?no-fetch' to the URL
 * Useful in development to avaoid console errors.
 */
export const isNoFetchMode = (): boolean =>
  new URL(window.location.href).searchParams.has('no-fetch');

export const trimString = (string: string, maxLength: number): string =>
  string.length <= maxLength
    ? string
    : `${string.slice(0, Math.max(0, maxLength - 3)).trim()}...`;

/** Split array in half according to a discriminator function */
export const split = <LEFT_ITEM, RIGHT_ITEM = LEFT_ITEM>(
  array: RA<LEFT_ITEM | RIGHT_ITEM>,
  // If returns true, item would go to the right array
  discriminator: (
    item: LEFT_ITEM | RIGHT_ITEM,
    index: number,
    array: RA<LEFT_ITEM | RIGHT_ITEM>
  ) => boolean
): readonly [left: RA<LEFT_ITEM>, right: RA<RIGHT_ITEM>] =>
  array
    .map((item, index) => [item, discriminator(item, index, array)] as const)
    .reduce<
      readonly [
        left: RA<LEFT_ITEM | RIGHT_ITEM>,
        right: RA<LEFT_ITEM | RIGHT_ITEM>
      ]
    >(
      ([left, right], [item, isRight]) => [
        [...left, ...(isRight ? [] : [item])],
        [...right, ...(isRight ? [item] : [])],
      ],
      [[], []]
    ) as readonly [left: RA<LEFT_ITEM>, right: RA<RIGHT_ITEM>];

export function getUniqueName(name: string, usedNames: RA<string>): string {
  if (!usedNames.includes(name)) return name;
  const suffix = / \((\d+)\)$/u.exec(name);
  const [{ length }, indexString] = suffix ?? ([[], '0'] as const);
  const strippedName = length > 0 ? name.slice(0, -1 * length) : name;
  const indexRegex = new RegExp(`^${escapeRegExp(strippedName)}-(\\d+)$`);
  const newIndex =
    Math.max(
      ...filterArray([
        f.parseInt(indexString),
        ...usedNames.map((name) => f.parseInt(indexRegex.exec(name)?.[1]) ?? 1),
      ])
    ) + 1;
  const uniquePart = `-${newIndex}`;
  return newIndex === 1 && length === 0
    ? strippedName
    : `${strippedName}${uniquePart}`;
}

export const escapeRegExp = (string: string): string =>
  string.replace(/[$()*+.?[\\\]^{|}]/gu, '\\$&');

/**
 * Convert an array of [key,value] tuples to a RA<[key, RA<value>]>
 *
 * @remarks
 * KEY doesn't have to be a string. It can be of any time
 */
export const group = <KEY, VALUE>(
  entries: RA<readonly [key: KEY, value: VALUE]>
): RA<readonly [key: KEY, values: RA<VALUE>]> =>
  Array.from(
    entries
      // eslint-disable-next-line functional/prefer-readonly-type
      .reduce<Map<KEY, RA<VALUE>>>(
        (grouped, [key, value]) =>
          grouped.set(key, [...(grouped.get(key) ?? []), value]),
        new Map()
      )
      .entries()
  );
