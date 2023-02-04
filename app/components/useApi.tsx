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
  }, [callback]);

  return [value, setValue];
}

export function useApi<TYPE>(
  endpoint: string,
  format: 'txt' | 'json' = 'json'
) {
  return useAsync<{ readonly data: TYPE }>(
    React.useCallback(
      async () => fetchApi(endpoint, format),
      [endpoint, format]
    )
  );
}

export const fetchApi = async (
  endpoint: string,
  format: 'txt' | 'json' = 'json'
) =>
  fetch(endpoint).then(async (response) => {
    if (response.status === 404) throw new Error('API endpoint not found');
    const textResponse = await response.text();
    try {
      const state =
        format === 'json' ? JSON.parse(textResponse) : { data: textResponse };
      if (response.status === 200) return state;
      else throw new Error(state.error ?? state ?? 'Unexpected Error Occurred');
    } catch {
      return textResponse;
    }
  });
