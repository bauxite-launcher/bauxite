import React from 'react';
import gql from 'graphql-tag';
import { graphql, compose } from 'react-apollo';
import { withRouter, Link } from 'react-router-dom';
import { Header, Segment, Item, Loader, Dimmer } from 'semantic-ui-react';

const ServerListing = ({ match, data: { loading, servers = [] } }) => (
  <div>
    <Header as="h1">Servers</Header>
    <Item.Group>
      {loading ? (
        <Segment style={{ minHeight: 133 }}>
          <Dimmer active inverted>
            <Loader active>Loading server information&hellip;</Loader>
          </Dimmer>
        </Segment>
      ) : (
        servers.map(server => <ServerOverview key={server.id} match={match} {...server} />)
      )}
    </Item.Group>
  </div>
);

const ServerOverview = ({
  match,
  history,
  id,
  name,
  image,
  online,
  mcVersion,
  modpack,
  players
}) => (
  <Item href={`${match.url}/${id}`}>
    <Item.Image
      size="small"
      src={image}
      bordered
      rounded
      style={{ maxHeight: 65, overflow: 'hidden' }}
    />
    <Item.Content verticalAlign="middle">
      <Item.Header>{name}</Item.Header>
      <Item.Meta>
        {modpack} {modpack ? '─' : ''} Minecraft {mcVersion}
      </Item.Meta>
      <Item.Extra>
        {online ? (
          <span>
            {players.length || 'No'} player{players.length !== 1 ? 's' : ''}{' '}
            online
          </span>
        ) : (
          <span>Server offline</span>
        )}
      </Item.Extra>
    </Item.Content>
  </Item>
);

const withServerListing = graphql(gql`
  query getServersOverview {
    servers {
      id
      name
      image
      online
      mcVersion
      modpack
      players(online: true) {
        uuid
      }
    }
  }
`);

export default compose(withRouter, withServerListing)(ServerListing);
