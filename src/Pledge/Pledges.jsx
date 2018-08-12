import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { drizzleConnect } from 'drizzle-react';
import _ from 'lodash';
import { storeDataKey } from './actions';
import PledgeContainer from './Pledge';
import IpfsRetriever from '../IPFS/IpfsRetriever';
import ContractStateRetriever from '../ContractStateRetriever';
import { Link } from 'react-router-dom';
import { Button } from 'grommet';


const PledgeList = ({ account, numOfPledges, requiredStates }) => {
    const pledges = [];

    for (let i = 1; i <= numOfPledges; i++) {
        pledges.push(<PledgeContainer key={`${account}${i}`} account={account} index={i} requiredStates={requiredStates} />);
    }

    return (
        <Fragment>
            {pledges}
        </Fragment>
    )
};

class Pledges extends Component {
    static defaultProps = {
        requiredStates: ['Active', 'Expired', 'Completed'],
    };

    // TODO - refactor other components to do this

    static contextTypes = {
        drizzle: PropTypes.object,
        drizzleStore: PropTypes.object,
        router: PropTypes.shape({
            history: PropTypes.object.isRequired,
        }),
    };

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <ContractStateRetriever contract="Grow" method="userAddressToNumberOfPledges" args={[this.props.accounts[0]]} render={({ contractData }) => (
                <div>
                    <h1>PLEDGES</h1>
                    {/* <Button label="New Pledge" onClick={() => this.context.router.history.push('/pledges/new')} /> */}
                    <Link to={`/pledges/new`}><Button label="New Pledge" onClick={() => ({})}/></Link>
                    <PledgeList account={this.props.accounts[0]} numOfPledges={parseInt(contractData, 10)} requiredStates={this.props.requiredStates} />
                </div>
            )} />
        )
    }
}

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
