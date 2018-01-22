import React from 'react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { Statistic, Icon } from 'semantic-ui-react';

const weatherIcons = {
  CLEAR: 'sun',
  RAIN: 'rain',
  STORM: 'lightning'
};

const weatherLabels = {
  CLEAR: 'Sunny',
  RAIN: 'Raining',
  STORM: 'Storm'
};

const ServerWeather = ({ data: { loading, server } }) =>
  !loading && (
    <Statistic.Group size="small" widths={3}>
      <Statistic color="olive">
        <Statistic.Value>
          <Icon name={weatherIcons[server.weather]} />
        </Statistic.Value>
        <Statistic.Label>{weatherLabels[server.weather]}</Statistic.Label>
      </Statistic>
      <Statistic color="green">
        <Statistic.Value>{server.time.text.slice(0, -2)}</Statistic.Value>
        <Statistic.Label>{server.time.timeOfDay}</Statistic.Label>
      </Statistic>
      <Statistic color="teal">
        <Statistic.Value>{server.players.length}</Statistic.Value>
        <Statistic.Label>Players Online</Statistic.Label>
      </Statistic>
    </Statistic.Group>
  );

const withServerWeather = graphql(
  gql`
    query serverWeather($serverID: String!) {
      server(id: $serverID) {
        id
        weather
        time {
          text
          timeOfDay
        }
        players(online: true) {
          uuid
        }
      }
    }
  `,
  { options: ({ serverID }) => ({ variables: { serverID } }) }
);

export default withServerWeather(ServerWeather);
