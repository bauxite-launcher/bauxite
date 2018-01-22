import React from 'react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { Link } from 'react-router-dom';
import { Segment, Loader, Dimmer, Grid, Statistic } from 'semantic-ui-react';

export const OnlineServersCount = ({ onlineServers }) => (
  <Link to="/servers">
    <Statistic size="huge" color="green">
      <Statistic.Value>{onlineServers}</Statistic.Value>
      <Statistic.Label>
        Server{onlineServers === 1 ? '' : 's'} Online
      </Statistic.Label>
    </Statistic>
  </Link>
);

export const OnlinePlayersCount = ({ onlinePlayers }) => (
  <Link to="/players">
    <Statistic size="huge" color="teal">
      <Statistic.Value>{onlinePlayers}</Statistic.Value>
      <Statistic.Label>
        Player{onlinePlayers === 1 ? '' : 's'} Online
      </Statistic.Label>
    </Statistic>
  </Link>
);

export const TotalPlayTime = ({ totalHoursPlayed }) => (
  <Statistic size="huge" color="blue">
    <Statistic.Value>{formatNumber(totalHoursPlayed)}</Statistic.Value>
    <Statistic.Label>Hours Played</Statistic.Label>
  </Statistic>
);
export const BlocksMined = ({ blocksMined }) => (
  <Statistic size="huge" color="violet">
    <Statistic.Value>{formatNumber(blocksMined)}</Statistic.Value>
    <Statistic.Label>Blocks Mined</Statistic.Label>
  </Statistic>
);

const formatNumber = num => {
  switch (true) {
    case num >= 1e9:
      return `${(num / 1e9).toFixed(1).toLocaleString()}B`;
    case num >= 1e6:
      return `${(num / 1e6).toFixed(1).toLocaleString()}M`;
    case num >= 1e3:
      return `${(num / 1e3).toFixed(0).toLocaleString()}k`;
    default:
      return num.toLocaleString();
  }
};

export const ServerStatistics = ({ data: { loading, statistics } }) => (
  <Segment basic style={{ minHeight: 133 }}>
    <Dimmer active={loading} inverted>
      <Loader active size="big">
        Loading server statistics&hellip;
      </Loader>
    </Dimmer>
    {!loading && (
      <Grid columns="four" divided>
        <Grid.Row>
          <Grid.Column textAlign="center">
            <OnlineServersCount onlineServers={statistics.onlineServers} />
          </Grid.Column>
          <Grid.Column textAlign="center">
            <OnlinePlayersCount onlinePlayers={statistics.onlinePlayers} />
          </Grid.Column>
          <Grid.Column textAlign="center">
            <TotalPlayTime totalHoursPlayed={statistics.totalHoursPlayed} />
          </Grid.Column>
          <Grid.Column textAlign="center">
            <BlocksMined blocksMined={statistics.blocksMined} />
          </Grid.Column>
        </Grid.Row>
      </Grid>
    )}
  </Segment>
);

export default graphql(gql`
  query getServerStatistics {
    statistics: serverStatistics {
      onlineServers
      onlinePlayers
      totalHoursPlayed
      blocksMined
    }
  }
`)(ServerStatistics);
