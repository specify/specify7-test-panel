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

export const getMostRecentTag = (tags: IR<string>) =>
  Object.entries(tags).sort(([_, dateLeft], [__, dateRight]) =>
    new Date(dateLeft).getTime() > new Date(dateRight).getTime() ? -1 : 1
  )[0][0];

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
