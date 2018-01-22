import React from 'react';
import cx from 'classnames';
import { Divider } from 'semantic-ui-react';

const AppFooter = ({ className }) => (
  <Divider horizontal className={cx(className)}>
    Crafted with love by{' '}
    <a href="https://github.com/jimmed" target="_blank" rel="noopener noreferrer">
      jimotosan
    </a>
  </Divider>
);

export default AppFooter;
