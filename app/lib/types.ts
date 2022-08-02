/** Filter undefined items out of the array */
export const filterArray = <T>(
  array: readonly (T | undefined)[]
): readonly T[] => array.filter((item): item is T => item !== undefined);
