import React, { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { drizzleConnect } from 'drizzle-react';
import _ from 'lodash';
import { Box, Button } from 'grommet';
import IpfsRetriever from '../IPFS/IpfsRetriever';
import ContractStateRetriever from '../ContractStateRetriever';
import { Link } from 'react-router-dom';

const PledgeState = {
    '0': 'Active',
    '1': "Completed",
    '2': 'Expired',
};

export const PledgeDetails = ({ title, what, where, when, why }) => {
    return (
        <Box>
            <h2>Pledge Details</h2>
            <p>Title: {title}</p>
            <p>What: {what}</p>
            <p>Where: {where}</p>
            <p>When: {when}</p>
            <p>Why: {why}</p>
        </Box>
    )
}

// maybe HOC for active, expired, all, completed states...  could share with prood

export const FilterPledge = ({ pledge, requiredStates, id }) => {
    if (!requiredStates.includes(PledgeState[pledge.pledgeState])) return null;

    return (
        <PledgeListElement pledgeData={pledge} id={id} />
    )
};

const PledgeListElement = ({ pledgeData, id }, context) => {
    return (
        <Box>
            <IpfsRetriever hash={pledgeData.metadataHash} render={({ data }) => (
                <h2>{data.title}</h2>
            )} />
            <Link to={`/pledges/${id}`}>NewPledge</Link>
            {/* <Button label="view" onClick={() => context.router.history.push(`/pledges/${id}`)} /> */}
        </Box>
    )
};

PledgeListElement.contextTypes = {
    router: PropTypes.shape({
        history: PropTypes.object.isRequired,
    }),
};

export const PledgeView = (props) => {
    const { id } = props.match.params;

    return (
        <ContractStateRetriever contract="Grow" method="getPledge" args={[id]} render={({ contractData }) => (
            <Pledge pledgeData={contractData} />
        )} />
    )
}

const Pledge = ({ pledgeData }) => {
    return (
        <Box>
            <Box>
                <p>owner: {pledgeData.owner}</p>
                <p>collateral: {pledgeData.collateral}</p>
                <p>numOfProofs: {pledgeData.numOfProofs}</p>
                <div>proofs: {pledgeData.proofs.map(id => <p>{id}</p>)}</div>
            </Box>

            <IpfsRetriever hash={pledgeData.metadataHash} render={({ data }) => (
                <PledgeDetails {...data} />
            )} />
        </Box>
    )
};

class PledgeContainer extends Component {

    constructor(props, context) {
        super(props);
        this.state = {
            pledgeId: context.drizzle.web3.utils.soliditySha3(props.account, props.index),
        };
    }

    render() {
        return (
            <ContractStateRetriever contract="Grow" method="getPledge" args={[this.state.pledgeId]} render={({ contractData }) => (
                <FilterPledge pledge={contractData} requiredStates={this.props.requiredStates} id={this.state.pledgeId} />
            )} />
        )
    }
}

PledgeContainer.contextTypes = {
    drizzle: PropTypes.object,
    drizzleStore: PropTypes.object,
};

// prop types

const mapDispatchToProps = dispatch => {
    return {

    };
};

const mapStateToProps = state => {
    return {
        accounts: state.accounts,
        contract: state.contracts.Grow,
    };
};

export default drizzleConnect(PledgeContainer, mapStateToProps, mapDispatchToProps);
