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
import { Button, Box, Heading } from 'grommet';
import styled from 'styled-components';
import { StyledLink } from '../GeneralUI';

const PledgeList = ({ account, numOfPledges, requiredStates }) => {
    const pledges = [];

    for (let i = 1; i <= numOfPledges; i++) {
        pledges.push(<PledgeContainer key={`${account}${i}`} account={account} index={i} requiredStates={requiredStates} />);
    }

    return (
        <Fragment>
            <Box direction="row" wrap={false} justify="between" margin={{ left: "small", right: "small" }} align="center">
                <Heading level="3">Pledges</Heading>
                <Box background="accent-3" border="all" round="medium" fill="vertical" pad="xsmall">
                    <StyledLink to={`/pledges/new`}>New</StyledLink>
                </Box>
            </Box>
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
    };

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <ContractStateRetriever contract="Grow" method="userAddressToNumberOfPledges" args={[this.props.accounts[0]]} render={({ contractData }) => (
                <Box background="light-3" fill={true}>
                    <PledgeList account={this.props.accounts[0]} numOfPledges={Number(contractData)} requiredStates={this.props.requiredStates} />
                </Box>
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
