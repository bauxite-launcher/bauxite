import React from 'react';
import { Menu } from 'semantic-ui-react';
import cx from 'classnames';
import { withRouter } from 'react-router-dom';

const MENU_ITEMS = [
  { key: 'dashboard', name: 'Dashboard' },
  { key: 'servers', name: 'Servers' },
  // { key: 'players', name: 'Players' }
];

const markActive = (items, url) => {
  const [active] = url.slice(1).split(/\//g);
  return items.map(
    item => (item.key === active ? { ...item, active: true } : item)
  );
};

const AppHeader = ({ className, history }) => (
  <Menu
    stackable
    className={cx(className)}
    items={markActive(MENU_ITEMS, history.location.pathname)}
    onItemClick={(event, { index }) =>
      history.push(`/${MENU_ITEMS[index].key}`)
    }
  />
);

export default withRouter(AppHeader);
