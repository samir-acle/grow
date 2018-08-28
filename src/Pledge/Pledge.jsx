import React, { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { drizzleConnect } from 'drizzle-react';
import _ from 'lodash';
import { Box, Button, Heading, Text, Paragraph } from 'grommet';
import IpfsRetriever from '../IPFS/IpfsRetriever';
import ContractStateRetriever from '../ContractStateRetriever';
import { Link } from 'react-router-dom';
import Proofs from '../Proof/Proofs';
import { PledgeState } from '../constants';
import { StyledLink } from '../GeneralUI';

const PledgeDetailItem = ({ label, value }) => {
    return (
        <Box direction="row" justify="start">
            <Box width="small" margin={{ right: "medium" }}><Text color="neutral-1" textAlign="end">{label}: </Text></Box>
            <Box margin={{ left: "small", right: "small" }} fill="true"><Paragraph textAlign="start" margin={{ top: "none", bottom: "small" }}>{value}</Paragraph></Box>
        </Box>
    )
}

export const PledgeDetails = ({ title, what, where, when, why }) => {
    return (
        <Box pad="large">
            <Box direction="column" border="all" round="small" width="large">
                <Box><Heading level="2" textAlign="center" color="neutral-2">Pledge Details</Heading></Box>
                <PledgeDetailItem label="Title" value={title} />
                <PledgeDetailItem label="What" value={what} />
                <PledgeDetailItem label="Where" value={where} />
                <PledgeDetailItem label="When" value={when} />
                <PledgeDetailItem label="Why" value={why} />
            </Box>
        </Box>
    )
}

// maybe HOC for active, expired, all, completed states...  could share with proof

export const FilterPledge = ({ pledge, requiredStates, id }) => {
    if (!requiredStates.includes(PledgeState[pledge.pledgeState])) return null;

    return (
        <PledgeListElement pledgeData={pledge} id={id} />
    )
};

const PledgeListElement = ({ pledgeData, id }, context) => {
    return (
        <Box>
            <IpfsRetriever hash={pledgeData.metadata} render={({ data }) => (
                <Box border={{ color: 'accent-2', side: 'bottom', size: 'small' }} margin={{ left: 'small' }}>
                    <StyledLink to={`/pledges/${id}`}>
                        <Heading level="4" color="brand" truncate={true} margin="xsmall">{data.title}</Heading>
                    </StyledLink>
                </Box>
            )} />
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
            <Box width="large" pad="small" direction="column" gap="small">
                <Pledge pledgeData={contractData} />
                <Proofs proofIds={contractData.proofs} pledgeId={id} />
            </Box>
        )} />
    )
}

const Pledge = ({ pledgeData }) => {
    return (
        <IpfsRetriever hash={pledgeData.metadata} render={({ data }) => (
            <PledgeDetails {...data} />
        )} />
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
