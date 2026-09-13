import { useMemo } from 'react';
import { useMsal } from '@azure/msal-react';
import { createHttpClient } from '../api/httpClient';

/**
 * Wrapper delgado: cada página que necesite llamar al BFF usa
 * const api = useApi(); api.get('/api/shipments')
 */
export function useApi() {
  const { instance } = useMsal();
  return useMemo(() => createHttpClient(instance), [instance]);
}
