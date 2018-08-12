import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { drizzleConnect } from 'drizzle-react';
import _ from 'lodash';
import { storeDataKey } from './actions';
import Pledge from './Pledge';
import IpfsRetriever from '../IPFS/IpfsRetriever';
import ContractStateRetriever from '../ContractStateRetriever';

const PledgeList = ({ account, numOfPledges }) => {
    const pledges = [];

    for (let i = 1; i <= numOfPledges; i++) {
        pledges.push(<Pledge key={`${account}${i}`} account={account} index={i} />);
    }

    return (
        <Fragment>
            {pledges}
        </Fragment>
    )
};

class Pledges extends Component {

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <ContractStateRetriever contract="Grow" method="userAddressToNumberOfPledges" args={[this.props.accounts[0]]} render={({ contractData }) => (
                <div>
                    <h1>PLEDGES</h1>
                    <PledgeList account={this.props.accounts[0]} numOfPledges={parseInt(contractData, 10)} />
                </div>
            )} />
        )
    }
}

Pledges.contextTypes = {
    drizzle: PropTypes.object,
    drizzleStore: PropTypes.object,
};

const mapDispatchToProps = dispatch => {
    return {

    };
};

const mapStateToProps = state => {
    return {
        accounts: state.accounts,
    };
};

export default drizzleConnect(Pledges, mapStateToProps, mapDispatchToProps);
