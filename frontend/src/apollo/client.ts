import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { authLink } from './authLink';

const httpLink = createHttpLink({ uri: 'http://localhost:4000/graphql' });

export const client = new ApolloClient({
  link: authLink.concat(httpLink as any) as any,
  cache: new InMemoryCache(),
});
