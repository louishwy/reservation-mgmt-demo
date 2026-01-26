import { setContext } from '@apollo/client/link/context';
import { getAuthToken } from './tokenStore';

export const authLink = setContext((_, { headers }) => {
  const token = getAuthToken();
  console.debug('[authLink] attaching token?', !!token);
  return {
    headers: {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  };
});
