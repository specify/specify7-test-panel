import { IR, RA } from './typescriptCommonTypes';

export const getMostCommonElement = <T>(array: RA<T>): T | undefined =>
  array.reduce<[number, T | undefined]>(
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
    : `${string.substr(0, maxLength - 3).trim()}...`;
