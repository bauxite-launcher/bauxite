import React from 'react';
import { Container } from 'semantic-ui-react';
import { AppHeader, AppBody, AppFooter } from './layout';
import styles from './App.module.scss';
import 'semantic-ui-css/semantic.min.css';

const App = () => (
  <Container className={styles.App}>
    <AppHeader className={styles.Header} />
    <AppBody className={styles.Body} />
    <AppFooter className={styles.Footer} />
  </Container>
);

export default App;
