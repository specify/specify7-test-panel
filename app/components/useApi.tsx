import React from 'react';

export function useAsync<TYPE>(
  callback: () => Promise<TYPE>
): readonly [
  TYPE | string | undefined,
  (value: TYPE | string | undefined) => void
] {
  const [value, setValue] = React.useState<TYPE | string | undefined>(
    undefined
  );

  React.useEffect(() => {
    let destructorCalled = false;
    callback()
      .then((newValue) => {
        if (destructorCalled) return;
        setValue(newValue);
      })
      .catch((error) => {
        console.error(error);
        setValue(error.toString());
      });
    return () => {
      destructorCalled = true;
    };
  }, []);

  return [value, setValue];
}

export function useApi<TYPE>(endpoint: string) {
  return useAsync<{ readonly data: TYPE }>(async () =>
    fetch(endpoint).then(async (response) => {
      if (response.status === 404) throw new Error('API endpoint not found');
      const state = await response.json();
      if (response.status === 200) return state;
      else throw new Error(state.error ?? state ?? 'Unexpected Error Occurred');
    })
  );
}
