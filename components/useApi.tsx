import React from 'react';

export function useApi<Type>(endpoint: string): Type | undefined | string {
  const [value, setValue] = React.useState<undefined | string | Type>(
    undefined
  );

  const destructorCalled = React.useRef<boolean>(false);

  const saveStateUpdate = (newValue: typeof value) =>
    destructorCalled.current ? undefined : setValue(newValue);

  React.useEffect(() => {
    fetch(endpoint)
      .then(async (response) => {
        const state = await response.json();
        if (response.status === 200) saveStateUpdate(state);
        else saveStateUpdate(state.error);
      })
      .catch((error) => {
        console.error(error);
        saveStateUpdate(error.toString());
      });
    return () => {
      destructorCalled.current = true;
    };
  }, []);

  return value;
}
