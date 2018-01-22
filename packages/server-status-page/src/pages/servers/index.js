import React from 'react';
import { Switch, Route } from 'react-router-dom';
import ServerListing from './serverListing';
import ServerDetails from './serverDetails';

const ServerPage = ({ match }) => (
  <Switch>
    <Route exact path={match.url} component={ServerListing} />
    <Route path={`${match.url}/:serverID`} component={ServerDetails} />
  </Switch>
)

export default ServerPage
