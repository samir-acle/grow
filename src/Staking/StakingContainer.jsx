import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { drizzleConnect } from 'drizzle-react';
import { Box, Text } from 'grommet';
import { TokensDisplay } from './TokenUI';
import { web3ForEvents } from '../Web3/providers';
import { ProofState, SUBMITTED } from '../constants';

class StakingContainer extends Component {
    constructor(props, context) {
        super(props);

        this.state = {
            depositedTokens: [],
            stakedTokens: [],
            lastBlockNumber: null,
        };

        this.stakingContract = context.drizzle.contracts.Staking;
        this.growTokenContract = context.drizzle.contracts.GrowToken;
        this.growContract = context.drizzle.contracts.Grow;
        this.growForEvents = new web3ForEvents.eth.Contract(this.growContract.abi, this.growContract.address);
    }

    // TODO - make all async await

    componentDidMount = () => {
        this.populateDepositedTokens();
        this.populateStakedTokens();
        this.context.drizzle.web3.eth.getBlockNumber().then(num => this.setState({ lastBlockNumber: num }));
    }


    populateDepositedTokens = () => {
        return this.stakingContract.methods.getAvailableTokenCount().call()
            .then(count => {
                for (let i = 0; i < count; i++) {
                    this.stakingContract.methods.availableTokens(i).call()
                        .then(async token => {
                            const tokenId = Number(token);
                            if (await this.isUsersToken(tokenId)) {
                                return this.setState({
                                    depositedTokens: [...this.state.depositedTokens, token],
                                });
                            }
                        })
                }
            });
    }

    populateStakedTokens = () => {
        return this.stakingContract.methods.getStakedTokenCount().call()
            .then(count => {
                for (let i = 0; i < count; i++) {
                    this.stakingContract.methods.stakedTokens(i).call()
                        .then(async token => {
                            const tokenId = Number(token);
                            if (await this.isUsersToken(tokenId)) {
                                return this.setState({
                                    stakedTokens: [...this.state.stakedTokens, token],
                                });
                            }
                        })
                }
            });
    }

    isUsersToken = async (tokenId) => {
        const tokenOwner = await this.stakingContract.methods.tokenIdToOwner(tokenId).call();
        return tokenOwner && tokenOwner === this.props.accounts[0];
    }
    
    approveStakingContract = (tokenId) => {
        return this.growTokenContract.methods.approve(this.stakingContract.address, tokenId).send({ from: this.props.accounts[0] });
    }

    depositToken = (id) => {
        const tokenId = parseInt(id, 10);
        return this.approveStakingContract(tokenId)
            .then((receipt) => {
                return this.stakingContract.methods.deposit(tokenId).send({ from: this.props.accounts[0], gas: 300000 })
            });
    }

    stakeToken = (id) => {
        const NUM_BLOCKS_IN_A_WEEK = 41000;
        const tokenId = parseInt(id, 10);
        const { lastBlockNumber } = this.state;
        if (!lastBlockNumber) return;
        const fromBlock = lastBlockNumber > NUM_BLOCKS_IN_A_WEEK ? lastBlockNumber - NUM_BLOCKS_IN_A_WEEK : 0;

        this.growForEvents.getPastEvents('ProofSubmitted', { fromBlock, toBlock: 'latest' })
            .then(async logs => {
                // TODO - make sure first block is old enough, if not get more logs
                if (logs.length === 0) return console.log('No submitted proofs available to stake on'); // this should probs be done on mount and stored in state
                const { returnValues } = await this.getOldestSubmittedProofFromLogs(logs);
                return await this.growContract.methods.assignReviewer(returnValues.pledgeId, returnValues.proofId, tokenId).send({from: this.props.accounts[0]});
            });
    }

    getOldestSubmittedProofFromLogs = async (proofLogs) => {
        return await proofLogs.find(async (log) => {
            if (log.returnValues.userAddress === this.props.accounts[0]) return false;
            const proof = await this.growContract.methods.getProof(log.returnValues.pledgeId).call();
            return ProofState[proof.state] === SUBMITTED;
        });
    };

    render() {
        return (
            <TokensDisplay
                tokensForDeposit={this.props.tokensForDeposit}
                stakedTokens={this.state.stakedTokens}
                depositedTokens={this.state.depositedTokens}
                depositToken={this.depositToken}
                stakeToken={this.stakeToken}
            />
        );
    }
}

StakingContainer.contextTypes = {
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

export default drizzleConnect(StakingContainer, mapStateToProps, mapDispatchToProps);
