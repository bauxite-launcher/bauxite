import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

const withServerDetails = graphql(
  gql`
    query serverDetails($serverID: String!) {
      server(id: $serverID) {
        id
        name
        online
        mcVersion
        modpack
      }
    }
  `,
  {
    options: ({ match }) => ({ variables: { serverID: match.params.serverID } })
  }
);

export default withServerDetails;
