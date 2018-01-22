import React from 'react';
import cx from 'classnames';
import { Route, Redirect, Switch } from 'react-router-dom';
import { DashboardPage, ServersPage, PlayersPage } from '../pages';

const AppBody = ({ className }) => (
  <div className={cx(className)}>
    <Switch>
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/servers" component={ServersPage} />
      <Route path="/players" component={PlayersPage} />
      <Redirect from="/" to="/dashboard" />
    </Switch>
  </div>
);

export default AppBody;
