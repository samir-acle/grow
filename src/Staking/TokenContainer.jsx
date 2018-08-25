import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { drizzleConnect } from 'drizzle-react';
import { Box, Text } from 'grommet';
import TokenList from './TokenList';

class TokenContainer extends Component {
    constructor(props, context) {
        super(props);

        this.state = {
            depositedTokens: [],
            stakedTokens: [],
            growTokensOwned: [],
        };

        this.growTokenContract = context.drizzle.contracts.GrowToken;
        this.gtDataKey = this.growTokenContract.methods.balanceOf.cacheCall(this.props.accounts[0]);
    }

    render() {
        const data = this.props.contracts.GrowToken.balanceOf[this.gtDataKey];
        if (!data || !data.value) return null;

        const numberOfOwnerTokens = data.value;

        return (
            <Box>
                <TokenList tokenCount={numberOfOwnerTokens} />
            </Box>
        );
    }
}

TokenContainer.contextTypes = {
    drizzle: PropTypes.object,
    drizzleStore: PropTypes.object,
};

const mapDispatchToProps = dispatch => {
    return {

    }
};

const mapStateToProps = state => {
    return {
        accounts: state.accounts,
        contracts: state.contracts,
    };
};

export default drizzleConnect(TokenContainer, mapStateToProps, mapDispatchToProps);
