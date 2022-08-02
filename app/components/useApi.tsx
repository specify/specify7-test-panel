import React from 'react';

export function useAsync<Type>(
  callback: () => Promise<Type>
): Readonly<
  readonly [Type | string | undefined, (value: Type | string | undefined) => void]
> {
  const [value, setValue] = React.useState<Type | string | undefined>(
    undefined
  );

  const destructorCalled = React.useRef<boolean>(false);

  const saveStateUpdate = (newValue: typeof value) =>
    destructorCalled.current ? undefined : setValue(newValue);

  React.useEffect(() => {
    callback()
      .then(saveStateUpdate)
      .catch((error) => {
        console.error(error);
        saveStateUpdate(error.toString());
      });
    return () => {
      destructorCalled.current = true;
    };
  }, []);

  return [value, setValue];
}

export const useApi = <Type,>(endpoint: string) =>
  useAsync<{ readonly data: Type }>(async () =>
    fetch(endpoint).then(async (response) => {
      if (response.status === 404) throw new Error('API endpoint not found');
      const state = await response.json();
      if (response.status === 200) return state;
      else throw new Error(state.error ?? state ?? 'Unexpected Error Occurred');
    })
  );
