import React, { Component } from "react";
import { drizzleConnect } from "drizzle-react";
import { Box, Grid, Button, Grommet } from 'grommet';

import NewPledge from "./Pledge/Create/NewPledge";
import Pledges from "./Pledge/Pledges";
import { PledgeView } from "./Pledge/Pledge";
import NewProofContainer from "./Proof/NewProofContainer";
import TokenContainer from "./Staking/TokenContainer";
import { BrowserRouter as Router, Link, Route, Switch } from 'react-router-dom';
import NavHeader from './NavHeader';

class App extends Component {
  render() {
    const { drizzleStatus, accounts } = this.props;

    if (drizzleStatus.initialized) {
      return (
          <Router>
            <div className="App">
              {/* check grid availability */}
              <Grid
                areas={[
                  { name: 'nav', start: [0, 0], end: [2, 0] },
                  { name: 'side', start: [0, 1], end: [0, 2] },
                  { name: 'content', start: [1, 1], end: [2, 2] },
                ]}
                columns={['small', 'medium', 'flex']}
                rows={['xsmall', 'medium', 'flex']}
                gap='none'
                fill="true"
              >
                <Box gridArea="nav">
                  <NavHeader />
                </Box>

                <Box gridArea="side">
                  <Route path="/pledges" component={Pledges} />
                </Box>

                {/* TODO - consistantyl use render props? */}
                <Box gridArea="content">
                  <Switch>
                    <Route exact={true} path="/pledges/new" component={NewPledge} />
                    <Route exact={true} path="/pledges/:id" render={props => <PledgeView key={props.match.params.id} {...props} />} />
                    <Route path="/proofs/:proofId/submit" render={props => <NewProofContainer key={props.match.params.proofId} proofId={props.match.params.proofId} {...props} />} />
                    <Route path="/tokens" component={TokenContainer} />
                  </Switch>
                </Box>

                {/* <Route path="/proofs/:id" component={ProofView} /> */}
                {/* <Route path="/proofs/submit" component={NewProof} /> */}
                {/* <Link to='/pledges/new'>Create Pledge</Link>
                <Link to='/proofs'>View Proofs</Link>
                <Link to='/proofs/submit'>Submit Proof</Link> */}
              </Grid>
            </div>
          </Router>
      );
    }

    return <div>Loading dapp...</div>;
  }
}

const mapStateToProps = state => {
  return {
    accounts: state.accounts,
    drizzleStatus: state.drizzleStatus,
  };
};

const AppContainer = drizzleConnect(App, mapStateToProps);
export default AppContainer;
