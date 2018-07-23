import React, { Component } from "react";
import { drizzleConnect } from "drizzle-react";
import { ContractData, ContractForm } from "drizzle-react-components";

class App extends Component {
  render() {
    const { drizzleStatus, accounts } = this.props;

    if (drizzleStatus.initialized) {
      return (
        <div className="App">
          <header className="App-header">
            <h1 className="App-title">Social Pressure</h1>
            {/* <p>
              <strong>Total Supply</strong>:{" "}
              <ContractData
                contract="TutorialToken"
                method="totalSupply"
                methodArgs={[{ from: accounts[0] }]}
              />{" "}
              <ContractData
                contract="TutorialToken"
                method="symbol"
                hideIndicator
              />
            </p>
            <p> */}
              {/* <strong>My Balance</strong>:{" "}
              <ContractData
                contract="TutorialToken"
                method="balanceOf"
                methodArgs={[accounts[0]]}
              />
            </p> */}
            <h3>Create Pledge</h3>
          </header>
          <div className="App-intro">
            <ContractForm
              contract="Pressure"
              method="initPledge"
              labels={["End Date", "Number of Proofs", "Title", "Details for Proof"]}
            />
          </div>
        </div>
      );
    }

    return <div>Loading dapp...</div>;
  }
}

const mapStateToProps = state => {
  return {
    accounts: state.accounts,
    drizzleStatus: state.drizzleStatus,
    TutorialToken: state.contracts.TutorialToken
  };
};

const AppContainer = drizzleConnect(App, mapStateToProps);
export default AppContainer;
