import React from 'react';
import { Grid, Segment, Dimmer, Loader, Header } from 'semantic-ui-react';
import ServerWeather from './serverWeather';

const ServerDetails = ({ data: { loading, server } }) =>
  loading ? (
    <Segment>
      <Dimmer active inverted>
        <Loader active>Loading server information&hellip;</Loader>
      </Dimmer>
    </Segment>
  ) : (
    <Grid columns={2}>
      <Grid.Row>
        <Grid.Column verticalAlign="middle">
          <Header as="h1" size="massive">
            <Header.Content>{server.name}</Header.Content>
            <Header.Subheader>
              {server.modpack} {server.modpack ? '─' : ''} Minecraft{' '}
              {server.mcVersion}
            </Header.Subheader>
          </Header>
        </Grid.Column>
        <Grid.Column verticalAlign="middle">
          <ServerWeather serverID={server.id} />
        </Grid.Column>
      </Grid.Row>
    </Grid>
  );

export default ServerDetails;
