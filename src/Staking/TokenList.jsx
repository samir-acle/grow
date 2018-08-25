import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { drizzleConnect } from 'drizzle-react';
import { Box, Text } from 'grommet';
import { TokenBadge } from './TokenUI';
import StakingContainer from './StakingContainer';

class TokenList extends Component {
    constructor(props, context) {
        super(props);
        this.state = {
            tokens: [],
        };
    }

    componentDidMount() {
        const { tokenCount } = this.props;
        for (let i = 0; i < tokenCount; i++) {
            this.context.drizzle.contracts.GrowToken.methods.getOwnedToken(i).call({from: this.props.accounts[0]}, (err, data) => {
                if (err) return console.log(err);

                const { tokenId, detailsHash } = data;
                this.setState({
                   tokens: [...this.state.tokens, { tokenId, detailsHash }], 
                });
            });
        }
    }

    render() {
        return (
            <Box>
                <StakingContainer tokensForDeposit={this.state.tokens.map(t => t.tokenId)} />
            </Box>
        )
    }

}

TokenList.contextTypes = {
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
    };
};

export default drizzleConnect(TokenList, mapStateToProps, mapDispatchToProps);
