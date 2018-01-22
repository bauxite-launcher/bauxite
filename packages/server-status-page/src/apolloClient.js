import { ApolloClient } from 'apollo-client';
import { HttpLink } from 'apollo-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';

export default new ApolloClient({
  link: new HttpLink({
    uri: 'https://minecraft.jimmed.net/status-api/graphql/'
  }),
  cache: new InMemoryCache()
});
