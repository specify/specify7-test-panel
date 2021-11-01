import React from 'react';

export function useAsync<Type>(
  callback: () => Promise<Type>
): Readonly<
  [Type | undefined | string, (value: Type | undefined | string) => void]
> {
  const [value, setValue] = React.useState<undefined | string | Type>(
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
  useAsync<{ readonly data: Type }>(() =>
    fetch(endpoint).then(async (response) => {
      const state = await response.json();
      if (response.status === 200) return state;
      else throw new Error(state.error || state);
    })
  );
